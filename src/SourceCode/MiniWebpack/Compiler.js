const fs = require('fs');
const path = require('path');
// @babel/parser: 用于将源代码解析成 AST (抽象语法树)
// 就像把英语句子拆解成 主语、谓语、宾语 的语法结构树
const parser = require('@babel/parser');
// @babel/traverse: 用于遍历和更新 AST 节点
// 就像在语法树上爬行，找到我们感兴趣的节点（比如 import 语句）
const traverse = require('@babel/traverse').default;
// @babel/core: Babel 的核心库，这里主要用它将 AST 转换回代码
const { transformFromAst } = require('@babel/core');

let ID = 0;

/**
 * 1. 创建资源对象 (Asset)
 * 读取文件内容，提取依赖，并转换代码
 */
function createAsset(filename) {
    // 读取文件内容
    const content = fs.readFileSync(filename, 'utf-8');

    // 将代码解析为 AST (抽象语法树)
    // parser.parse() 会把字符串代码转换成一个深层嵌套的对象树，描述代码的语法结构
    // sourceType: 'module' 告诉 babel 我们解析的是 ES6 Module (包含 import/export)
    const ast = parser.parse(content, {
        sourceType: 'module',
    });

    // 存储该文件的依赖路径
    const dependencies = [];

    // 遍历 AST，寻找 import 声明
    // traverse() 接收两个参数：
    // 1. ast: 要遍历的语法树
    // 2. visitor: 一个对象，定义了我们想要访问的节点类型 (如 ImportDeclaration)
    traverse(ast, {
        // 每当遍历到一个 ImportDeclaration 节点 (即 import 语句) 时，就会调用这个函数
        ImportDeclaration: ({ node }) => {
            // node.source.value 获取 import 语句中的路径字符串
            // 例如: import message from './message.js' -> value 是 './message.js'
            dependencies.push(node.source.value);
        },
    });

    // 将 AST 转换为浏览器可运行的代码 (ES5)
    // 使用 transformFromAst 将 AST 重新生成代码
    // @babel/preset-env 是一个智能预设，能将现代 JS (ES6+) 转换为向后兼容的 JS (ES5)
    const { code } = transformFromAst(ast, null, {
        presets: ['@babel/preset-env'],
    });

    // 返回资源对象
    // id: 唯一标识符
    // filename: 文件路径
    // dependencies: 依赖列表 (相对路径)
    // code: 转译后的代码
    return {
        id: ID++,
        filename,
        dependencies,
        code,
    };
}

/**
 * 2. 创建依赖图 (Dependency Graph)
 * 从入口文件开始，递归解析所有依赖，生成一个图结构
 */
function createGraph(entry) {
    // 解析入口文件
    const mainAsset = createAsset(entry);

    // 使用队列来广度优先遍历所有依赖
    const queue = [mainAsset];

    // 遍历队列中的每一个资源
    for (const asset of queue) {
        // 该资源对应的依赖映射表 { relativePath: childId }
        asset.mapping = {};

        // 这里的 dirname 是当前 asset 文件所在的目录
        // 例如 src/MiniWebpack/example/entry.js -> src/MiniWebpack/example
        const dirname = path.dirname(asset.filename);

        // 遍历该资源的每一个依赖
        asset.dependencies.forEach(relativePath => {
            // 获取依赖的绝对路径
            const absolutePath = path.join(dirname, relativePath);

            // 解析依赖文件，生成新的子资源
            const child = createAsset(absolutePath);

            // 将依赖关系记录到 mapping 中
            // 比如: {'./message.js': 1}
            asset.mapping[relativePath] = child.id;

            // 将子资源加入队列，以便后续遍历它的依赖
            queue.push(child);
        });
    }

    // 返回队列，此时队列中包含了项目中所有的资源对象
    return queue;
}

/**
 * 3. 生成打包结果 (Bundle)
 * 将依赖图包装成一个立即执行函数 (IIFE)
 */
function bundle(graph) {
    let modules = '';

    // 遍历依赖图，构建 modules 对象字符串
    // 格式: id: [ function(require, module, exports){...}, mapping ]
    graph.forEach(mod => {
        // 注意：mod.code 是 babel 转译后的 CommonJS 代码，其中包含 require, module, exports
        // 我们需要把它们包装在一个函数中，防止变量污染，并注入我们可以控制的 require, module, exports
        modules += `${mod.id}: [
            function (require, module, exports) {
                ${mod.code}
            },
            ${JSON.stringify(mod.mapping)},
        ],`;
    });

    // 构建最终的自执行函数
    // 该函数接受 modules 对象作为参数
    const result = `
        (function(modules) {
            // 模块缓存
            // (虽然这个简单版本没做缓存，但标准 Webpack 会有 installedModules)

            // 自定义的 require 函数
            function require(id) {
                // 根据 id 获取模块：[fn, mapping]
                const [fn, mapping] = modules[id];

                // 定义一个辅助 require，用于处理模块内部的相对路径引用
                // 因为模块内部 import 是相对路径 ('./message.js')，而我们的 modules 是用 id 索引的
                function localRequire(name) {
                    // 根据相对路径 name，查 mapping 表找到对应的 id
                    return require(mapping[name]);
                }

                // 构造 module 对象
                const module = { exports: {} };

                // 执行模块代码
                // 传入: localRequire (作为 require), module, module.exports (作为 exports)
                fn(localRequire, module, module.exports);

                // 返回模块导出的内容
                return module.exports;
            }

            // 从入口模块 (id=0) 开始执行
            require(0);
        })({${modules}})
    `;

    return result;
}

module.exports = {
    createGraph,
    bundle
};

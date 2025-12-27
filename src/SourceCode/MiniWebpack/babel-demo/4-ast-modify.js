const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default; // 需要安装 @babel/generator，或者直接用 @babel/core 的 transformFromAst

// 如果没有 @babel/generator，我们可以用 core
const { transformFromAstSync } = require('@babel/core');

const code = `
  const a = 1;
  const b = 2;
  function add(x, y) {
      return x + y;
  }
`;

console.log('--- 修改前代码 ---');
console.log(code);

// 1. 解析 (Parse) -> 拿到 AST 树
const ast = parser.parse(code);

// 2. 遍历并修改 (Traverse & Modify) -> 给树做"手术"
traverse(ast, {
    // 任务1: 把所有的变量名 'a' 改成 'apple'
    Identifier(path) {
        if (path.node.name === 'a') {
            path.node.name = 'apple';
        }
    },
    
    // 任务2: 把所有的 const 改成 var
    VariableDeclaration(path) {
        if (path.node.kind === 'const') {
            path.node.kind = 'var';
        }
    },

    // 任务3: 给所有函数加一行 console.log('I am running!')
    FunctionDeclaration(path) {
        // 创建一个 console.log 语句的 AST 节点有点麻烦，这里简化演示
        // 我们直接修改函数名
        path.node.id.name = 'superAdd';
    }
});

// 3. 生成代码 (Generate) -> 树变回代码
// 使用 babel core 将修改后的 AST 转回代码
const { code: newCode } = transformFromAstSync(ast, null, {
    presets: [], // 不使用任何预设，保留原样格式
    ast: true,
    code: true
});

console.log('--- 修改后代码 ---');
console.log(newCode);

console.log('\n--- 总结 ---');
console.log('我们通过操作 AST 对象，成功地：');
console.log('1. 变量 a -> apple');
console.log('2. const -> var');
console.log('3. 函数 add -> superAdd');

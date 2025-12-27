const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const code = `
  import { hello } from './world';
  
  function add(a, b) {
    return a + b;
  }

  const result = add(1, 2);
`;

// 1. 先生成 AST
const ast = parser.parse(code, {
    sourceType: 'module' // 必须指定 module 才能解析 import/export
});

console.log('--- 开始遍历 AST ---');

// 2. 遍历 AST (Traverse)
// 我们可以在这里"监听"特定类型的节点
traverse(ast, {
    
    // 监听：函数声明
    FunctionDeclaration(path) {
        console.log(`\n[发现函数] 名字是: ${path.node.id.name}`);
        console.log(`  参数个数: ${path.node.params.length}`);
    },

    // 监听：Import 语句
    ImportDeclaration(path) {
        console.log(`\n[发现引用] 来源: ${path.node.source.value}`);
    },

    // 监听：变量声明
    VariableDeclaration(path) {
         // kind 表示是 const, let 还是 var
         console.log(`\n[发现变量] 类型: ${path.node.kind}`);
         // declarations 是一个数组，因为可以 const a=1, b=2;
         path.node.declarations.forEach(decl => {
             console.log(`  变量名: ${decl.id.name}`);
         });
    }
});

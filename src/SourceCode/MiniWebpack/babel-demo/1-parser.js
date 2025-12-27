const parser = require('@babel/parser');

// 1. 源代码
const code = `
  const a = 1;
  function add(x, y) {
    return x + y;
  }
`;

console.log('--- 源代码 ---');
console.log(code);

// 2. 解析 (Parse): 代码 -> AST
// parser.parse 返回一个 File 节点，它是 AST 的根节点
const ast = parser.parse(code);

console.log('\n--- AST (JSON结构) ---');
// JSON.stringify 第二个参数 null，第三个参数 2 用于美化输出
console.log(JSON.stringify(ast, null, 2));

console.log('\n--- 解释 ---');
console.log('你会看到一个巨大的 JSON 对象。');
console.log('program.body 数组里包含了两个主要节点：');
console.log('1. VariableDeclaration (变量声明): const a = 1');
console.log('2. FunctionDeclaration (函数声明): function add...');

const { transformFromAst } = require('@babel/core');
const parser = require('@babel/parser');

const code = `
  const hello = () => {
    console.log("Hello ES6!");
  };
  
  class Person {
    constructor(name) {
        this.name = name;
    }
  }
`;

console.log('--- 转换前 (ES6) ---');
console.log(code);

// 1. Parse
const ast = parser.parse(code);

// 2. Transform (转换)
// 使用 @babel/preset-env 将新语法转换为旧语法 (ES5)
const result = transformFromAst(ast, null, {
    presets: ['@babel/preset-env'],
});

console.log('\n--- 转换后 (ES5) ---');
console.log(result.code);

console.log('\n--- 解释 ---');
console.log('1. const 变成了 var');
console.log('2. 箭头函数变成了 function');
console.log('3. class 变成了构造函数 function Person...');
console.log('4. "use strict" 被自动添加了');

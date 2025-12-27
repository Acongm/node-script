const fs = require('fs');
const path = require('path');
const { createGraph, bundle } = require('./Compiler');

// 1. 定义入口文件路径
const entry = path.join(__dirname, 'example/entry.js');

// 2. 构建依赖图
const graph = createGraph(entry);
console.log('Dependency Graph Created:', graph.map(asset => asset.filename));

// 3. 生成打包代码
const result = bundle(graph);

// 4. 写入输出文件
const outputDir = path.join(__dirname, 'dist');
const outputPath = path.join(outputDir, 'bundle.js');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// 写入文件
fs.writeFileSync(outputPath, result);

console.log('Build completed successfully!');
console.log(`Output file: ${outputPath}`);

// 5. 简单的测试执行 (可选)
// 我们可以尝试 eval 一下生成的代码，看看是否能正常运行
console.log('\n--- Running Bundle ---');
try {
    eval(result);
} catch (error) {
    console.error('Execution failed:', error);
}
console.log('----------------------\n');

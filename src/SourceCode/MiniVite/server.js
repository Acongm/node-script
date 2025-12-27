const http = require('http');
const fs = require('fs');
const path = require('path');

// 模拟 Vite 服务器
const server = http.createServer((req, res) => {
    const { url } = req;
    console.log(`[Request] ${url}`);

    // 1. 处理根路径请求，返回 index.html
    if (url === '/') {
        const content = fs.readFileSync(path.join(__dirname, 'example/index.html'), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
        return;
    }

    // 2. 处理 JS 文件请求
    if (url.endsWith('.js')) {
        // 获取文件绝对路径
        const p = path.join(__dirname, 'example', url);
        
        if (fs.existsSync(p)) {
            const content = fs.readFileSync(p, 'utf-8');
            // 设置 Content-Type 为 javascript，这很重要
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            // 实际上 Vite 在这里会做 transform (比如把 vue 文件变成 js)
            // 也会做 import 路径重写 (比如 import vue from 'vue' -> '/@modules/vue')
            // 这里我们简化，直接返回原始内容
            res.end(content);
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
        return;
    }

    // 3. 其他资源
    res.writeHead(404);
    res.end('Not Found');
});

server.listen(3000, () => {
    console.log('Mini Vite Server running at http://localhost:3000');
    console.log('请在浏览器打开 http://localhost:3000 查看效果');
    console.log('观察控制台，你会发现请求是按需加载的！');
});

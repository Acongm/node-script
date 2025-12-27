# React 核心原理示例（Vite + React 版）

基于 Vite + React 的现代化示例代码，配合学习 React 核心原理。

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

浏览器会自动打开 http://localhost:3000

## 📚 示例列表

### 1. Key 错误使用示例（/key-anti-pattern）
- 演示使用 index 作为 key 的问题
- 对比正确使用 id 作为 key 的效果
- **学习时间：** 5 分钟
- **难度：** 初级

### 2. memo/useMemo/useCallback 优化（/memo-optimization）
- 对比优化前后的性能差异
- 实时渲染统计和控制台日志
- **学习时间：** 10 分钟
- **难度：** 中级

### 3. React 18 并发特性（/concurrent-features）
- Automatic Batching 演示
- useTransition 示例
- useDeferredValue 示例
- **学习时间：** 15 分钟
- **难度：** 中级

### 4. React 19 新特性（/react19-features）
- React Compiler 介绍
- Actions 概念演示
- use() API 说明
- **学习时间：** 20 分钟
- **难度：** 高级

### 5. Fiber 架构可视化（/fiber-visualization）
- Fiber 树结构展示
- 双缓冲机制图解
- 工作循环演示
- **学习时间：** 25 分钟
- **难度：** 高级

### 6. 性能对比工具（/performance-comparison）
- 实时性能指标监控
- 优化效果量化对比
- **学习时间：** 10 分钟
- **难度：** 中级

## 🎓 学习建议

1. 先阅读配套文档，理解理论知识
2. 按顺序运行示例，观察实际效果
3. 修改代码，尝试不同的场景
4. 使用 React DevTools Profiler 分析性能
5. 查看浏览器控制台的日志输出

## 🛠 技术栈

- **React 18.2** - UI 库
- **Vite 5** - 构建工具
- **React Router 6** - 路由管理

## 📖 配套文档

- [React 核心原理.md](../../mack/01-React核心原理.md) - 笔试题和面试题
- [React 核心原理-补充.md](../../mack/01-React核心原理-补充.md) - React 19 新特性详解

## 🔧 开发建议

### React DevTools
- 浏览器插件：查看组件树、props、state
- Profiler：分析性能瓶颈

### 控制台日志
- 观察组件渲染次数
- 查看计算执行日志
- 理解执行流程

### Performance 分析
1. 打开 Chrome DevTools
2. 切换到 Performance 标签
3. 录制操作过程
4. 分析 React 任务耗时

## 📝 其他命令

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 💡 学习路径

1. **首页** - 浏览所有示例概览（5 分钟）
2. **Key 反模式** - 理解 key 的重要性（5 分钟）
3. **性能优化** - 掌握 memo/useMemo/useCallback（10 分钟）
4. **React 18** - 学习并发特性（15 分钟）
5. **React 19** - 了解最新特性（20 分钟）
6. **Fiber 架构** - 深入理解原理（25 分钟）
7. **性能对比** - 量化优化效果（10 分钟）

**总学习时间：约 90 分钟**

## 🎉 开始学习

现在运行 `npm run dev`，开始你的 React 核心原理学习之旅吧！

祝学习愉快！ 🚀

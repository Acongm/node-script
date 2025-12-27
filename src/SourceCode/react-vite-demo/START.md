# 🚀 立即开始

## 1️⃣ 安装依赖

```bash
cd src/SourceCode/react-vite-demo
npm install
```

## 2️⃣ 启动项目

```bash
npm run dev
```

浏览器会自动打开 http://localhost:3000

## 3️⃣ 开始学习

### 首页
浏览 6 个示例的概览，了解每个示例的内容和学习时间

### 6 个交互式示例

| # | 示例名称 | 难度 | 时间 | 核心内容 |
|---|---------|------|------|---------|
| 01 | Key 反模式 | 初级 | 5分钟 | 理解 key 的作用和错误使用的后果 |
| 02 | 性能优化 | 中级 | 10分钟 | 掌握 memo/useMemo/useCallback |
| 03 | React 18 并发 | 中级 | 15分钟 | 学习 Automatic Batching、useTransition、useDeferredValue |
| 04 | React 19 特性 | 高级 | 20分钟 | 了解 Compiler、Actions、use() API |
| 05 | Fiber 架构 | 高级 | 25分钟 | 深入理解 Fiber、双缓冲、工作循环 |
| 06 | 性能对比 | 中级 | 10分钟 | 量化性能优化效果 |

**总学习时间：约 85 分钟**

## 📊 如何观察效果

### 1. 打开控制台（F12）

在每个示例中，控制台会输出详细的执行日志：
- 组件渲染日志
- 计算执行日志
- 性能统计数据

### 2. 使用 React DevTools

1. 安装浏览器插件：[React DevTools](https://react.dev/learn/react-developer-tools)
2. 打开 "Components" 标签查看组件树
3. 打开 "Profiler" 标签分析性能

### 3. 动手实验

- **Key 反模式**：在输入框输入文字后删除第一项
- **性能优化**：拖动滑块观察控制台日志
- **React 18**：快速输入观察 pending 状态
- **Fiber 架构**：点击不同节点查看详情
- **性能对比**：调整列表大小，点击"+1"按钮

## 💡 学习要点

### Key 反模式
- ✅ 为什么不能用 index 作为 key
- ✅ 使用稳定的 id 作为 key
- ✅ key 如何影响组件实例

### 性能优化
- ✅ JavaScript 引用类型的问题
- ✅ useMemo 缓存计算结果
- ✅ useCallback 缓存函数引用
- ✅ React.memo 组件记忆化
- ✅ 三者必须配合使用

### React 18 并发
- ✅ Automatic Batching 覆盖所有场景
- ✅ useTransition 区分紧急和非紧急更新
- ✅ useDeferredValue 延迟值更新

### React 19 特性
- ✅ React Compiler 自动优化
- ✅ Actions 简化表单处理
- ✅ use() API 统一资源读取
- ✅ ref 作为 prop
- ✅ Document Metadata 原生支持

### Fiber 架构
- ✅ Fiber 数据结构
- ✅ 双缓冲机制
- ✅ 工作循环原理
- ✅ 可中断渲染的实现

### 性能对比
- ✅ 量化优化效果
- ✅ 何时需要优化
- ✅ 何时不需要优化

## 🎓 推荐学习路径

### 新手路径（按顺序学习）
```
首页 → 01 Key → 02 性能优化 → 03 React 18 → 06 性能对比
```

### 进阶路径
```
首页 → 05 Fiber → 02 性能优化 → 03 React 18 → 04 React 19
```

### 快速路径（重点学习）
```
首页 → 02 性能优化 → 03 React 18 → 04 React 19
```

## 📚 配套资源

- `src/mack/01-React核心原理.md` - 笔试题和面试题（已完成答案）
- `src/mack/01-React核心原理-补充.md` - React 19 和性能优化深度解析

## 🎯 快速测试

启动后，你可以：

1. 点击导航栏切换不同示例
2. 在每个示例中动手操作
3. 观察左右对比的差异
4. 查看控制台日志
5. 尝试修改代码观察效果

---

现在运行 `npm run dev`，开始学习吧！ 🎉

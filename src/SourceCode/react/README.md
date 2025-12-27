# React 核心原理示例代码

本目录包含与 React 核心原理相关的示例代码，配合 `src/mack/01-React核心原理.md` 文档学习使用。

## 目录结构

```
react/
├── README.md                           # 本文件
├── 01-key-anti-pattern/                # Key 错误使用示例
│   ├── index.html
│   └── KeyDemo.jsx
├── 02-memo-useMemo-useCallback/        # 性能优化 Hooks 示例
│   ├── index.html
│   ├── WithoutOptimization.jsx         # 未优化版本
│   └── WithOptimization.jsx            # 优化版本
├── 03-react18-concurrent/              # React 18 并发特性
│   ├── index.html
│   ├── AutoBatching.jsx                # 自动批处理
│   ├── Transition.jsx                  # useTransition
│   └── DeferredValue.jsx               # useDeferredValue
├── 04-react19-features/                # React 19 新特性
│   ├── index.html
│   ├── Actions.jsx                     # useActionState
│   ├── UseAPI.jsx                      # use() API
│   └── Metadata.jsx                    # Document Metadata
├── 05-fiber-visualization/             # Fiber 架构可视化
│   ├── index.html
│   └── FiberTree.jsx
└── 06-performance-comparison/          # 性能对比工具
    ├── index.html
    └── PerformanceTest.jsx
```

## 运行示例

### 方式1：使用 Vite（推荐）

```bash
# 安装依赖
npm install vite @vitejs/plugin-react react react-dom

# 运行指定示例
cd 01-key-anti-pattern
npx vite

# 或者使用项目根目录的 vite
npm run dev
```

### 方式2：直接在浏览器中打开

每个示例目录都包含独立的 `index.html` 文件，可以直接在浏览器中打开。
使用 [Skypack CDN](https://www.skypack.dev/) 加载 React，无需本地安装。

```bash
# 使用简单的 HTTP 服务器
npx serve .
# 或
python3 -m http.server 8000
```

## 学习路径

建议按以下顺序学习：

1. **01-key-anti-pattern** - 理解 key 的作用和错误使用的后果
2. **02-memo-useMemo-useCallback** - 掌握性能优化的基本工具
3. **03-react18-concurrent** - 了解 React 18 并发特性
4. **04-react19-features** - 探索 React 19 新特性
5. **05-fiber-visualization** - 深入理解 Fiber 架构
6. **06-performance-comparison** - 量化性能优化效果

## 配套文档

- [01-React核心原理.md](../../mack/01-React核心原理.md) - 笔试题和面试题
- [01-React核心原理-补充.md](../../mack/01-React核心原理-补充.md) - React 19 新特性详解

## 注意事项

- 示例代码使用 React 18/19，需要相应版本的 React
- 部分示例需要在严格模式（Strict Mode）下运行
- 性能测试结果可能因设备而异


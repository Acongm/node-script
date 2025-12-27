# React 核心原理 - 纯代码示例

本目录包含纯粹的代码示例，去除了样式和 UI 展示部分，专注于核心逻辑的理解。

## 📚 目录结构

```
examples/
├── README.md                       # 本文件
├── 01-key-usage/                   # Key 的使用
│   ├── wrong.jsx                   # ❌ 错误：使用 index
│   └── correct.jsx                 # ✅ 正确：使用稳定 id
├── 02-memo-hooks/                  # 性能优化 Hooks
│   ├── without-optimization.jsx    # ❌ 未优化
│   ├── with-optimization.jsx       # ✅ 已优化
│   ├── useMemo-example.jsx         # useMemo 详解
│   └── useCallback-example.jsx     # useCallback 详解
├── 03-react18/                     # React 18 并发特性
│   ├── auto-batching.jsx           # 自动批处理
│   ├── use-transition.jsx          # useTransition
│   └── use-deferred-value.jsx      # useDeferredValue
├── 04-react19/                     # React 19 新特性
│   ├── before-compiler.jsx         # 编译器之前
│   ├── after-compiler.jsx          # 编译器之后
│   └── actions.jsx                 # Actions API
├── 05-fiber/                       # Fiber 架构
│   ├── fiber-structure.js          # Fiber 数据结构
│   └── work-loop.js                # 工作循环
└── 06-performance/                 # 性能对比
    ├── problem.jsx                 # 性能问题
    └── solution.jsx                # 解决方案
```

## 🎯 阅读顺序

### 1. Key 的使用 (5 分钟)
```
01-key-usage/wrong.jsx      → 理解问题
01-key-usage/correct.jsx    → 学习方案
```

### 2. 性能优化 (15 分钟)
```
02-memo-hooks/without-optimization.jsx  → 发现问题
02-memo-hooks/useMemo-example.jsx       → 理解 useMemo
02-memo-hooks/useCallback-example.jsx   → 理解 useCallback
02-memo-hooks/with-optimization.jsx     → 完整方案
```

### 3. React 18 并发 (15 分钟)
```
03-react18/auto-batching.jsx         → 自动批处理
03-react18/use-transition.jsx        → 过渡更新
03-react18/use-deferred-value.jsx    → 延迟值
```

### 4. React 19 特性 (10 分钟)
```
04-react19/before-compiler.jsx   → 手动优化
04-react19/after-compiler.jsx    → 自动优化
04-react19/actions.jsx           → Actions API
```

### 5. Fiber 架构 (15 分钟)
```
05-fiber/fiber-structure.js   → 数据结构
05-fiber/work-loop.js         → 工作循环
```

### 6. 性能对比 (10 分钟)
```
06-performance/problem.jsx    → 性能问题
06-performance/solution.jsx   → 优化方案
```

## 💡 如何阅读

1. **按顺序阅读** - 每个文件都有详细注释
2. **对比学习** - wrong vs correct, before vs after
3. **关注注释** - 注释解释了"为什么"
4. **理解原理** - 代码展示了"怎么做"

## 🔗 配合使用

- **先读代码** - 理解核心概念
- **再看文档** - `src/mack/01-React核心原理.md`
- **最后运行** - `src/demos/` 中的交互示例

## 📝 注释说明

- `// ❌ 问题：` - 指出问题所在
- `// ✅ 解决：` - 说明解决方案
- `// 💡 原理：` - 解释工作原理
- `// 📌 注意：` - 重要提示
- `// 🔍 观察：` - 需要关注的点


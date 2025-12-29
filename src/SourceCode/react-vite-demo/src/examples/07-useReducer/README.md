# useReducer vs useState 完全指南

## 🎯 核心区别

### useState - 简单状态管理
```javascript
const [state, setState] = useState(initialState)
```
- 适合：简单的、独立的状态
- 特点：直接设置新值

### useReducer - 复杂状态管理
```javascript
const [state, dispatch] = useReducer(reducer, initialState)
```
- 适合：复杂的、关联的状态
- 特点：通过 action 描述变化

## 📚 学习路径

1. **basic-comparison.jsx** - 基础对比（10分钟）
   - 同一功能的两种实现
   - 理解基本差异

2. **when-to-use-reducer.jsx** - 使用场景（15分钟）
   - 复杂状态逻辑
   - 多个子状态
   - 下一个状态依赖前一个状态

3. **real-world-examples.jsx** - 实际应用（20分钟）
   - 购物车
   - 表单管理
   - 复杂 UI 状态

4. **advanced-patterns.jsx** - 高级模式（15分钟）
   - 带 context 的 reducer
   - 中间件模式
   - immer 集成

5. **migration-guide.jsx** - 迁移指南（10分钟）
   - 从 useState 迁移到 useReducer
   - 重构建议

## 🤔 决策树

```
需要管理状态？
  ↓
是简单的单一值吗？（如 count、name、isOpen）
  ├─ 是 → useState ✅
  └─ 否 → 继续
       ↓
有多个相关联的子状态吗？
  ├─ 是 → useReducer ✅
  └─ 否 → 继续
       ↓
状态更新逻辑复杂吗？（多种操作类型）
  ├─ 是 → useReducer ✅
  └─ 否 → useState ✅
```

## 💡 快速参考

| 特性 | useState | useReducer |
|------|----------|------------|
| 使用场景 | 简单状态 | 复杂状态 |
| 状态数量 | 单一值 | 多个关联值 |
| 更新逻辑 | 简单 | 复杂（多种操作）|
| 学习曲线 | 简单 | 需要理解 Redux 概念 |
| 代码组织 | 分散 | 集中（reducer） |
| 测试 | 较难 | 容易（纯函数）|
| 可预测性 | 一般 | 高 |

## 🎯 学习目标

- ✅ 理解 useReducer 的工作原理
- ✅ 掌握何时使用 useReducer
- ✅ 学会编写 reducer 函数
- ✅ 理解 action 和 dispatch 的概念
- ✅ 掌握复杂状态的管理模式
- ✅ 学会从 useState 迁移到 useReducer





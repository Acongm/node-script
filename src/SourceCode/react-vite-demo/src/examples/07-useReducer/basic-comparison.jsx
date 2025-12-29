/**
 * useReducer vs useState 基础对比
 * 
 * 同一个计数器功能，分别用两种方式实现
 * 理解它们的基本差异
 */

import { useState, useReducer } from 'react'

// ==================== 方案 1：使用 useState ====================

function CounterWithState() {
  // 简单直接
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(count - 1)}>-1</button>
      <button onClick={() => setCount(0)}>重置</button>
    </div>
  )
}

/**
 * 💡 useState 特点：
 * 
 * 优点：
 * ✅ 简单直观
 * ✅ 代码少
 * ✅ 学习成本低
 * 
 * 缺点：
 * ❌ 更新逻辑分散在各处
 * ❌ 难以测试（逻辑在组件中）
 * ❌ 复杂时不易维护
 */

// ==================== 方案 2：使用 useReducer ====================

// 💡 Step 1: 定义状态的初始值
const initialState = { count: 0 }

// 💡 Step 2: 定义 action 类型（可选，但推荐）
const ActionTypes = {
  INCREMENT: 'INCREMENT',
  DECREMENT: 'DECREMENT',
  RESET: 'RESET',
}

// 💡 Step 3: 定义 reducer 函数
/**
 * reducer 是一个纯函数：(state, action) => newState
 * 
 * 参数：
 * - state: 当前状态
 * - action: 描述如何改变状态的对象
 * 
 * 返回：新的状态
 * 
 * 📌 规则：
 * 1. 纯函数：相同输入 → 相同输出
 * 2. 不能修改原 state（不可变性）
 * 3. 不能有副作用（API 调用、定时器等）
 */
function counterReducer(state, action) {
  // 根据 action.type 决定如何更新状态
  switch (action.type) {
    case ActionTypes.INCREMENT:
      return { count: state.count + 1 }
    
    case ActionTypes.DECREMENT:
      return { count: state.count - 1 }
    
    case ActionTypes.RESET:
      return { count: 0 }
    
    default:
      // 未知的 action，抛出错误
      throw new Error(`未知的 action 类型: ${action.type}`)
  }
}

function CounterWithReducer() {
  // 💡 Step 4: 使用 useReducer
  const [state, dispatch] = useReducer(counterReducer, initialState)
  // state: 当前状态
  // dispatch: 派发 action 的函数

  return (
    <div>
      <p>Count: {state.count}</p>
      
      {/* 💡 通过 dispatch 派发 action */}
      <button onClick={() => dispatch({ type: ActionTypes.INCREMENT })}>
        +1
      </button>
      <button onClick={() => dispatch({ type: ActionTypes.DECREMENT })}>
        -1
      </button>
      <button onClick={() => dispatch({ type: ActionTypes.RESET })}>
        重置
      </button>
    </div>
  )
}

/**
 * 💡 useReducer 特点：
 * 
 * 优点：
 * ✅ 更新逻辑集中在 reducer 中
 * ✅ 易于测试（reducer 是纯函数）
 * ✅ 易于维护（逻辑清晰）
 * ✅ 支持复杂的状态转换
 * ✅ 可以传递 dispatch 而不是多个 setState
 * 
 * 缺点：
 * ❌ 代码量多（需要定义 reducer、action）
 * ❌ 学习成本高（需要理解 Redux 概念）
 * ❌ 简单场景下过度设计
 */

// ==================== 对比总结 ====================

/**
 * 📊 代码量对比
 * 
 * useState:
 * - 1 行定义状态
 * - 3 个 onClick 直接调用 setState
 * - 总计：约 10 行代码
 * 
 * useReducer:
 * - 定义初始状态：1 行
 * - 定义 action 类型：5 行
 * - 定义 reducer：15 行
 * - 使用 useReducer：1 行
 * - 3 个 onClick 调用 dispatch
 * - 总计：约 30 行代码
 * 
 * 💡 结论：
 * 对于简单计数器，useState 更合适
 * 但当状态复杂时，useReducer 的优势就体现出来了
 */

// ==================== 扩展示例：带 payload 的 action ====================

const initialStateWithPayload = { count: 0 }

function counterReducerWithPayload(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 }
    
    case 'DECREMENT':
      return { count: state.count - 1 }
    
    case 'ADD':
      // 💡 action 可以携带数据（payload）
      return { count: state.count + action.payload }
    
    case 'SET':
      // 💡 直接设置为指定值
      return { count: action.payload }
    
    default:
      throw new Error(`未知的 action 类型: ${action.type}`)
  }
}

function CounterWithPayload() {
  const [state, dispatch] = useReducer(counterReducerWithPayload, initialStateWithPayload)

  return (
    <div>
      <p>Count: {state.count}</p>
      
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+1</button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-1</button>
      
      {/* 💡 传递额外数据 */}
      <button onClick={() => dispatch({ type: 'ADD', payload: 5 })}>
        +5
      </button>
      <button onClick={() => dispatch({ type: 'ADD', payload: 10 })}>
        +10
      </button>
      <button onClick={() => dispatch({ type: 'SET', payload: 100 })}>
        设置为 100
      </button>
    </div>
  )
}

/**
 * 💡 Action 对象结构
 * 
 * 标准格式（借鉴 Redux）：
 * {
 *   type: 'ACTION_TYPE',    // 必需：描述动作类型
 *   payload: value,         // 可选：携带的数据
 *   meta: {},              // 可选：元数据
 *   error: false           // 可选：是否是错误
 * }
 * 
 * 简化格式（常用）：
 * {
 *   type: 'ACTION_TYPE',
 *   payload: value
 * }
 * 
 * 最简格式（无数据）：
 * {
 *   type: 'ACTION_TYPE'
 * }
 */

// ==================== 测试 reducer（独立于组件）====================

/**
 * 💡 reducer 是纯函数，可以独立测试
 * 
 * 这是 useReducer 相比 useState 的一个重要优势
 */

// 测试示例
function testCounterReducer() {
  // 测试 INCREMENT
  const state1 = counterReducer({ count: 0 }, { type: 'INCREMENT' })
  console.assert(state1.count === 1, 'INCREMENT 应该 +1')

  // 测试 DECREMENT
  const state2 = counterReducer({ count: 5 }, { type: 'DECREMENT' })
  console.assert(state2.count === 4, 'DECREMENT 应该 -1')

  // 测试 RESET
  const state3 = counterReducer({ count: 10 }, { type: 'RESET' })
  console.assert(state3.count === 0, 'RESET 应该归零')

  console.log('✅ 所有测试通过')
}

/**
 * 📌 关键要点
 * 
 * useState 适合：
 * ✅ 简单的、独立的值（count、name、isOpen）
 * ✅ 不需要复杂的更新逻辑
 * ✅ 快速原型开发
 * 
 * useReducer 适合：
 * ✅ 多个相关联的状态
 * ✅ 复杂的状态更新逻辑
 * ✅ 状态更新依赖当前状态
 * ✅ 需要更好的可测试性
 * ✅ 需要集中管理状态逻辑
 * 
 * 💡 一般规则：
 * - 从 useState 开始
 * - 当逻辑变复杂时，重构为 useReducer
 * - 不要过早优化
 */

export { 
  CounterWithState, 
  CounterWithReducer, 
  CounterWithPayload,
  testCounterReducer 
}




/**
 * useReducer 高级模式
 * 
 * 1. 结合 Context 使用
 * 2. 惰性初始化
 * 3. 中间件模式
 * 4. TypeScript 类型安全
 */

import { useReducer, createContext, useContext } from 'react'

// ==================== 模式 1：useReducer + Context（Redux 模式）====================

/**
 * 💡 将 dispatch 通过 Context 传递给深层组件
 * 避免 props 层层传递（prop drilling）
 * 
 * 这是 Redux 的核心模式
 */

// 创建 Context
const TodoContext = createContext(null)
const TodoDispatchContext = createContext(null)

// Reducer
function todoReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, { id: Date.now(), text: action.payload, completed: false }]
    case 'TOGGLE':
      return state.map(todo =>
        todo.id === action.payload ? { ...todo, completed: !todo.completed } : todo
      )
    case 'DELETE':
      return state.filter(todo => todo.id !== action.payload)
    default:
      return state
  }
}

// Provider 组件
function TodoProvider({ children }) {
  const [todos, dispatch] = useReducer(todoReducer, [])

  return (
    <TodoContext.Provider value={todos}>
      <TodoDispatchContext.Provider value={dispatch}>
        {children}
      </TodoDispatchContext.Provider>
    </TodoContext.Provider>
  )
}

// 自定义 Hooks（封装 Context）
function useTodos() {
  const context = useContext(TodoContext)
  if (context === null) {
    throw new Error('useTodos 必须在 TodoProvider 内使用')
  }
  return context
}

function useTodoDispatch() {
  const context = useContext(TodoDispatchContext)
  if (context === null) {
    throw new Error('useTodoDispatch 必须在 TodoProvider 内使用')
  }
  return context
}

// 使用示例
function TodoList() {
  const todos = useTodos()  // 只读取数据，不会因为 dispatch 变化而重渲染
  
  return (
    <ul>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  )
}

function TodoItem({ todo }) {
  const dispatch = useTodoDispatch()  // 只使用 dispatch
  
  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => dispatch({ type: 'TOGGLE', payload: todo.id })}
      />
      <span>{todo.text}</span>
      <button onClick={() => dispatch({ type: 'DELETE', payload: todo.id })}>
        删除
      </button>
    </li>
  )
}

function AddTodoForm() {
  const dispatch = useTodoDispatch()
  const [text, setText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch({ type: 'ADD', payload: text })
    setText('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button type="submit">添加</button>
    </form>
  )
}

// 应用根组件
function App() {
  return (
    <TodoProvider>
      <AddTodoForm />
      <TodoList />
    </TodoProvider>
  )
}

/**
 * 💡 useReducer + Context 的优势
 * 
 * 1. 避免 props drilling：
 *    - 深层组件直接访问 dispatch
 *    - 不需要层层传递回调函数
 * 
 * 2. 性能优化：
 *    - 分离 state 和 dispatch 的 Context
 *    - 只使用 dispatch 的组件不会因为 state 变化而重渲染
 * 
 * 3. 代码组织：
 *    - 状态逻辑集中在 reducer
 *    - 组件只负责 UI
 *    - 职责清晰
 * 
 * 4. 类似 Redux：
 *    - 但不需要额外的库
 *    - 更轻量
 *    - 学习 Redux 的好起点
 */

// ==================== 模式 2：惰性初始化 ====================

/**
 * 💡 当初始状态需要复杂计算时使用
 * 避免每次渲染都执行计算
 */

// ❌ 问题：每次渲染都执行 getInitialState
function ComponentBad() {
  const [state, dispatch] = useReducer(
    reducer,
    getInitialState()  // ❌ 每次渲染都执行
  )
}

// ✅ 解决：使用惰性初始化
function init(initialArg) {
  // 💡 这个函数只在首次渲染时执行一次
  console.log('💡 初始化状态（只执行一次）')
  
  // 从 localStorage 读取
  const saved = localStorage.getItem('todos')
  if (saved) {
    return JSON.parse(saved)
  }
  
  // 或者执行复杂计算
  return initialArg
}

function ComponentGood() {
  const [state, dispatch] = useReducer(
    reducer,
    initialTodoState,  // 初始参数
    init               // 💡 惰性初始化函数
  )
  // 工作原理：
  // state = init(initialTodoState)
  // 只在首次渲染时执行
}

/**
 * 💡 惰性初始化的使用场景
 * 
 * ✅ 从 localStorage 读取
 * ✅ 从 URL 参数解析
 * ✅ 复杂的初始计算
 * ✅ 需要访问 props 来初始化
 */

// ==================== 模式 3：Action Creator（优化调用）====================

/**
 * 💡 封装 action 的创建逻辑
 * 让调用更简洁、类型更安全
 */

// Action Creator 函数
const todoActionCreators = {
  addTodo: (text) => ({
    type: 'ADD',
    payload: text
  }),
  
  toggleTodo: (id) => ({
    type: 'TOGGLE',
    payload: id
  }),
  
  deleteTodo: (id) => ({
    type: 'DELETE',
    payload: id
  }),
  
  // 带验证的 action creator
  updateTodo: (id, text) => {
    if (text.trim() === '') {
      throw new Error('Todo 文本不能为空')
    }
    return {
      type: 'UPDATE',
      payload: { id, text }
    }
  },
}

function TodoComponent() {
  const [todos, dispatch] = useReducer(todoReducer, [])

  // ❌ 之前：手动构造 action 对象
  // dispatch({ type: 'ADD', payload: 'New Todo' })

  // ✅ 现在：使用 action creator
  const handleAdd = (text) => {
    dispatch(todoActionCreators.addTodo(text))
  }

  const handleToggle = (id) => {
    dispatch(todoActionCreators.toggleTodo(id))
  }

  // 💡 优点：
  // 1. 代码更简洁
  // 2. 类型安全（配合 TypeScript）
  // 3. 可以添加验证逻辑
  // 4. 易于复用

  return <div>{/* ... */}</div>
}

// ==================== 模式 4：中间件模式（日志、分析）====================

/**
 * 💡 在 dispatch 前后添加额外逻辑
 * 类似 Redux 的中间件
 */

function reducerWithLogger(reducer) {
  return (state, action) => {
    console.group('🔍 Reducer 执行')
    console.log('Previous State:', state)
    console.log('Action:', action)
    
    const nextState = reducer(state, action)
    
    console.log('Next State:', nextState)
    console.groupEnd()
    
    return nextState
  }
}

// 使用
function ComponentWithLogger() {
  const [state, dispatch] = useReducer(
    reducerWithLogger(todoReducer),  // 💡 包裹原始 reducer
    initialTodoState
  )
  
  // 现在每次 dispatch 都会打印日志
  dispatch({ type: 'ADD', payload: 'Test' })
}

/**
 * 💡 其他中间件示例
 */

// 性能监控中间件
function reducerWithPerformance(reducer) {
  return (state, action) => {
    const start = performance.now()
    const nextState = reducer(state, action)
    const end = performance.now()
    
    console.log(`⏱ ${action.type} 耗时: ${(end - start).toFixed(2)}ms`)
    
    return nextState
  }
}

// 持久化中间件
function reducerWithPersistence(reducer, storageKey) {
  return (state, action) => {
    const nextState = reducer(state, action)
    
    // 💡 每次状态变化都保存到 localStorage
    localStorage.setItem(storageKey, JSON.stringify(nextState))
    
    return nextState
  }
}

// 错误边界中间件
function reducerWithErrorBoundary(reducer) {
  return (state, action) => {
    try {
      return reducer(state, action)
    } catch (error) {
      console.error('❌ Reducer 执行错误:', error)
      // 返回原状态或错误状态
      return {
        ...state,
        error: error.message
      }
    }
  }
}

// 组合多个中间件
function composeReducers(...middlewares) {
  return (reducer) => {
    return middlewares.reduceRight(
      (wrappedReducer, middleware) => middleware(wrappedReducer),
      reducer
    )
  }
}

// 使用
function ComponentWithMiddlewares() {
  const enhancedReducer = composeReducers(
    reducerWithLogger,
    reducerWithPerformance,
    reducerWithErrorBoundary
  )(todoReducer)

  const [state, dispatch] = useReducer(enhancedReducer, initialTodoState)
  
  // 💡 现在 dispatch 会依次经过：
  // 1. 日志中间件
  // 2. 性能监控中间件
  // 3. 错误边界中间件
  // 4. 原始 reducer
}

/**
 * 🎯 高级模式总结
 * 
 * Context + useReducer：
 * ✅ 全局状态管理（轻量级 Redux）
 * ✅ 避免 props drilling
 * ✅ 性能优化（分离 state 和 dispatch）
 * 
 * 惰性初始化：
 * ✅ 优化初始化性能
 * ✅ 从外部源读取状态
 * 
 * Action Creator：
 * ✅ 简化调用
 * ✅ 类型安全
 * ✅ 复用逻辑
 * 
 * 中间件模式：
 * ✅ 日志记录
 * ✅ 性能监控
 * ✅ 持久化
 * ✅ 错误处理
 * 
 * 💡 这些模式让 useReducer 的能力接近 Redux
 * 但不需要引入额外的库
 */

// 占位
function reducer(state, action) { return state }

export {
  TodoProvider,
  useTodos,
  useTodoDispatch,
  reducerWithLogger,
  reducerWithPerformance,
  reducerWithPersistence,
  composeReducers
}


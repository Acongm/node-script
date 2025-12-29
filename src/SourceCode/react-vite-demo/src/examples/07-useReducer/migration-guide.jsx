/**
 * 从 useState 迁移到 useReducer 指南
 * 
 * 展示如何识别需要重构的代码
 * 以及如何逐步迁移
 */

import { useState, useReducer } from 'react'

// ==================== 识别信号：何时应该迁移 ====================

/**
 * 🚨 迁移信号（出现这些情况考虑使用 useReducer）
 * 
 * 1. 多个相关的 useState
 * 2. 复杂的 setState 逻辑
 * 3. 状态更新依赖前一个状态
 * 4. 多个组件需要相同的状态逻辑
 * 5. 需要更好的测试能力
 */

// ==================== 迁移步骤示例 ====================

// 原始代码：使用多个 useState
function TodoAppBefore() {
  // 🚨 信号 1：多个相关的状态
  const [todos, setTodos] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // 🚨 信号 2：复杂的更新逻辑
  const addTodo = (text) => {
    setTodos([
      ...todos,
      {
        id: Date.now(),
        text,
        completed: false,
        createdAt: new Date(),
      }
    ])
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id 
        ? { ...todo, completed: !todo.completed }
        : todo
    ))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  // 🚨 信号 3：需要同步多个状态
  const fetchTodos = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/todos')
      const data = await response.json()
      setTodos(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 🚨 信号 4：状态更新逻辑重复
  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed))
  }

  return <div>{/* ... */}</div>
}

// ==================== 迁移后：使用 useReducer ====================

/**
 * 💡 迁移步骤：
 * 
 * Step 1: 定义状态结构
 * Step 2: 识别所有 action 类型
 * Step 3: 编写 reducer 函数
 * Step 4: 替换 useState 为 useReducer
 * Step 5: 更新组件中的调用
 */

// Step 1: 定义初始状态（合并所有 useState）
const initialTodoState = {
  todos: [],
  filter: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,
}

// Step 2: 定义 action 类型
const TodoActions = {
  // 数据操作
  ADD_TODO: 'ADD_TODO',
  TOGGLE_TODO: 'TOGGLE_TODO',
  DELETE_TODO: 'DELETE_TODO',
  CLEAR_COMPLETED: 'CLEAR_COMPLETED',
  
  // 过滤和搜索
  SET_FILTER: 'SET_FILTER',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  
  // 异步操作
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_ERROR: 'FETCH_ERROR',
}

// Step 3: 编写 reducer（迁移所有更新逻辑）
function todoReducer(state, action) {
  switch (action.type) {
    case TodoActions.ADD_TODO:
      return {
        ...state,
        todos: [
          ...state.todos,
          {
            id: Date.now(),
            text: action.payload,
            completed: false,
            createdAt: new Date(),
          }
        ]
      }
    
    case TodoActions.TOGGLE_TODO:
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      }
    
    case TodoActions.DELETE_TODO:
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload)
      }
    
    case TodoActions.CLEAR_COMPLETED:
      return {
        ...state,
        todos: state.todos.filter(todo => !todo.completed)
      }
    
    case TodoActions.SET_FILTER:
      return {
        ...state,
        filter: action.payload
      }
    
    case TodoActions.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload
      }
    
    case TodoActions.FETCH_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    
    case TodoActions.FETCH_SUCCESS:
      return {
        ...state,
        isLoading: false,
        todos: action.payload,
        error: null,
      }
    
    case TodoActions.FETCH_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      }
    
    default:
      return state
  }
}

// Step 4 & 5: 使用 useReducer 并更新调用
function TodoAppAfter() {
  const [state, dispatch] = useReducer(todoReducer, initialTodoState)

  // 💡 业务逻辑函数（dispatch action）
  const addTodo = (text) => {
    dispatch({ type: TodoActions.ADD_TODO, payload: text })
  }

  const toggleTodo = (id) => {
    dispatch({ type: TodoActions.TOGGLE_TODO, payload: id })
  }

  const deleteTodo = (id) => {
    dispatch({ type: TodoActions.DELETE_TODO, payload: id })
  }

  const fetchTodos = async () => {
    dispatch({ type: TodoActions.FETCH_START })
    
    try {
      const response = await fetch('/api/todos')
      const data = await response.json()
      dispatch({ type: TodoActions.FETCH_SUCCESS, payload: data })
    } catch (err) {
      dispatch({ type: TodoActions.FETCH_ERROR, payload: err.message })
    }
  }

  return <div>{/* ... */}</div>
}

/**
 * 📊 迁移前后对比
 * 
 * 迁移前（useState）:
 * ✅ 代码量少（约 50 行）
 * ❌ 逻辑分散
 * ❌ 难以测试
 * ❌ 容易出现状态不一致
 * 
 * 迁移后（useReducer）:
 * ✅ 逻辑集中（reducer 函数）
 * ✅ 易于测试（纯函数）
 * ✅ 状态转换清晰
 * ✅ 易于维护和扩展
 * ❌ 代码量多（约 100 行）
 * 
 * 💡 结论：
 * 对于复杂应用，增加的代码量是值得的
 * 带来更好的可维护性和可测试性
 */

// ==================== 渐进式迁移策略 ====================

/**
 * 💡 不需要一次性全部迁移
 * 可以先迁移最复杂的部分
 */

// 策略 1：保留简单的 useState，迁移复杂的
function HybridApproach() {
  // 简单状态：保持 useState
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState('home')
  
  // 复杂状态：使用 useReducer
  const [todoState, dispatch] = useReducer(todoReducer, initialTodoState)

  // 💡 两者可以共存
  return <div>{/* ... */}</div>
}

// 策略 2：先迁移数据逻辑，UI 状态稍后
function DataFirstMigration() {
  // Step 1: 先迁移数据状态
  const [data, dispatchData] = useReducer(dataReducer, initialDataState)
  
  // Step 2: UI 状态暂时保持 useState
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('list')
  
  // Step 3: 后续再迁移 UI 状态到 uiReducer
  
  return <div>{/* ... */}</div>
}

/**
 * 📝 迁移检查清单
 * 
 * 迁移前确认：
 * ✅ 代码有多个相关的 useState
 * ✅ 状态更新逻辑比较复杂
 * ✅ 团队成员理解 reducer 概念
 * ✅ 项目规模足够大（值得投入）
 * 
 * 迁移步骤：
 * 1. ✅ 识别所有相关状态
 * 2. ✅ 定义初始状态对象
 * 3. ✅ 列出所有操作类型（action types）
 * 4. ✅ 编写 reducer 函数
 * 5. ✅ 为 reducer 编写测试
 * 6. ✅ 替换 useState 为 useReducer
 * 7. ✅ 更新所有 setState 为 dispatch
 * 8. ✅ 测试功能是否正常
 * 
 * 迁移后验证：
 * ✅ 功能完全正常
 * ✅ 代码更易理解
 * ✅ reducer 通过测试
 * ✅ 团队成员能够维护
 */

// 占位
function dataReducer(state, action) { return state }
const initialDataState = {}

export { TodoAppBefore, TodoAppAfter, HybridApproach, DataFirstMigration }





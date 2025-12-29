/**
 * 何时使用 useReducer？
 * 
 * 本文件展示 useReducer 适合的场景
 * 以及为什么在这些场景下优于 useState
 */

import { useState, useReducer } from 'react'

// ==================== 场景 1：多个相关联的状态 ====================

/**
 * ❌ 问题：使用多个 useState
 * 
 * 缺点：
 * 1. 状态分散，难以理解关系
 * 2. 更新逻辑分散在各处
 * 3. 容易出现状态不一致
 */
function FormWithState() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [age, setAge] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [isValid, setIsValid] = useState(false)

  const handleSubmit = async () => {
    // ❌ 需要手动同步多个状态
    setIsSubmitting(true)
    setError(null)
    
    try {
      await submitForm({ name, email, age })
      
      // ❌ 成功后要重置所有状态
      setName('')
      setEmail('')
      setAge(0)
      setIsValid(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    // ❌ 要手动重置每一个状态
    setName('')
    setEmail('')
    setAge(0)
    setError(null)
    setIsValid(false)
  }

  // ❌ 验证逻辑分散
  const validateForm = () => {
    const valid = name.length > 0 && email.includes('@') && age >= 18
    setIsValid(valid)
  }

  return <div>{/* ... */}</div>
}

/**
 * ✅ 解决：使用 useReducer
 * 
 * 优点：
 * 1. 所有状态集中管理
 * 2. 更新逻辑集中在 reducer
 * 3. 状态转换清晰可预测
 */

// 初始状态
const initialFormState = {
  // 表单数据
  name: '',
  email: '',
  age: 0,
  
  // UI 状态
  isSubmitting: false,
  error: null,
  isValid: false,
}

// Reducer 函数
function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      // 更新单个字段
      return {
        ...state,
        [action.field]: action.value,
        // 💡 自动触发验证
        isValid: validateFormData({
          ...state,
          [action.field]: action.value
        })
      }
    
    case 'SUBMIT_START':
      return {
        ...state,
        isSubmitting: true,
        error: null,
      }
    
    case 'SUBMIT_SUCCESS':
      // 💡 一次性重置所有状态
      return initialFormState
    
    case 'SUBMIT_ERROR':
      return {
        ...state,
        isSubmitting: false,
        error: action.error,
      }
    
    case 'RESET':
      // 💡 一行代码重置所有状态
      return initialFormState
    
    default:
      throw new Error(`未知的 action: ${action.type}`)
  }
}

// 验证逻辑（纯函数，可以独立测试）
function validateFormData(data) {
  return data.name.length > 0 && 
         data.email.includes('@') && 
         data.age >= 18
}

function FormWithReducer() {
  const [state, dispatch] = useReducer(formReducer, initialFormState)

  const handleSubmit = async () => {
    dispatch({ type: 'SUBMIT_START' })
    
    try {
      await submitForm({
        name: state.name,
        email: state.email,
        age: state.age
      })
      dispatch({ type: 'SUBMIT_SUCCESS' })
    } catch (err) {
      dispatch({ type: 'SUBMIT_ERROR', error: err.message })
    }
  }

  return (
    <div>
      <input
        value={state.name}
        onChange={e => dispatch({
          type: 'SET_FIELD',
          field: 'name',
          value: e.target.value
        })}
      />
      <input
        value={state.email}
        onChange={e => dispatch({
          type: 'SET_FIELD',
          field: 'email',
          value: e.target.value
        })}
      />
      <input
        type="number"
        value={state.age}
        onChange={e => dispatch({
          type: 'SET_FIELD',
          field: 'age',
          value: Number(e.target.value)
        })}
      />
      
      <button 
        onClick={handleSubmit}
        disabled={!state.isValid || state.isSubmitting}
      >
        {state.isSubmitting ? '提交中...' : '提交'}
      </button>
      
      <button onClick={() => dispatch({ type: 'RESET' })}>
        重置
      </button>
      
      {state.error && <p>{state.error}</p>}
    </div>
  )
}

// ==================== 场景 2：下一个状态依赖前一个状态 ====================

/**
 * ❌ 问题：useState 的函数式更新不够直观
 */
function ComplexCounterWithState() {
  const [count, setCount] = useState(0)
  const [step, setStep] = useState(1)

  const increment = () => {
    // ❌ 需要使用函数式更新
    setCount(prevCount => prevCount + step)
    // 如果写成：setCount(count + step)
    // 在快速点击时会有 bug（闭包问题）
  }

  const doubleAndIncrement = () => {
    // ❌ 复杂的状态转换不够清晰
    setCount(prevCount => prevCount * 2 + step)
  }

  return <div>{/* ... */}</div>
}

/**
 * ✅ 解决：useReducer 让状态转换更清晰
 */
function complexReducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      // ✅ 状态转换逻辑清晰
      return {
        ...state,
        count: state.count + state.step
      }
    
    case 'DOUBLE_AND_INCREMENT':
      // ✅ 复杂的转换也很直观
      return {
        ...state,
        count: state.count * 2 + state.step
      }
    
    case 'SET_STEP':
      return {
        ...state,
        step: action.payload
      }
    
    default:
      return state
  }
}

function ComplexCounterWithReducer() {
  const [state, dispatch] = useReducer(complexReducer, {
    count: 0,
    step: 1
  })

  return (
    <div>
      <p>Count: {state.count}</p>
      <p>Step: {state.step}</p>
      
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>
        增加（+{state.step}）
      </button>
      <button onClick={() => dispatch({ type: 'DOUBLE_AND_INCREMENT' })}>
        翻倍并增加
      </button>
      <input
        type="number"
        value={state.step}
        onChange={e => dispatch({
          type: 'SET_STEP',
          payload: Number(e.target.value)
        })}
      />
    </div>
  )
}

// ==================== 场景 3：多种操作类型 ====================

/**
 * ❌ 问题：useState 处理多种操作时代码分散
 */
function TodosWithState() {
  const [todos, setTodos] = useState([])

  const addTodo = (text) => {
    setTodos([...todos, { id: Date.now(), text, completed: false }])
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const updateTodo = (id, newText) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, text: newText } : todo
    ))
  }

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed))
  }

  const toggleAll = () => {
    const allCompleted = todos.every(todo => todo.completed)
    setTodos(todos.map(todo => ({ ...todo, completed: !allCompleted })))
  }

  // ❌ 问题：
  // 1. 6 个不同的函数，逻辑分散
  // 2. 每个函数都要理解如何更新状态
  // 3. 难以测试（需要 mock 组件）

  return <div>{/* ... */}</div>
}

/**
 * ✅ 解决：useReducer 集中管理所有操作
 */
function todosReducer(state, action) {
  switch (action.type) {
    case 'ADD_TODO':
      return [
        ...state,
        {
          id: Date.now(),
          text: action.payload,
          completed: false
        }
      ]
    
    case 'TOGGLE_TODO':
      return state.map(todo =>
        todo.id === action.payload
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    
    case 'DELETE_TODO':
      return state.filter(todo => todo.id !== action.payload)
    
    case 'UPDATE_TODO':
      return state.map(todo =>
        todo.id === action.payload.id
          ? { ...todo, text: action.payload.text }
          : todo
      )
    
    case 'CLEAR_COMPLETED':
      return state.filter(todo => !todo.completed)
    
    case 'TOGGLE_ALL':
      const allCompleted = state.every(todo => todo.completed)
      return state.map(todo => ({
        ...todo,
        completed: !allCompleted
      }))
    
    default:
      return state
  }
}

function TodosWithReducer() {
  const [todos, dispatch] = useReducer(todosReducer, [])

  // ✅ 优点：
  // 1. 所有逻辑在 reducer 中
  // 2. 组件只负责派发 action
  // 3. 易于测试 reducer
  // 4. 易于理解状态转换

  return (
    <div>
      <button onClick={() => dispatch({ 
        type: 'ADD_TODO', 
        payload: 'New Todo' 
      })}>
        添加
      </button>
      
      {todos.map(todo => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => dispatch({ 
              type: 'TOGGLE_TODO', 
              payload: todo.id 
            })}
          />
          <span>{todo.text}</span>
          <button onClick={() => dispatch({ 
            type: 'DELETE_TODO', 
            payload: todo.id 
          })}>
            删除
          </button>
        </div>
      ))}
      
      <button onClick={() => dispatch({ type: 'TOGGLE_ALL' })}>
        全选/取消全选
      </button>
      <button onClick={() => dispatch({ type: 'CLEAR_COMPLETED' })}>
        清除已完成
      </button>
    </div>
  )
}

/**
 * 🎯 总结：何时使用 useReducer
 * 
 * 情况 1：多个相关状态
 * ✅ useReducer 将它们组织在一起
 * ✅ 更新时保持一致性
 * 
 * 情况 2：复杂的更新逻辑
 * ✅ reducer 集中管理
 * ✅ 代码更易维护
 * 
 * 情况 3：多种操作类型
 * ✅ switch/case 清晰表达
 * ✅ 易于扩展新操作
 * 
 * 情况 4：需要测试
 * ✅ reducer 是纯函数
 * ✅ 独立于组件测试
 * 
 * 情况 5：状态转换有规律
 * ✅ reducer 体现状态机概念
 * ✅ 更容易理解和文档化
 */

// 占位函数
async function submitForm(data) {
  return Promise.resolve()
}

export {
  FormWithState,
  FormWithReducer,
  ComplexCounterWithState,
  ComplexCounterWithReducer,
  TodosWithState,
  TodosWithReducer
}




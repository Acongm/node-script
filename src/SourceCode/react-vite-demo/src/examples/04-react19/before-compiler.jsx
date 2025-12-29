/**
 * React 18 - 手动优化（编译器之前）
 * 
 * 需要手动使用：
 * - React.memo
 * - useMemo
 * - useCallback
 */

import { useState, useMemo, useCallback, memo } from 'react'

// ==================== 复杂组件示例 ====================

// ✅ 子组件需要用 memo 包裹
const ExpensiveChild = memo(({ data, onUpdate, onDelete }) => {
  console.log('ExpensiveChild 渲染')
  
  // 复杂的渲染逻辑
  return (
    <div>
      <h3>{data.title}</h3>
      <p>{data.content}</p>
      <button onClick={onUpdate}>更新</button>
      <button onClick={onDelete}>删除</button>
    </div>
  )
})

// 父组件
function TodoApp() {
  const [todos, setTodos] = useState([])
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  // ✅ 需要 useMemo 缓存过滤和排序的结果
  const filteredTodos = useMemo(() => {
    console.log('💡 计算 filteredTodos')
    
    let result = todos
    
    // 过滤
    if (filter === 'active') {
      result = result.filter(todo => !todo.completed)
    } else if (filter === 'completed') {
      result = result.filter(todo => todo.completed)
    }
    
    // 排序
    if (sortBy === 'date') {
      result = result.sort((a, b) => b.date - a.date)
    } else if (sortBy === 'priority') {
      result = result.sort((a, b) => b.priority - a.priority)
    }
    
    return result
  }, [todos, filter, sortBy])  // ✅ 必须声明所有依赖项

  // ✅ 需要 useMemo 缓存统计数据（对象）
  const stats = useMemo(() => {
    console.log('💡 计算 stats')
    return {
      total: todos.length,
      active: todos.filter(t => !t.completed).length,
      completed: todos.filter(t => t.completed).length,
    }
  }, [todos])  // ✅ 必须声明依赖

  // ✅ 需要 useCallback 缓存事件处理函数
  const handleUpdate = useCallback((id) => {
    console.log('💡 handleUpdate')
    setTodos(todos => todos.map(todo =>
      todo.id === id ? { ...todo, updated: Date.now() } : todo
    ))
  }, [])  // ✅ 使用函数式更新，不依赖 todos

  // ✅ 需要 useCallback
  const handleDelete = useCallback((id) => {
    console.log('💡 handleDelete')
    setTodos(todos => todos.filter(todo => todo.id !== id))
  }, [])

  // ✅ 需要 useCallback
  const handleToggle = useCallback((id) => {
    console.log('💡 handleToggle')
    setTodos(todos => todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }, [])

  return (
    <div>
      {/* 过滤和排序控制 */}
      <div>
        <button onClick={() => setFilter('all')}>全部</button>
        <button onClick={() => setFilter('active')}>进行中</button>
        <button onClick={() => setFilter('completed')}>已完成</button>
        
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date">按日期</option>
          <option value="priority">按优先级</option>
        </select>
      </div>

      {/* 统计信息 */}
      <div>
        <p>总计：{stats.total}</p>
        <p>进行中：{stats.active}</p>
        <p>已完成：{stats.completed}</p>
      </div>

      {/* 列表 */}
      {filteredTodos.map(todo => (
        <ExpensiveChild
          key={todo.id}
          data={todo}
          onUpdate={() => handleUpdate(todo.id)}
          onDelete={() => handleDelete(todo.id)}
        />
      ))}
    </div>
  )
}

/**
 * 📊 手动优化的问题
 * 
 * 1. ❌ 容易忘记优化
 *    - 忘记用 memo 包裹组件
 *    - 忘记用 useMemo 缓存对象
 *    - 忘记用 useCallback 缓存函数
 * 
 * 2. ❌ 容易遗漏依赖项
 *    - ESLint 会警告，但可能被忽略
 *    - 导致 bug（使用旧值）
 * 
 * 3. ❌ 代码冗长
 *    - 需要写很多 useMemo/useCallback
 *    - 依赖数组增加代码量
 *    - 影响可读性
 * 
 * 4. ❌ 心智负担重
 *    - 需要记住何时优化
 *    - 需要理解引用相等性
 *    - 新手容易困惑
 * 
 * 5. ❌ 容易过度优化
 *    - 为简单组件添加不必要的优化
 *    - 反而降低性能
 * 
 * 💡 统计：
 * 
 * 本示例中需要手动优化的地方：
 * - 1 个 React.memo
 * - 2 个 useMemo
 * - 3 个 useCallback
 * - 总共 6 个优化点
 * - 依赖数组 6 个
 * 
 * 代码量增加：约 30%
 */

// ==================== 常见错误 ====================

function CommonMistakes() {
  const [count, setCount] = useState(0)
  const [items, setItems] = useState([])

  // ❌ 错误 1：忘记添加依赖项
  const filtered1 = useMemo(() => {
    return items.filter(item => item.count > count)
  }, [items])  // ❌ 缺少 count 依赖
  // 后果：count 变化时不会重新过滤

  // ✅ 正确
  const filtered2 = useMemo(() => {
    return items.filter(item => item.count > count)
  }, [items, count])  // ✅ 包含所有依赖

  // ❌ 错误 2：闭包陷阱
  const handleClick1 = useCallback(() => {
    console.log('Count:', count)  // 总是打印初始值
  }, [])  // ❌ 缺少 count 依赖

  // ✅ 正确：添加依赖
  const handleClick2 = useCallback(() => {
    console.log('Count:', count)
  }, [count])

  // ✅ 更好：使用函数式更新
  const handleIncrement = useCallback(() => {
    setCount(c => c + 1)  // 不需要依赖 count
  }, [])

  // ❌ 错误 3：过度优化
  const sum = useMemo(() => {
    return 1 + 1  // 太简单，不需要缓存
  }, [])

  // ❌ 错误 4：缓存了但没用 memo
  const data = useMemo(() => ({ value: count }), [count])
  return <Child data={data} />  // Child 没有 memo，缓存无意义
}

function Child({ data }) {
  return <div>{data.value}</div>
}

/**
 * 📝 优化检查清单
 * 
 * 添加优化前，确认：
 * ✅ 组件有性能问题（用 Profiler 测量）
 * ✅ 组件会频繁渲染
 * ✅ 计算成本高或 props 是引用类型
 * 
 * 使用 React.memo 时：
 * ✅ 组件渲染成本高
 * ✅ props 不频繁变化
 * ✅ props 已经被 useMemo/useCallback 缓存
 * 
 * 使用 useMemo 时：
 * ✅ 计算成本高
 * ✅ 依赖项不频繁变化
 * ✅ 结果传递给 memo 组件或作为依赖项
 * 
 * 使用 useCallback 时：
 * ✅ 函数传递给 memo 组件
 * ✅ 函数作为其他 Hook 的依赖项
 * ✅ 函数不频繁变化
 * 
 * 添加依赖项时：
 * ✅ 包含所有使用的外部变量
 * ✅ ESLint 没有警告
 * ✅ 测试没有 bug
 */

export default TodoApp





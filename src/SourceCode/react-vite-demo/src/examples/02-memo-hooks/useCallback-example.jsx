/**
 * useCallback - 缓存函数引用
 * 
 * 使用场景：
 * 1. 传递给 memo 组件的函数
 * 2. 作为 useEffect/useMemo 的依赖项
 * 3. 自定义 Hook 返回的函数
 */

import { useState, useCallback, memo, useEffect } from 'react'

// ==================== 场景 1：传递给 memo 组件 ====================

// 子组件使用 memo 包裹
const Button = memo(({ onClick, label }) => {
  console.log(`🔄 Button "${label}" 渲染`)
  return <button onClick={onClick}>{label}</button>
})

function ParentComponent() {
  const [count, setCount] = useState(0)
  const [otherState, setOtherState] = useState(0)

  // ❌ 问题：每次渲染都创建新函数
  const handleClick1 = () => {
    console.log('Clicked')
  }
  // 💡 原理：() => {} === () => {} 返回 false，每次都是新函数

  // ✅ 解决：使用 useCallback 缓存函数
  const handleClick2 = useCallback(() => {
    console.log('Clicked')
  }, [])  // 💡 依赖项为空，函数引用永不改变

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment Count</button>
      <button onClick={() => setOtherState(otherState + 1)}>Update Other</button>
      
      {/* 
        🔍 观察：
        - 点击 "Update Other" 按钮时
        - 使用 handleClick1：子组件会重新渲染
        - 使用 handleClick2：子组件不会渲染
      */}
      <Button onClick={handleClick2} label="Click me" />
    </div>
  )
}

// ==================== 场景 2：带依赖的 useCallback ====================

function CounterWithCallback() {
  const [count, setCount] = useState(0)

  // ❌ 错误：使用了 count 但没有声明依赖
  const handleClick1 = useCallback(() => {
    console.log('Count:', count)  // 总是打印 0（闭包陷阱）
  }, [])  // ❌ 缺少 count 依赖

  // ✅ 正确：声明依赖项
  const handleClick2 = useCallback(() => {
    console.log('Count:', count)  // 打印最新的 count
  }, [count])  // ✅ count 变化时，创建新函数

  // ✅ 更好：使用函数式更新，避免依赖
  const handleIncrement = useCallback(() => {
    setCount(c => c + 1)  // 💡 不需要依赖 count
  }, [])

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={handleClick2}>Log Count</button>
      <button onClick={handleIncrement}>Increment (Optimized)</button>
    </div>
  )
}

/**
 * 💡 闭包陷阱说明：
 * 
 * const handleClick1 = useCallback(() => {
 *   console.log('Count:', count)
 * }, [])
 * 
 * 1. 首次渲染时 count = 0
 * 2. useCallback 创建函数，捕获当时的 count（0）
 * 3. 后续渲染时，因为依赖项为空 []
 * 4. useCallback 返回之前创建的函数（闭包中的 count 仍是 0）
 * 5. 所以总是打印 0
 * 
 * 解决方案：
 * 1. 添加 count 到依赖项：[count]
 * 2. 使用函数式更新：setCount(c => c + 1)
 */

// ==================== 场景 3：作为 useEffect 依赖 ====================

function FetchDataExample() {
  const [userId, setUserId] = useState(1)
  const [data, setData] = useState(null)

  // ❌ 问题：每次渲染都创建新函数，导致 useEffect 重复执行
  const fetchData1 = () => {
    fetch(`/api/user/${userId}`)
      .then(res => res.json())
      .then(setData)
  }

  // ✅ 解决：使用 useCallback 缓存函数
  const fetchData2 = useCallback(() => {
    fetch(`/api/user/${userId}`)
      .then(res => res.json())
      .then(setData)
  }, [userId])  // 💡 只在 userId 变化时创建新函数

  useEffect(() => {
    fetchData2()
  }, [fetchData2])  // ✅ fetchData2 只在 userId 变化时改变

  // ❌ 如果使用 fetchData1 会怎样？
  // useEffect(() => {
  //   fetchData1()
  // }, [fetchData1])  // ❌ 每次渲染都执行！
  //
  // 💡 执行流程：
  // 1. 组件渲染：fetchData1 = function() {...}（引用 A）
  // 2. useEffect 执行，调用 fetchData1()
  // 3. fetchData1() 调用 setData，触发重新渲染
  // 4. 组件渲染：fetchData1 = function() {...}（引用 B）
  // 5. 引用 A !== 引用 B，useEffect 再次执行
  // 6. 无限循环 💥

  return <div>User: {data?.name}</div>
}

// ==================== 场景 4：自定义 Hook ====================

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  // ✅ 返回的函数应该使用 useCallback 缓存
  const updateValue = useCallback((newValue) => {
    setTimeout(() => {
      setDebouncedValue(newValue)
    }, delay)
  }, [delay])

  return [debouncedValue, updateValue]
}

// 使用自定义 Hook
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, updateDebounced] = useDebounce('', 500)

  useEffect(() => {
    // updateDebounced 引用稳定，不会导致无限循环
    updateDebounced(searchTerm)
  }, [searchTerm, updateDebounced])

  return <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
}

/**
 * 📌 useCallback 使用原则
 * 
 * ✅ 何时使用：
 * 1. 传递给 React.memo 组件的函数
 * 2. 作为 useEffect/useMemo 的依赖项
 * 3. 自定义 Hook 返回的函数
 * 4. 函数包含复杂逻辑且依赖项稳定
 * 
 * ❌ 何时不用：
 * 1. 函数仅在当前组件内部使用
 * 2. 子组件没有使用 React.memo
 * 3. 函数不作为依赖项传递
 * 4. 过早优化
 * 
 * 💡 工作原理：
 * const fn = useCallback(callback, deps)
 * 1. 首次渲染：缓存 callback 函数
 * 2. 后续渲染：
 *    - 对比 deps 数组（浅比较）
 *    - deps 没变：返回缓存的函数
 *    - deps 变了：缓存新的 callback
 * 
 * 🎯 性能收益：
 * - 减少子组件不必要的重渲染
 * - 优化 useEffect 的执行次数
 * - 避免创建不必要的函数实例
 * 
 * ⚠️ 常见错误：
 * 1. 忘记添加依赖项（闭包陷阱）
 * 2. 在非 memo 组件中使用（无效优化）
 * 3. 依赖项频繁变化（失去缓存意义）
 */

export { ParentComponent, CounterWithCallback, FetchDataExample, SearchComponent }




/**
 * ❌ 未优化版本 - 性能问题示例
 * 
 * 问题清单：
 * 1. 每次渲染都执行昂贵计算
 * 2. 每次都创建新的对象和函数
 * 3. 子组件总是重新渲染
 */

import { useState, useRef } from 'react'

// 模拟昂贵计算
function expensiveCalculation(num) {
  console.log('🔥 执行昂贵计算（未优化）', num)
  let result = 0
  for (let i = 0; i < 100000000; i++) {
    result += num
  }
  return result
}

// 子组件（没有使用 memo）
function ChildComponent({ data, onClick }) {
  const renderCount = useRef(0)
  renderCount.current++
  
  console.log('❌ 子组件渲染（未优化）', renderCount.current, '次')
  
  return (
    <div>
      <p>子组件数据：{data.value}</p>
      <p>渲染次数：{renderCount.current}</p>
      <button onClick={onClick}>点击我</button>
    </div>
  )
}

// 父组件
function ParentComponent() {
  const [count, setCount] = useState(0)
  const [unrelatedState, setUnrelatedState] = useState(0)
  const parentRenderCount = useRef(0)
  parentRenderCount.current++
  
  console.log('⚪ 父组件渲染（未优化）', parentRenderCount.current, '次')
  
  // ❌ 问题 1：每次渲染都执行昂贵计算（即使 count 没变）
  const calculated = expensiveCalculation(count)
  
  // ❌ 问题 2：每次渲染都创建新对象
  const data = { value: count }
  // 💡 原理：每次渲染都会执行 { value: count }
  //          每次都创建新的对象，引用不同
  
  // ❌ 问题 3：每次渲染都创建新函数
  const handleClick = () => {
    console.log('按钮被点击')
  }
  // 💡 原理：每次渲染都会创建新的函数实例
  //          虽然代码相同，但引用不同
  
  return (
    <div>
      <h3>未优化版本</h3>
      
      {/* 状态显示 */}
      <p>Count: {count}</p>
      <p>计算结果: {calculated}</p>
      <p>父组件渲染: {parentRenderCount.current} 次</p>
      
      {/* 按钮 */}
      <button onClick={() => setCount(count + 1)}>
        Count +1
      </button>
      <button onClick={() => setUnrelatedState(unrelatedState + 1)}>
        无关状态 +1 (观察副作用)
      </button>
      
      {/* 子组件 */}
      <ChildComponent data={data} onClick={handleClick} />
    </div>
  )
}

/**
 * 🔍 问题分析：
 * 
 * 当点击 "无关状态 +1" 按钮时：
 * 
 * 1. unrelatedState 改变，触发父组件重新渲染
 * 
 * 2. 父组件重新执行：
 *    - expensiveCalculation(count) 被执行 ❌
 *      虽然 count 没变，但还是重新计算了
 *    
 *    - data = { value: count } 创建新对象 ❌
 *      虽然 count 没变，但对象引用不同
 *      { value: 0 } !== { value: 0 }
 *    
 *    - handleClick = () => {...} 创建新函数 ❌
 *      虽然代码相同，但函数引用不同
 *      fn1 !== fn2
 * 
 * 3. 子组件接收到新的 props：
 *    - data 引用变了（虽然值没变）
 *    - onClick 引用变了（虽然逻辑没变）
 *    - React 默认行为：props 变化就重新渲染
 *    - 子组件重新渲染 ❌
 * 
 * 💡 性能影响：
 * 
 * - 无意义的计算：count 没变，但重新计算了
 * - 无意义的渲染：子组件的 props 值没变，但因为引用变了而重渲染
 * - 累积效应：如果有多个子组件，影响会被放大
 * 
 * 📊 性能损耗：
 * 
 * - 计算损耗：每次渲染都执行循环 1 亿次
 * - 渲染损耗：子组件不必要的重新渲染
 * - 内存损耗：创建大量临时对象和函数
 * 
 * ✅ 解决方案：
 * 
 * 1. 使用 useMemo 缓存计算结果
 *    const calculated = useMemo(() => expensiveCalculation(count), [count])
 * 
 * 2. 使用 useMemo 缓存对象
 *    const data = useMemo(() => ({ value: count }), [count])
 * 
 * 3. 使用 useCallback 缓存函数
 *    const handleClick = useCallback(() => { console.log('clicked') }, [])
 * 
 * 4. 使用 React.memo 包裹子组件
 *    const ChildComponent = memo(({ data, onClick }) => {...})
 * 
 * 📌 注意：
 * 
 * 这 4 个优化必须配合使用才有效！
 * - 只用 memo 不缓存 props → 无效
 * - 只缓存 props 不用 memo → 无效
 */

export default ParentComponent



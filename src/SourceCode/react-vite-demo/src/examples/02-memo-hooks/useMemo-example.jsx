/**
 * useMemo - 缓存计算结果
 * 
 * 使用场景：
 * 1. 昂贵的计算（循环、递归、复杂运算）
 * 2. 创建对象/数组传递给 memo 组件
 * 3. 作为其他 Hook 的依赖项
 */

import { useState, useMemo } from 'react'

// ==================== 场景 1：昂贵的计算 ====================

function ExpensiveCalculation() {
  const [count, setCount] = useState(0)
  const [otherState, setOtherState] = useState(0)

  // ❌ 问题：每次渲染都执行昂贵计算（即使 count 没变）
  const result1 = (() => {
    console.log('❌ 执行昂贵计算（未优化）')
    let sum = 0
    for (let i = 0; i < 1000000000; i++) {
      sum += count
    }
    return sum
  })()

  // ✅ 解决：只在 count 变化时计算
  const result2 = useMemo(() => {
    console.log('✅ 执行昂贵计算（已优化）')
    let sum = 0
    for (let i = 0; i < 1000000000; i++) {
      sum += count
    }
    return sum
  }, [count])  // 💡 只在 count 变化时重新计算

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <button onClick={() => setOtherState(otherState + 1)}>Other: {otherState}</button>
      {/* 
        🔍 观察：
        - 点击 Other 按钮时
        - 未优化版本会重新计算（打印日志）
        - 优化版本不会计算（不打印日志）
      */}
    </div>
  )
}

// ==================== 场景 2：稳定的对象引用 ====================

import { memo } from 'react'

// 子组件使用 memo 包裹
const ChildComponent = memo(({ data }) => {
  console.log('🔄 ChildComponent 渲染')
  return <div>Data: {data.value}</div>
})

function ParentComponent() {
  const [count, setCount] = useState(0)
  const [otherState, setOtherState] = useState(0)

  // ❌ 问题：每次渲染都创建新对象
  const data1 = { value: count }
  // 💡 原理：{} === {} 返回 false，每次都是新对象

  // ✅ 解决：使用 useMemo 缓存对象
  const data2 = useMemo(() => {
    return { value: count }
  }, [count])
  // 💡 原理：count 不变时，返回同一个对象引用

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <button onClick={() => setOtherState(otherState + 1)}>Other: {otherState}</button>
      
      {/* 
        🔍 观察：
        - 点击 Other 按钮时
        - 使用 data1：子组件会重新渲染（data1 是新对象）
        - 使用 data2：子组件不会渲染（data2 引用相同）
      */}
      <ChildComponent data={data2} />
    </div>
  )
}

// ==================== 场景 3：避免 useEffect 无限循环 ====================

import { useEffect } from 'react'

function AvoidInfiniteLoop() {
  const [userId, setUserId] = useState(1)

  // ❌ 问题：每次渲染都创建新对象，导致 useEffect 无限执行
  const options1 = { userId }

  // ✅ 解决：使用 useMemo 缓存对象
  const options2 = useMemo(() => ({ userId }), [userId])

  useEffect(() => {
    console.log('fetchData with options2')
    // fetchData(options2)
  }, [options2])  // ✅ options2 只在 userId 变化时创建新对象

  // ❌ 如果依赖 options1 会怎样？
  // useEffect(() => {
  //   console.log('fetchData with options1')
  //   fetchData(options1)
  // }, [options1])  // ❌ 无限循环！
  // 
  // 💡 执行流程：
  // 1. 首次渲染：options1 = { userId: 1 }（引用 A）
  // 2. useEffect 执行，可能触发状态更新
  // 3. 组件重新渲染：options1 = { userId: 1 }（引用 B）
  // 4. 引用 A !== 引用 B，useEffect 检测到依赖变化
  // 5. useEffect 再次执行
  // 6. 循环往复 💥

  return <div>User ID: {userId}</div>
}

/**
 * 📌 useMemo 使用原则
 * 
 * ✅ 何时使用：
 * 1. 计算成本高（循环、递归、复杂运算）
 * 2. 传递给 React.memo 组件的 props
 * 3. 作为 useEffect/useMemo 的依赖项
 * 4. 依赖项不频繁变化
 * 
 * ❌ 何时不用：
 * 1. 简单计算（a + b、字符串拼接）
 * 2. 依赖项频繁变化（每次都要重新计算）
 * 3. 创建简单对象，但不传递给 memo 组件
 * 4. 过早优化（先测量性能，再优化）
 * 
 * 💡 工作原理：
 * const result = useMemo(fn, deps)
 * 1. 首次渲染：执行 fn()，缓存结果
 * 2. 后续渲染：
 *    - 对比 deps 数组（浅比较）
 *    - deps 没变：返回缓存的结果
 *    - deps 变了：重新执行 fn()，更新缓存
 * 
 * 🎯 性能收益：
 * - 避免昂贵计算重复执行
 * - 减少子组件不必要的重渲染
 * - 优化 useEffect 的执行次数
 */

export { ExpensiveCalculation, ParentComponent, AvoidInfiniteLoop }



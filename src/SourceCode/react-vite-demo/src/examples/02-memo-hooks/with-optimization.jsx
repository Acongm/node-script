/**
 * ✅ 优化版本 - 完整的性能优化方案
 * 
 * 优化清单：
 * 1. useMemo 缓存昂贵计算
 * 2. useMemo 缓存对象引用
 * 3. useCallback 缓存函数引用
 * 4. React.memo 包裹子组件
 */

import { useState, useMemo, useCallback, useRef, memo } from 'react'

// 模拟昂贵计算
function expensiveCalculation(num) {
  console.log('🔥 执行昂贵计算（已优化）', num)
  let result = 0
  for (let i = 0; i < 100000000; i++) {
    result += num
  }
  return result
}

// ✅ 优化 4：使用 React.memo 包裹子组件
const ChildComponent = memo(({ data, onClick }) => {
  const renderCount = useRef(0)
  renderCount.current++
  
  console.log('✅ 子组件渲染（已优化）', renderCount.current, '次')
  
  return (
    <div>
      <p>子组件数据：{data.value}</p>
      <p>渲染次数：{renderCount.current} ⚡</p>
      <button onClick={onClick}>点击我</button>
    </div>
  )
})
// 💡 React.memo 原理：
// - 对比 props 的引用（浅比较）
// - 如果所有 props 引用相同，跳过渲染
// - 如果任何 prop 引用不同，重新渲染

// 父组件
function ParentComponent() {
  const [count, setCount] = useState(0)
  const [unrelatedState, setUnrelatedState] = useState(0)
  const parentRenderCount = useRef(0)
  parentRenderCount.current++
  
  console.log('🟢 父组件渲染（已优化）', parentRenderCount.current, '次')
  
  // ✅ 优化 1：使用 useMemo 缓存昂贵计算
  const calculated = useMemo(() => {
    return expensiveCalculation(count)
  }, [count])
  // 💡 工作原理：
  // - 首次渲染：执行 expensiveCalculation(0)，缓存结果
  // - unrelatedState 变化时：count 没变，返回缓存结果
  // - count 变化时：重新执行计算，更新缓存
  
  // ✅ 优化 2：使用 useMemo 缓存对象
  const data = useMemo(() => {
    console.log('📦 useMemo: 创建新的 data 对象')
    return { value: count }
  }, [count])
  // 💡 工作原理：
  // - 首次渲染：创建 { value: 0 }，缓存引用
  // - unrelatedState 变化时：count 没变，返回缓存的对象
  // - count 变化时：创建新对象，更新缓存
  
  // ✅ 优化 3：使用 useCallback 缓存函数
  const handleClick = useCallback(() => {
    console.log('🔧 useCallback: 执行缓存的函数')
    console.log('按钮被点击，当前 count:', count)
  }, [count])
  // 💡 工作原理：
  // - 首次渲染：缓存函数引用
  // - unrelatedState 变化时：count 没变，返回缓存的函数
  // - count 变化时：创建新函数，更新缓存
  // 
  // 📌 注意依赖项：
  // - 如果函数中使用了 count，必须添加 count 到依赖项
  // - 否则会出现闭包陷阱（总是使用旧的 count 值）
  
  return (
    <div>
      <h3>优化版本</h3>
      
      {/* 状态显示 */}
      <p>Count: {count}</p>
      <p>计算结果: {calculated}</p>
      <p>父组件渲染: {parentRenderCount.current} 次</p>
      
      {/* 按钮 */}
      <button onClick={() => setCount(count + 1)}>
        Count +1
      </button>
      <button onClick={() => setUnrelatedState(unrelatedState + 1)}>
        无关状态 +1 (观察优化效果)
      </button>
      
      {/* 子组件 */}
      <ChildComponent data={data} onClick={handleClick} />
    </div>
  )
}

/**
 * 🔍 优化效果分析：
 * 
 * 当点击 "无关状态 +1" 按钮时：
 * 
 * 1. unrelatedState 改变，触发父组件重新渲染
 * 
 * 2. 父组件重新执行：
 *    - useMemo 检查 count 依赖：没变
 *      → 跳过 expensiveCalculation，返回缓存 ✅
 *    
 *    - useMemo 检查 count 依赖：没变
 *      → 返回缓存的 data 对象，引用相同 ✅
 *    
 *    - useCallback 检查 count 依赖：没变
 *      → 返回缓存的 handleClick 函数，引用相同 ✅
 * 
 * 3. 子组件 props 对比：
 *    - data 引用相同 ✅
 *    - onClick 引用相同 ✅
 *    - React.memo 判断：props 没变，跳过渲染 ✅
 * 
 * 💡 性能提升：
 * 
 * - 避免了无意义的计算
 * - 避免了子组件的重新渲染
 * - 大幅提升了性能
 * 
 * 📊 性能对比：
 * 
 * 未优化版本：
 * - 每次渲染都计算（1 亿次循环）
 * - 子组件每次都渲染
 * - 性能损耗大
 * 
 * 优化版本：
 * - 只在 count 变化时计算
 * - 子组件智能跳过渲染
 * - 性能提升显著
 * 
 * 🎯 完整优化方案（4 个步骤缺一不可）：
 * 
 * 1. React.memo 包裹子组件
 *    ↓ 启用 props 对比机制
 * 
 * 2. useMemo 缓存传递的对象
 *    ↓ 保证对象引用稳定
 * 
 * 3. useCallback 缓存传递的函数
 *    ↓ 保证函数引用稳定
 * 
 * 4. useMemo 缓存昂贵计算
 *    ↓ 避免不必要的计算
 * 
 * ⚠️ 常见错误：
 * 
 * 1. 只用 memo 不缓存 props
 *    → props 引用总是变化，memo 无效
 * 
 * 2. 缓存 props 但不用 memo
 *    → 子组件还是会重新渲染
 * 
 * 3. 忘记添加依赖项
 *    → 闭包陷阱，使用旧值
 * 
 * 4. 过度优化简单组件
 *    → 增加代码复杂度，收益低
 * 
 * 📌 最佳实践：
 * 
 * 1. 先测量性能（使用 React DevTools Profiler）
 * 2. 确认有性能问题再优化
 * 3. 从叶子组件开始优化（从下往上）
 * 4. 优化大列表和昂贵计算
 * 5. 避免过早优化
 */

export default ParentComponent





/**
 * React 18 - useDeferredValue（延迟值）
 * 
 * 核心功能：推迟某个值的更新，保持 UI 响应性
 * 适用场景：无法控制子组件内部实现（如第三方组件）
 */

import { useState, useDeferredValue } from 'react'

// ==================== 基础用法 ====================

function SearchDemo() {
  const [query, setQuery] = useState('')
  
  // ✅ 创建延迟的值
  const deferredQuery = useDeferredValue(query)
  // 💡 原理：
  // - query 立即更新（紧急）
  // - deferredQuery 延迟更新（非紧急）
  // - React 会在空闲时更新 deferredQuery

  return (
    <div>
      <input 
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索..."
      />
      
      {/* 💡 输入框立即响应（使用 query） */}
      <p>实际输入：{query}</p>
      
      {/* 💡 列表延迟渲染（使用 deferredQuery） */}
      <p>延迟值：{deferredQuery}</p>
      
      {/* 大列表使用延迟的值，不会阻塞输入 */}
      <SlowList query={deferredQuery} />
    </div>
  )
}

// 渲染很慢的列表组件
function SlowList({ query }) {
  console.log('🐌 SlowList 渲染：', query)
  
  const items = []
  for (let i = 0; i < 10000; i++) {
    items.push(`${query} - 结果 ${i}`)
  }
  
  return (
    <ul>
      {items.slice(0, 100).map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

/**
 * 💡 工作原理
 * 
 * 用户输入 "a"：
 * 1. setQuery("a") → query 立即变为 "a"
 * 2. 输入框立即更新 ✅
 * 3. deferredQuery 还是 ""（延迟更新）
 * 4. SlowList 还在渲染旧的列表
 * 
 * React 空闲时：
 * 5. deferredQuery 更新为 "a"
 * 6. SlowList 开始渲染新列表
 * 7. 如果用户又输入 "b"，会打断渲染
 * 
 * 🎯 效果：
 * - 输入框始终流畅响应
 * - 列表渲染不会阻塞输入
 * - 用户体验好
 */

// ==================== 与 useTransition 对比 ====================

function ComparisonDemo() {
  const [query, setQuery] = useState('')
  
  // 方案 1：useTransition（需要控制更新时机）
  const [results1, setResults1] = useState([])
  const [isPending, startTransition] = useTransition()
  
  const handleChange1 = (value) => {
    setQuery(value)
    startTransition(() => {
      const results = performSearch(value)
      setResults1(results)
    })
  }
  
  // 方案 2：useDeferredValue（更简单）
  const deferredQuery = useDeferredValue(query)
  const results2 = performSearch(deferredQuery)
  
  return (
    <div>
      <h3>方案 1：useTransition</h3>
      <input onChange={e => handleChange1(e.target.value)} />
      {isPending && <p>搜索中...</p>}
      {/* results1 */}
      
      <h3>方案 2：useDeferredValue</h3>
      <input onChange={e => setQuery(e.target.value)} />
      {query !== deferredQuery && <p>搜索中...</p>}
      {/* results2 */}
    </div>
  )
}

function performSearch(query) {
  return Array.from({ length: 1000 }, (_, i) => `${query} - ${i}`)
}

/**
 * 📌 useTransition vs useDeferredValue
 * 
 * useTransition：
 * ✅ 你能控制更新代码（自己的组件）
 * ✅ 提供 isPending 状态
 * ✅ 可以包裹多个状态更新
 * ❌ 需要手动包裹 setState
 * 
 * useDeferredValue：
 * ✅ 你无法控制组件内部（第三方组件）
 * ✅ 使用更简单，只需传值
 * ✅ 适合单个值的延迟
 * ❌ 没有 isPending（需要手动对比）
 * ❌ 创建了额外的状态
 * 
 * 💡 选择建议：
 * - 能控制代码 → useTransition
 * - 第三方组件 → useDeferredValue
 * - 需要 isPending → useTransition
 * - 简单场景 → useDeferredValue
 */

// ==================== 实际应用场景 ====================

// 场景 1：搜索自动完成
function AutoCompleteDemo() {
  const [input, setInput] = useState('')
  const deferredInput = useDeferredValue(input)
  
  const suggestions = useSuggestions(deferredInput)

  return (
    <div>
      <input 
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      
      {/* 建议列表使用延迟的值 */}
      {input !== deferredInput && <div>加载中...</div>}
      <SuggestionList items={suggestions} />
    </div>
  )
}

// 场景 2：可视化图表
function ChartDemo() {
  const [data, setData] = useState([])
  const deferredData = useDeferredValue(data)
  
  return (
    <div>
      <button onClick={() => setData(generateRandomData())}>
        生成新数据
      </button>
      
      {/* 图表渲染使用延迟的值，不阻塞按钮点击 */}
      <HeavyChart data={deferredData} />
      
      {data !== deferredData && <div>图表更新中...</div>}
    </div>
  )
}

/**
 * 🎯 性能优化效果
 * 
 * 没有 useDeferredValue：
 * - 输入 → 立即渲染大列表 → 卡顿 ❌
 * 
 * 使用 useDeferredValue：
 * - 输入 → 立即更新输入框 ✅
 * - 延迟 → 后台渲染大列表
 * - 再输入 → 打断渲染，重新开始
 * 
 * 📊 性能指标：
 * - 输入响应时间：<16ms（保持 60fps）
 * - 列表渲染：在空闲时间进行
 * - 用户感知：流畅无卡顿
 * 
 * ⚠️ 注意事项：
 * 1. deferredValue 可能会"落后"于实际值
 * 2. 需要处理中间状态（显示加载提示）
 * 3. 不适合需要立即反馈的场景
 * 4. 会创建额外的状态（轻微内存开销）
 */

// 占位函数和组件
function useSuggestions(query) { return [] }
function SuggestionList({ items }) { return <div>{items.length}</div> }
function HeavyChart({ data }) { return <div>图表</div> }
function generateRandomData() { return [] }

export { SearchDemo, ComparisonDemo, AutoCompleteDemo, ChartDemo }



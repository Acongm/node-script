/**
 * React 18 - useTransition（过渡更新）
 * 
 * 核心功能：区分紧急更新和非紧急更新
 * 紧急更新：用户输入、点击等交互
 * 非紧急更新：列表渲染、数据处理等
 */

import { useState, useTransition } from 'react'

// ==================== 基础用法 ====================

function SearchDemo() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isPending, startTransition] = useTransition()

  const handleChange = (e) => {
    const value = e.target.value
    
    // 紧急更新：立即响应用户输入
    setQuery(value)
    
    // 非紧急更新：可以被中断
    startTransition(() => {
      const searchResults = performSearch(value)
      setResults(searchResults)
    })
  }

  return (
    <div>
      <input 
        value={query} 
        onChange={handleChange}
        placeholder="搜索..." 
      />
      
      {/* 💡 输入时不会感到卡顿 */}
      {isPending && <p>搜索中...</p>}
      
      {/* 大量结果渲染不会阻塞输入 */}
      {results.map(item => (
        <div key={item.id}>{item.text}</div>
      ))}
    </div>
  )
}

// 模拟昂贵的搜索操作
function performSearch(query) {
  const results = []
  for (let i = 0; i < 10000; i++) {
    results.push({ id: i, text: `${query} - 结果 ${i}` })
  }
  return results
}

/**
 * 💡 工作原理
 * 
 * 没有 useTransition 的问题：
 * 1. 用户输入 "a"
 * 2. setQuery("a") → 立即渲染输入框
 * 3. setResults([...10000项]) → 立即渲染列表
 * 4. 渲染 10000 项耗时长，阻塞主线程
 * 5. 用户继续输入 "b"，但感觉卡顿 ❌
 * 
 * 使用 useTransition 后：
 * 1. 用户输入 "a"
 * 2. setQuery("a") → 立即渲染输入框（紧急）
 * 3. startTransition(() => setResults([...10000项]))
 *    → 标记为非紧急，可以被打断
 * 4. 开始渲染列表，但时间切片执行
 * 5. 用户输入 "b"，立即响应（打断列表渲染）
 * 6. 重新开始渲染新的列表 ✅
 * 
 * 🎯 核心概念：
 * - 紧急更新：用户交互，必须立即响应
 * - 非紧急更新：后台工作，可以延迟
 * - isPending：标记非紧急更新是否在进行中
 */

// ==================== 实际应用场景 ====================

// 场景 1：Tab 切换
function TabsDemo() {
  const [activeTab, setActiveTab] = useState('home')
  const [isPending, startTransition] = useTransition()

  const handleTabClick = (tab) => {
    // 紧急：立即更新选中状态
    setActiveTab(tab)
    
    // 非紧急：渲染 Tab 内容
    startTransition(() => {
      // 触发 Tab 内容的渲染
      // 如果内容很复杂，不会阻塞 Tab 切换动画
    })
  }

  return (
    <div>
      <button onClick={() => handleTabClick('home')}>首页</button>
      <button onClick={() => handleTabClick('posts')}>文章</button>
      
      {isPending && <div>加载中...</div>}
      
      {activeTab === 'home' && <HomePage />}
      {activeTab === 'posts' && <PostsPage />}
    </div>
  )
}

// 场景 2：过滤大列表
function FilterDemo() {
  const [filterText, setFilterText] = useState('')
  const [filteredItems, setFilteredItems] = useState([])
  const [isPending, startTransition] = useTransition()
  
  const allItems = Array.from({ length: 20000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    category: i % 10
  }))

  const handleFilter = (text) => {
    // 紧急：更新输入框
    setFilterText(text)
    
    // 非紧急：过滤和渲染
    startTransition(() => {
      const filtered = allItems.filter(item => 
        item.name.includes(text)
      )
      setFilteredItems(filtered)
    })
  }

  return (
    <div>
      <input 
        value={filterText}
        onChange={e => handleFilter(e.target.value)}
        placeholder="过滤..."
      />
      
      {isPending ? (
        <div>过滤中...</div>
      ) : (
        filteredItems.map(item => (
          <div key={item.id}>{item.name}</div>
        ))
      )}
    </div>
  )
}

/**
 * 📌 使用原则
 * 
 * ✅ 适合使用 useTransition 的场景：
 * 1. 大列表渲染（搜索、过滤、排序）
 * 2. 复杂的数据处理
 * 3. Tab 切换时的内容渲染
 * 4. 路由跳转时的页面渲染
 * 5. 任何可能阻塞用户交互的更新
 * 
 * ❌ 不适合的场景：
 * 1. 用户直接交互（输入、点击、拖拽）
 * 2. 需要立即反馈的操作（表单验证）
 * 3. 简单快速的更新
 * 4. 关键的状态变化
 * 
 * 💡 对比 useDeferredValue：
 * 
 * useTransition：
 * - 你能控制更新的触发时机
 * - 手动包裹 setState
 * - 提供 isPending 状态
 * 
 * useDeferredValue：
 * - 你无法控制更新（如第三方组件）
 * - 传入一个值，返回延迟的值
 * - 更简单，但功能较少
 * 
 * 🎯 性能提升：
 * - 保持 UI 响应性
 * - 避免卡顿感
 * - 提升用户体验
 * 
 * ⚠️ 注意事项：
 * 1. startTransition 中的更新可能被丢弃
 * 2. 不要在 transition 中执行副作用
 * 3. isPending 为 true 时显示加载状态
 * 4. 过渡更新不保证执行顺序
 */

// ==================== 与 setTimeout 对比 ====================

function ComparisonDemo() {
  const [query, setQuery] = useState('')
  const [results1, setResults1] = useState([])
  const [results2, setResults2] = useState([])
  const [isPending, startTransition] = useTransition()

  // ❌ 旧方案：使用 setTimeout 延迟
  const handleChange1 = (e) => {
    const value = e.target.value
    setQuery(value)
    
    setTimeout(() => {
      const results = performSearch(value)
      setResults1(results)
    }, 0)
    // 问题：
    // 1. 固定延迟，不智能
    // 2. 快速输入时会堆积多个 setTimeout
    // 3. 不能被打断，浪费资源
  }

  // ✅ 新方案：使用 useTransition
  const handleChange2 = (e) => {
    const value = e.target.value
    setQuery(value)
    
    startTransition(() => {
      const results = performSearch(value)
      setResults2(results)
    })
    // 优势：
    // 1. React 智能调度
    // 2. 可以被打断和重启
    // 3. 与 React 的并发机制集成
  }
}

/**
 * 🚀 未来展望
 * 
 * React 19 + Suspense：
 * - useTransition 与 Suspense 深度集成
 * - 支持流式 SSR
 * - 更智能的加载状态管理
 */

function HomePage() { return <div>首页内容</div> }
function PostsPage() { return <div>文章列表</div> }

export { SearchDemo, TabsDemo, FilterDemo, ComparisonDemo }



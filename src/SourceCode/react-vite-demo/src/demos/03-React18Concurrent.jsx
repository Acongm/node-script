import { useState, useTransition, useDeferredValue, useEffect } from 'react'
import { flushSync } from 'react-dom'
import DemoSection from '../components/DemoSection'

// 生成大量列表项
function generateItems(query) {
  const items = []
  for (let i = 0; i < 10000; i++) {
    items.push(`${query} - 项目 ${i + 1}`)
  }
  return items
}

// ==================== 1. Automatic Batching ====================

function AutoBatchingDemo() {
  const [count, setCount] = useState(0)
  const [flag, setFlag] = useState(false)
  const [renderLog, setRenderLog] = useState([])

  const logRender = (message) => {
    const log = `${new Date().toLocaleTimeString()}.${Date.now() % 1000} - ${message}`
    setRenderLog(prev => [log, ...prev].slice(0, 10))
  }

  useEffect(() => {
    logRender('组件渲染')
  })

  // React 18 自动批处理
  const handleClickNoBatch = () => {
    setTimeout(() => {
      setCount(c => c + 1)
      setFlag(f => !f)
      // React 18 自动批处理，只触发 1 次渲染
    }, 0)
  }

  // 强制同步更新（退出批处理）
  const handleClickFlushSync = () => {
    setTimeout(() => {
      flushSync(() => {
        setCount(c => c + 1) // 立即渲染
      })
      flushSync(() => {
        setFlag(f => !f) // 再次渲染
      })
    }, 0)
  }

  // Promise 中的批处理
  const handleClickPromise = () => {
    Promise.resolve().then(() => {
      setCount(c => c + 1)
      setFlag(f => !f)
      // React 18 自动批处理
    })
  }

  return (
    <DemoSection title="1. Automatic Batching（自动批处理）">
      <div className="info">
        <strong>React 18 新特性：</strong>在所有场景下自动批处理状态更新，包括 setTimeout、Promise、原生事件等。
        <br/>点击按钮观察渲染日志：批处理只会产生 1 次渲染，flushSync 会产生多次渲染。
      </div>

      <div className="stats">
        <div className="stats-item">
          <span>计数器：</span>
          <span className="stats-value">{count}</span>
        </div>
        <div className="stats-item">
          <span>标志位：</span>
          <span className="stats-value">{flag ? 'true' : 'false'}</span>
        </div>
      </div>

      <div className="controls">
        <button onClick={handleClickNoBatch}>
          异步更新（自动批处理）
        </button>
        <button onClick={handleClickPromise}>
          Promise 更新（自动批处理）
        </button>
        <button onClick={handleClickFlushSync}>
          flushSync（强制同步）
        </button>
      </div>

      <div className="render-log">
        <div style={{ marginBottom: '8px', color: '#ffd666' }}>
          渲染日志（观察渲染次数）：
        </div>
        {renderLog.map((log, i) => (
          <div key={i} className="render-log-item">{log}</div>
        ))}
      </div>
    </DemoSection>
  )
}

// ==================== 2. useTransition ====================

function UseTransitionDemo() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [isPending, startTransition] = useTransition()

  const handleChange = (e) => {
    const value = e.target.value
    setQuery(value) // 紧急更新，立即响应输入

    // 标记为非紧急更新，可以被中断
    startTransition(() => {
      const newItems = generateItems(value)
      setItems(newItems)
    })
  }

  return (
    <DemoSection title="2. useTransition（过渡更新）">
      <div className="info">
        <strong>使用场景：</strong>区分紧急更新（用户输入）和非紧急更新（列表渲染）。
        <br/>输入文字时，输入框立即响应，大列表渲染被标记为低优先级，不会阻塞输入。
      </div>

      <div className="controls">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="输入搜索关键词..."
          style={{ flex: 1 }}
        />
        {isPending && <div className="spinner"></div>}
      </div>

      <div className="stats">
        <div className="stats-item">
          <span>列表项数量：</span>
          <span className="stats-value">{items.length}</span>
        </div>
        <div className="stats-item">
          <span>是否 pending：</span>
          <span className="stats-value">{isPending ? 'true' : 'false'}</span>
        </div>
      </div>

      <div className="list" style={{ opacity: isPending ? 0.6 : 1 }}>
        {items.slice(0, 100).map((item, i) => (
          <div key={i} className="list-item">{item}</div>
        ))}
        {items.length > 100 && (
          <div className="list-item" style={{ color: '#999' }}>
            ... 还有 {items.length - 100} 项
          </div>
        )}
      </div>
    </DemoSection>
  )
}

// ==================== 3. useDeferredValue ====================

function UseDeferredValueDemo() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const items = generateItems(deferredQuery)

  return (
    <DemoSection title="3. useDeferredValue（延迟值）">
      <div className="info">
        <strong>使用场景：</strong>当你无法控制组件内部（如第三方组件），使用延迟值推迟更新。
        <br/>与 useTransition 类似，但更适合你无法修改子组件的情况。
      </div>

      <div className="controls">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入搜索关键词..."
          style={{ flex: 1 }}
        />
      </div>

      <div className="stats">
        <div className="stats-item">
          <span>实际输入：</span>
          <span className="stats-value">{query}</span>
        </div>
        <div className="stats-item">
          <span>延迟值：</span>
          <span className="stats-value">{deferredQuery}</span>
        </div>
        <div className="stats-item">
          <span>列表项数量：</span>
          <span className="stats-value">{items.length}</span>
        </div>
        <div className="stats-item">
          <span>是否延迟中：</span>
          <span className="stats-value">{query !== deferredQuery ? 'true' : 'false'}</span>
        </div>
      </div>

      <div className="list" style={{ opacity: query !== deferredQuery ? 0.6 : 1 }}>
        {items.slice(0, 100).map((item, i) => (
          <div key={i} className="list-item">{item}</div>
        ))}
        {items.length > 100 && (
          <div className="list-item" style={{ color: '#999' }}>
            ... 还有 {items.length - 100} 项
          </div>
        )}
      </div>
    </DemoSection>
  )
}

function React18Concurrent() {
  return (
    <div>
      <div className="page-header">
        <h1>React 18 并发特性示例</h1>
        <p className="description">
          本示例演示 React 18 的三大并发特性：Automatic Batching、useTransition 和 useDeferredValue。
        </p>
      </div>

      <AutoBatchingDemo />
      <div className="demo-grid">
        <UseTransitionDemo />
        <UseDeferredValueDemo />
      </div>
    </div>
  )
}

export default React18Concurrent


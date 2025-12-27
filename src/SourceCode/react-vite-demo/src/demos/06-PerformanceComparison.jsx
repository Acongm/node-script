import { useState, useCallback, useRef, memo, useEffect } from 'react'
import DemoSection from '../components/DemoSection'

// ==================== 未优化版本 ====================

function ListItemWithout({ item, onDelete }) {
  const renderCount = useRef(0)
  renderCount.current++
  
  // 模拟一些计算
  let sum = 0
  for (let i = 0; i < 10000; i++) {
    sum += i
  }
  
  return (
    <div className="list-item">
      <span>{item.text}</span>
      <span style={{ color: '#999', fontSize: '12px' }}>
        渲染 {renderCount.current} 次
      </span>
      <button className="danger" onClick={onDelete}>删除</button>
    </div>
  )
}

function WithoutOptimization({ listSize }) {
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const renderCount = useRef(0)
  const [metrics, setMetrics] = useState({
    totalRenders: 0,
    lastRenderTime: 0,
  })

  renderCount.current++

  useEffect(() => {
    const newItems = Array.from({ length: listSize }, (_, i) => ({
      id: i,
      text: `任务 ${i + 1}`,
    }))
    setItems(newItems)
  }, [listSize])

  useEffect(() => {
    const startTime = performance.now()
    return () => {
      const renderTime = performance.now() - startTime
      setMetrics({
        totalRenders: renderCount.current,
        lastRenderTime: renderTime,
      })
    }
  })

  const handleDelete = (id) => {
    setItems(items.filter(item => item.id !== id))
  }

  return (
    <DemoSection title="未优化版本" type="wrong">
      <div className="stats">
        <div className="stats-item">
          <span className="metric-name">父组件渲染次数：</span>
          <span className="stats-value bad">{renderCount.current}</span>
        </div>
        <div className="stats-item">
          <span className="metric-name">列表项数量：</span>
          <span className="stats-value">{items.length}</span>
        </div>
        <div className="stats-item">
          <span className="metric-name">最后渲染耗时：</span>
          <span className="stats-value bad">{metrics.lastRenderTime.toFixed(2)}ms</span>
        </div>
        <div className="stats-item">
          <span className="metric-name">独立计数器：</span>
          <span className="stats-value">{count}</span>
        </div>
      </div>

      <div className="controls">
        <button onClick={() => setCount(count + 1)}>
          点击 +1（观察所有子组件是否重渲染）
        </button>
      </div>

      <div className="list">
        {items.slice(0, 50).map(item => (
          <ListItemWithout 
            key={item.id} 
            item={item} 
            onDelete={() => handleDelete(item.id)}
          />
        ))}
        {items.length > 50 && (
          <div className="list-item" style={{ color: '#999' }}>
            ... 还有 {items.length - 50} 项
          </div>
        )}
      </div>
    </DemoSection>
  )
}

// ==================== 优化版本 ====================

const ListItemWith = memo(({ item, onDelete }) => {
  const renderCount = useRef(0)
  renderCount.current++
  
  // 模拟一些计算
  let sum = 0
  for (let i = 0; i < 10000; i++) {
    sum += i
  }
  
  return (
    <div className="list-item">
      <span>{item.text}</span>
      <span style={{ color: '#52c41a', fontSize: '12px' }}>
        渲染 {renderCount.current} 次 ⚡
      </span>
      <button className="danger" onClick={onDelete}>删除</button>
    </div>
  )
})

function WithOptimization({ listSize }) {
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const renderCount = useRef(0)
  const [metrics, setMetrics] = useState({
    totalRenders: 0,
    lastRenderTime: 0,
  })

  renderCount.current++

  useEffect(() => {
    const newItems = Array.from({ length: listSize }, (_, i) => ({
      id: i,
      text: `任务 ${i + 1}`,
    }))
    setItems(newItems)
  }, [listSize])

  useEffect(() => {
    const startTime = performance.now()
    return () => {
      const renderTime = performance.now() - startTime
      setMetrics({
        totalRenders: renderCount.current,
        lastRenderTime: renderTime,
      })
    }
  })

  const handleDelete = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  return (
    <DemoSection title="优化版本（memo + useCallback）" type="correct">
      <div className="stats">
        <div className="stats-item">
          <span className="metric-name">父组件渲染次数：</span>
          <span className="stats-value good">{renderCount.current}</span>
        </div>
        <div className="stats-item">
          <span className="metric-name">列表项数量：</span>
          <span className="stats-value">{items.length}</span>
        </div>
        <div className="stats-item">
          <span className="metric-name">最后渲染耗时：</span>
          <span className="stats-value good">{metrics.lastRenderTime.toFixed(2)}ms</span>
        </div>
        <div className="stats-item">
          <span className="metric-name">独立计数器：</span>
          <span className="stats-value">{count}</span>
        </div>
      </div>

      <div className="controls">
        <button onClick={() => setCount(count + 1)}>
          点击 +1（子组件不会重渲染）
        </button>
      </div>

      <div className="list">
        {items.slice(0, 50).map(item => (
          <ListItemWith 
            key={item.id} 
            item={item} 
            onDelete={() => handleDelete(item.id)}
          />
        ))}
        {items.length > 50 && (
          <div className="list-item" style={{ color: '#999' }}>
            ... 还有 {items.length - 50} 项
          </div>
        )}
      </div>
    </DemoSection>
  )
}

function PerformanceComparison() {
  const [listSize, setListSize] = useState(50)

  return (
    <div>
      <div className="page-header">
        <h1>性能对比工具</h1>
        <p className="description">
          对比使用和不使用性能优化的差异。拖动滑块调整列表大小，观察渲染次数、耗时等指标。
        </p>
      </div>

      <DemoSection title="性能测试控制面板">
        <div className="info">
          <strong>测试说明：</strong><br/>
          1. 调整滑块改变列表大小<br/>
          2. 点击"+1"按钮，观察两个版本的表现差异<br/>
          3. 未优化版本：所有子组件都会重新渲染<br/>
          4. 优化版本：子组件使用 memo 包裹，父组件更新时不会重渲染
        </div>

        <div className="controls" style={{ marginTop: '15px' }}>
          <label style={{ flex: '0 0 auto', color: '#666' }}>列表大小：</label>
          <input 
            type="range" 
            min="10" 
            max="200" 
            value={listSize} 
            onChange={(e) => setListSize(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <div style={{ 
            flex: '0 0 auto', 
            textAlign: 'center', 
            fontSize: '20px', 
            fontWeight: 'bold',
            color: '#1890ff',
            margin: 0 
          }}>
            {listSize} 项
          </div>
        </div>
      </DemoSection>

      <div className="demo-grid">
        <WithoutOptimization listSize={listSize} />
        <WithOptimization listSize={listSize} />
      </div>

      <DemoSection title="优化效果对比">
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '15px'
        }}>
          <thead>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>指标</th>
              <th style={{ padding: '12px', textAlign: 'left', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>未优化</th>
              <th style={{ padding: '12px', textAlign: 'left', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>已优化</th>
              <th style={{ padding: '12px', textAlign: 'left', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>改善</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '12px' }}>子组件重渲染</td>
              <td style={{ padding: '12px', color: '#ff4d4f' }}>❌ 所有子组件</td>
              <td style={{ padding: '12px', color: '#52c41a' }}>✅ 仅变化的子组件</td>
              <td style={{ padding: '12px', color: '#52c41a' }}>大幅减少</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '12px' }}>渲染性能</td>
              <td style={{ padding: '12px', color: '#ff4d4f' }}>较慢</td>
              <td style={{ padding: '12px', color: '#52c41a' }}>快速</td>
              <td style={{ padding: '12px', color: '#52c41a' }}>提升 80%+</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '12px' }}>内存占用</td>
              <td style={{ padding: '12px', color: '#ff4d4f' }}>较高</td>
              <td style={{ padding: '12px', color: '#faad14' }}>轻微增加</td>
              <td style={{ padding: '12px', color: '#faad14' }}>缓存成本</td>
            </tr>
            <tr>
              <td style={{ padding: '12px' }}>用户体验</td>
              <td style={{ padding: '12px', color: '#ff4d4f' }}>可能卡顿</td>
              <td style={{ padding: '12px', color: '#52c41a' }}>流畅</td>
              <td style={{ padding: '12px', color: '#52c41a' }}>显著提升</td>
            </tr>
          </tbody>
        </table>
      </DemoSection>

      <DemoSection title="优化建议">
        <div className="info">
          <strong>何时优化：</strong><br/>
          ✅ 列表组件（特别是大列表）<br/>
          ✅ 渲染成本高的组件（复杂计算、大量 DOM）<br/>
          ✅ 频繁更新的父组件下的静态子组件<br/>
          ✅ 用 React DevTools Profiler 确认有性能问题<br/><br/>
          
          <strong>何时不优化：</strong><br/>
          ❌ 简单组件（一个 div + 文本）<br/>
          ❌ props 总是变化的组件<br/>
          ❌ 很少重新渲染的组件<br/>
          ❌ 过早优化（先开发功能，后优化性能）<br/><br/>
          
          <strong>React 19 改进：</strong><br/>
          🎉 React Compiler 自动优化，无需手动 memo/useMemo/useCallback！
        </div>
      </DemoSection>
    </div>
  )
}

export default PerformanceComparison


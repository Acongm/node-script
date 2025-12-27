import { useState, useMemo, useCallback, useRef, memo } from 'react'
import DemoSection from '../components/DemoSection'

// 模拟昂贵计算
function expensiveCalculation(num) {
  console.log('🔥 执行昂贵计算...', num)
  let result = 0
  for (let i = 0; i < 100000000; i++) {
    result += num
  }
  return result
}

// ==================== 未优化版本 ====================

function ChildWithoutMemo({ data, onClick }) {
  const renderCount = useRef(0)
  renderCount.current++
  
  console.log('❌ 子组件（未优化）渲染第', renderCount.current, '次')
  
  return (
    <div style={{
      background: '#fff7e6',
      padding: '20px',
      borderRadius: '8px',
      border: '2px solid #ffd666',
      marginBottom: '15px'
    }}>
      <h4 style={{ color: '#d46b08', marginTop: 0 }}>子组件（未使用 memo）</h4>
      <div style={{ marginBottom: '10px' }}>
        <strong>接收的数据：</strong>{data.value}
      </div>
      <div style={{ marginBottom: '15px', color: '#ff4d4f', fontSize: '16px', fontWeight: 'bold' }}>
        ❌ 渲染次数：{renderCount.current} 次
      </div>
      <button onClick={onClick} style={{ background: '#ff4d4f' }}>
        点击我（触发父组件的函数）
      </button>
      <div style={{ marginTop: '10px', fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
        💡 观察：即使 data 的值没变，这个组件也会重新渲染，因为：<br/>
        1. 父组件每次渲染都创建新的 data 对象<br/>
        2. 新对象 !== 旧对象（引用不同）<br/>
        3. React 认为 props 变了，触发重渲染
      </div>
    </div>
  )
}

function WithoutOptimization() {
  const [count, setCount] = useState(0)
  const [logs, setLogs] = useState([])
  const parentRenderCount = useRef(0)
  parentRenderCount.current++
  
  console.log('⚪ 父组件（未优化）渲染第', parentRenderCount.current, '次')
  
  // ❌ 每次渲染都创建新对象
  const data = { value: count }
  
  // ❌ 每次渲染都创建新函数
  const handleClick = () => {
    const log = `${new Date().toLocaleTimeString()}.${Date.now() % 1000} - 按钮被点击`
    setLogs(prev => [log, ...prev].slice(0, 5))
  }
  
  // ❌ 每次渲染都执行昂贵计算
  const calculated = expensiveCalculation(count)
  
  return (
    <DemoSection title="❌ 未优化版本" type="wrong">
      <div className="warning">
        <strong>问题：</strong><br/>
        1️⃣ 每次渲染都执行昂贵计算（控制台会打印 🔥）<br/>
        2️⃣ 每次都创建新的 data 对象和 handleClick 函数<br/>
        3️⃣ 子组件每次都重新渲染（即使 count 值没变）
      </div>
      
      <div className="stats">
        <div className="stats-item">
          <span>父组件渲染次数：</span>
          <span className="stats-value bad">{parentRenderCount.current}</span>
        </div>
        <div className="stats-item">
          <span>计数器值：</span>
          <span className="stats-value">{count}</span>
        </div>
        <div className="stats-item">
          <span>计算结果：</span>
          <span className="stats-value">{calculated}</span>
        </div>
      </div>
      
      <div className="controls">
        <button onClick={() => setCount(count + 1)}>
          Count +1（观察计算和子组件渲染）
        </button>
        <button onClick={() => setCount(count)}>
          设置相同值（观察是否还会计算）
        </button>
      </div>
      
      <input 
        type="range" 
        min="0" 
        max="10" 
        value={count} 
        onChange={(e) => setCount(Number(e.target.value))}
      />
      <div style={{ 
        textAlign: 'center', 
        fontSize: '32px', 
        fontWeight: 'bold',
        color: '#ff4d4f',
        margin: '10px 0'
      }}>
        {count}
      </div>
      
      <ChildWithoutMemo data={data} onClick={handleClick} />
      
      {logs.length > 0 && (
        <div className="render-log">
          <div style={{ marginBottom: '8px', color: '#ffd666' }}>
            点击日志（最近 5 条）：
          </div>
          {logs.map((log, i) => (
            <div key={i} className="render-log-item">{log}</div>
          ))}
        </div>
      )}
    </DemoSection>
  )
}

// ==================== 优化版本 ====================

const ChildWithMemo = memo(({ data, onClick }) => {
  const renderCount = useRef(0)
  renderCount.current++
  
  console.log('✅ 子组件（已优化）渲染第', renderCount.current, '次')
  
  return (
    <div style={{
      background: '#f6ffed',
      padding: '20px',
      borderRadius: '8px',
      border: '2px solid #b7eb8f',
      marginBottom: '15px'
    }}>
      <h4 style={{ color: '#389e0d', marginTop: 0 }}>子组件（使用 React.memo）</h4>
      <div style={{ marginBottom: '10px' }}>
        <strong>接收的数据：</strong>{data.value}
      </div>
      <div style={{ marginBottom: '15px', color: '#52c41a', fontSize: '16px', fontWeight: 'bold' }}>
        ✅ 渲染次数：{renderCount.current} 次 ⚡
      </div>
      <button onClick={onClick} style={{ background: '#52c41a' }}>
        点击我（触发父组件的函数）
      </button>
      <div style={{ marginTop: '10px', fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
        💡 观察：这个组件使用了 memo，只在 props 真正变化时才渲染：<br/>
        1. useMemo 缓存 data 对象（值不变时引用相同）<br/>
        2. useCallback 缓存 onClick 函数（引用不变）<br/>
        3. memo 对比 props，引用相同则跳过渲染 🎉
      </div>
    </div>
  )
})

function WithOptimization() {
  const [count, setCount] = useState(0)
  const [logs, setLogs] = useState([])
  const parentRenderCount = useRef(0)
  parentRenderCount.current++
  
  console.log('🟢 父组件（已优化）渲染第', parentRenderCount.current, '次')
  
  // ✅ 使用 useMemo 缓存对象
  const data = useMemo(() => {
    console.log('📦 useMemo: 创建新的 data 对象')
    return { value: count }
  }, [count]) // 只在 count 变化时创建新对象
  
  // ✅ 使用 useCallback 缓存函数
  const handleClick = useCallback(() => {
    console.log('🔧 useCallback: 执行缓存的函数')
    const log = `${new Date().toLocaleTimeString()}.${Date.now() % 1000} - 按钮被点击`
    setLogs(prev => [log, ...prev].slice(0, 5))
  }, []) // 依赖项为空，函数引用永远不变
  
  // ✅ 使用 useMemo 缓存昂贵计算
  const calculated = useMemo(() => {
    return expensiveCalculation(count)
  }, [count]) // 只在 count 变化时重新计算
  
  return (
    <DemoSection title="✅ 优化版本" type="correct">
      <div className="info">
        <strong>优化方案：</strong><br/>
        1️⃣ useMemo 缓存昂贵计算（只在 count 变化时执行）<br/>
        2️⃣ useMemo 缓存 data 对象（count 不变时引用相同）<br/>
        3️⃣ useCallback 缓存 handleClick 函数（引用永不改变）<br/>
        4️⃣ 子组件用 memo 包裹（props 不变时跳过渲染）
      </div>
      
      <div className="stats">
        <div className="stats-item">
          <span>父组件渲染次数：</span>
          <span className="stats-value good">{parentRenderCount.current}</span>
        </div>
        <div className="stats-item">
          <span>计数器值：</span>
          <span className="stats-value">{count}</span>
        </div>
        <div className="stats-item">
          <span>计算结果：</span>
          <span className="stats-value">{calculated}</span>
        </div>
      </div>
      
      <div className="controls">
        <button onClick={() => setCount(count + 1)}>
          Count +1（只计算一次）
        </button>
        <button onClick={() => setCount(count)}>
          设置相同值（不会重新计算）
        </button>
      </div>
      
      <input 
        type="range" 
        min="0" 
        max="10" 
        value={count} 
        onChange={(e) => setCount(Number(e.target.value))}
      />
      <div style={{ 
        textAlign: 'center', 
        fontSize: '32px', 
        fontWeight: 'bold',
        color: '#52c41a',
        margin: '10px 0'
      }}>
        {count}
      </div>
      
      <ChildWithMemo data={data} onClick={handleClick} />
      
      {logs.length > 0 && (
        <div className="render-log">
          <div style={{ marginBottom: '8px', color: '#ffd666' }}>
            点击日志（最近 5 条）：
          </div>
          {logs.map((log, i) => (
            <div key={i} className="render-log-item">{log}</div>
          ))}
        </div>
      )}
    </DemoSection>
  )
}

function MemoOptimization() {
  return (
    <div>
      <div className="page-header">
        <h1>⚡ useMemo & useCallback 交互式演示</h1>
        <p className="description">
          对比优化前后的性能差异。<br/>
          操作：拖动滑块改变计数器，观察控制台日志和子组件渲染次数。
        </p>
      </div>

      <div className="info" style={{ marginBottom: '20px' }}>
        <strong>📊 如何观察效果：</strong><br/>
        1️⃣ 打开浏览器控制台（F12），查看日志输出<br/>
        2️⃣ 拖动滑块或点击按钮，观察左右两侧的差异<br/>
        3️⃣ 注意子组件的渲染次数（左侧总是渲染，右侧智能跳过）<br/>
        4️⃣ 观察计算日志（左侧每次都计算，右侧只在值变化时计算）
      </div>

      <div className="demo-grid">
        <WithoutOptimization />
        <WithOptimization />
      </div>

      <DemoSection title="📚 核心知识点">
        <div style={{ lineHeight: '2' }}>
          <h4>1. 为什么需要 useMemo？</h4>
          <ul>
            <li>避免昂贵的计算重复执行</li>
            <li>为对象/数组提供稳定的引用</li>
            <li>配合 React.memo 避免子组件无效渲染</li>
          </ul>

          <h4>2. 为什么需要 useCallback？</h4>
          <ul>
            <li>为函数提供稳定的引用</li>
            <li>配合 React.memo 避免子组件无效渲染</li>
            <li>避免 useEffect 的依赖项频繁变化</li>
          </ul>

          <h4>3. 何时不需要优化？</h4>
          <ul>
            <li>❌ 简单计算（a + b）</li>
            <li>❌ 子组件没有使用 React.memo</li>
            <li>❌ 函数仅在组件内部使用</li>
            <li>❌ props 总是变化的场景</li>
          </ul>

          <h4>4. React 19 的改进</h4>
          <p style={{ background: '#e6f7ff', padding: '12px', borderRadius: '4px', marginTop: '10px' }}>
            🎉 <strong>React Compiler</strong> 会自动分析代码，在需要的地方自动插入 memo/useMemo/useCallback，
            未来你将不需要手动优化！
          </p>
        </div>
      </DemoSection>
    </div>
  )
}

export default MemoOptimization


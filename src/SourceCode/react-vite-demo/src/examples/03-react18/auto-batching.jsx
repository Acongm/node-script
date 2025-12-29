/**
 * React 18 - Automatic Batching（自动批处理）
 * 
 * 核心改进：在所有场景下自动批处理状态更新
 * 包括：setTimeout、Promise、原生事件、async/await
 */

import { useState } from 'react'
import { flushSync } from 'react-dom'

// ==================== React 17 vs React 18 对比 ====================

function AutoBatchingDemo() {
  const [count, setCount] = useState(0)
  const [flag, setFlag] = useState(false)

  console.log('🔄 组件渲染')

  // ✅ React 17 和 18 都支持：React 事件中的批处理
  const handleClickInEvent = () => {
    setCount(c => c + 1)
    setFlag(f => !f)
    // React 17: 批处理 ✅ → 只渲染 1 次
    // React 18: 批处理 ✅ → 只渲染 1 次
  }

  // 🆕 React 18 新增：setTimeout 中的批处理
  const handleClickInTimeout = () => {
    setTimeout(() => {
      setCount(c => c + 1)
      setFlag(f => !f)
      // React 17: 不批处理 ❌ → 渲染 2 次
      // React 18: 自动批处理 ✅ → 只渲染 1 次
    }, 0)
  }

  // 🆕 React 18 新增：Promise 中的批处理
  const handleClickInPromise = () => {
    Promise.resolve().then(() => {
      setCount(c => c + 1)
      setFlag(f => !f)
      // React 17: 不批处理 ❌ → 渲染 2 次
      // React 18: 自动批处理 ✅ → 只渲染 1 次
    })
  }

  // 🆕 React 18 新增：async/await 中的批处理
  const handleClickInAsync = async () => {
    await Promise.resolve()
    setCount(c => c + 1)
    setFlag(f => !f)
    // React 17: 不批处理 ❌ → 渲染 2 次
    // React 18: 自动批处理 ✅ → 只渲染 1 次
  }

  // 🆕 React 18 新增：原生事件中的批处理
  const handleClickInNative = () => {
    document.addEventListener('click', () => {
      setCount(c => c + 1)
      setFlag(f => !f)
      // React 17: 不批处理 ❌ → 渲染 2 次
      // React 18: 自动批处理 ✅ → 只渲染 1 次
    }, { once: true })
  }

  // 🚪 退出批处理：使用 flushSync
  const handleClickWithFlushSync = () => {
    setTimeout(() => {
      flushSync(() => {
        setCount(c => c + 1)
        // 立即同步渲染 → 渲染 1 次
      })
      flushSync(() => {
        setFlag(f => !f)
        // 再次同步渲染 → 渲染 1 次
      })
      // 总共渲染 2 次（强制同步）
    }, 0)
  }

  return (
    <div>
      <p>Count: {count}</p>
      <p>Flag: {flag ? 'true' : 'false'}</p>
      
      <button onClick={handleClickInEvent}>React 事件</button>
      <button onClick={handleClickInTimeout}>setTimeout</button>
      <button onClick={handleClickInPromise}>Promise</button>
      <button onClick={handleClickInAsync}>async/await</button>
      <button onClick={handleClickWithFlushSync}>flushSync（退出批处理）</button>
    </div>
  )
}

/**
 * 💡 工作原理
 * 
 * React 17 的批处理：
 * - 依赖 React 的事件系统
 * - 通过 isBatchingUpdates 标志控制
 * - 只在合成事件处理期间启用
 * - 异步回调中 React 上下文丢失，无法批处理
 * 
 * React 18 的自动批处理：
 * - 引入 createRoot API，启用并发特性
 * - 所有更新默认进入更新队列
 * - 通过微任务（microtask）延迟提交
 * - 在同一事件循环中的所有更新自动合并
 * 
 * 🎯 性能提升：
 * - 减少渲染次数（从 2 次变为 1 次）
 * - 避免中间状态展示（防止闪烁）
 * - 降低浏览器重绘重排次数
 * 
 * 📌 向后兼容：
 * - 使用 ReactDOM.createRoot 才启用自动批处理
 * - 旧的 ReactDOM.render 保持 React 17 行为
 * - 提供 flushSync 作为逃生舱（强制同步更新）
 * 
 * ⚠️ 何时使用 flushSync：
 * - 需要立即读取 DOM 状态
 * - 第三方库要求同步更新
 * - 性能测试确认需要同步
 * 
 * 注意：flushSync 会阻塞浏览器，谨慎使用！
 */

// ==================== 实际应用示例 ====================

function Form() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isValid, setIsValid] = useState(false)

  const handleSubmit = async () => {
    // React 18: 三个更新会被批处理，只渲染 1 次 ✅
    setName('')
    setEmail('')
    setIsValid(false)

    // 保存到服务器
    await saveToServer({ name, email })
    
    // React 18: 即使在 await 之后，也会批处理 ✅
    setName('Success')
    setIsValid(true)
  }

  // 如果需要立即读取 DOM（罕见场景）
  const handleSubmitWithSync = () => {
    flushSync(() => {
      setName('')  // 立即渲染
    })
    
    // 现在可以安全地读取 DOM
    const input = document.querySelector('input')
    console.log(input.value)  // 空字符串
    
    flushSync(() => {
      setEmail('')  // 再次渲染
    })
  }

  return <div>{/* ... */}</div>
}

async function saveToServer(data) {
  // 模拟 API 调用
  return Promise.resolve()
}

/**
 * 📊 性能对比
 * 
 * React 17:
 * handleSubmit 中的状态更新：
 * - setName('')      → 渲染 ❌
 * - setEmail('')     → 渲染 ❌
 * - setIsValid(false)→ 渲染 ❌
 * 总共：3 次渲染
 * 
 * await 后的状态更新：
 * - setName('Success') → 渲染 ❌
 * - setIsValid(true)   → 渲染 ❌
 * 总共：2 次渲染
 * 
 * React 18:
 * handleSubmit 中的状态更新：
 * - setName('')
 * - setEmail('')
 * - setIsValid(false)
 * 自动批处理 → 只渲染 1 次 ✅
 * 
 * await 后的状态更新：
 * - setName('Success')
 * - setIsValid(true)
 * 自动批处理 → 只渲染 1 次 ✅
 * 
 * 性能提升：从 5 次渲染减少到 2 次渲染！
 */

export default AutoBatchingDemo




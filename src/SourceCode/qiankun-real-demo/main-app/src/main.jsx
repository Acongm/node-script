import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

// ✅ 诊断：确保主应用 root 始终存在
const rootEl = document.getElementById('root')
if (!rootEl) {
  console.error('[main-app] ❌ root element not found!')
} else {
  console.log('[main-app] ✅ root element found:', rootEl)
}

const root = ReactDOM.createRoot(rootEl)

// ✅ 诊断：监听 root 元素的变化，如果主应用被卸载就重新挂载
let isRendered = false
let mainAppElement = null

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    const target = mutation.target
    // 如果 root 的直接子节点被移除，检查主应用是否还在
    if (target.id === 'root' && mutation.removedNodes.length > 0) {
      const removed = Array.from(mutation.removedNodes)
      // 检查被移除的节点是否是主应用
      const isMainAppRemoved = removed.some(node => {
        if (node.nodeType !== 1) return false // 不是元素节点
        return node === mainAppElement || node.querySelector?.('.page')
      })
      
      if (isMainAppRemoved && isRendered) {
        console.error('[main-app] ❌ 主应用被卸载了！被移除的节点:', removed.map(n => ({
          nodeName: n.nodeName,
          id: n.id,
          className: n.className,
        })))
        console.error('[main-app] ❌ 重新挂载主应用...')
        // 重新挂载主应用
        root.render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        )
        isRendered = true
        // 重新获取主应用元素引用
        setTimeout(() => {
          mainAppElement = rootEl.querySelector('.page')?.parentElement || rootEl.firstElementChild
        }, 100)
      }
    }
  })
})
observer.observe(rootEl, { childList: true, subtree: false }) // 只监听直接子节点

// ✅ 先渲染一个简单的测试组件，确保 React 能正常工作
try {
  root.render(
    // ⚠️ 重要：主应用作为 qiankun 宿主时，开发环境不建议开启 React.StrictMode。
    // StrictMode 会在 dev 下执行"挂载→卸载→再挂载"，导致子应用 mount 期间容器被移除，
    // 从而触发 qiankun 报错：Target container not existed after mounted.
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
isRendered = true
// 保存主应用元素的引用
setTimeout(() => {
  mainAppElement = rootEl.querySelector('.page')?.parentElement || rootEl.firstElementChild
  console.log('[main-app] ✅ main app element saved:', mainAppElement)
}, 100)
console.log('[main-app] ✅ main app rendered')
  
  // ✅ 延迟检查，确保 React 已经渲染完成
  setTimeout(() => {
    const pageEl = rootEl.querySelector('.page')
    const testBar = rootEl.querySelector('[style*="position: fixed"][style*="top: 0"]')
    console.log('[main-app] 🔍 渲染检查:', {
      hasPageEl: !!pageEl,
      hasTestBar: !!testBar,
      rootChildren: rootEl.children.length,
      rootHTML: rootEl.innerHTML.substring(0, 200),
    })
    if (!pageEl) {
      console.error('[main-app] ❌ .page 元素不存在！React 可能没有渲染成功')
    }
  }, 1000)
} catch (e) {
  console.error('[main-app] ❌ 渲染失败:', e)
  // 如果渲染失败，至少显示错误信息
  rootEl.innerHTML = `
    <div style="padding: 24px; background: #fef2f2; border: 2px solid #ef4444; border-radius: 10px; margin: 24px;">
      <h1 style="color: #991b1b;">❌ 主应用渲染失败</h1>
      <pre style="background: #0b1020; color: #e5e7eb; padding: 12px; border-radius: 8px; overflow: auto;">${e.stack || String(e)}</pre>
    </div>
  `
}



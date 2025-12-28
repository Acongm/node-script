import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

let root = null

function render(props = {}) {
  try {
    const { container } = props
    // ⚠️ qiankun 挂载时：容器里是 qiankun.html 的 sub-root
    // 独立运行时：index.html 仍然是 #root
    const el = container ? container.querySelector('#sub-root') : document.querySelector('#root')

    // eslint-disable-next-line no-console
    console.log('[sub-react-app] render() called, el:', el, 'container:', container)

    if (!el) {
      const errMsg = 'render() 失败：找不到 #sub-root！'
      // eslint-disable-next-line no-console
      console.error('[sub-react-app]', errMsg)
      if (container) {
        container.innerHTML = '<div style="padding:12px;border:2px solid #ef4444;background:#fef2f2;color:#991b1b">' +
          '<b>[sub-react-app] 渲染失败</b><pre style="margin:8px 0 0">' + errMsg + '</pre></div>'
      }
      throw new Error(errMsg)
    }

    // ✅ 只在第一次创建 root，后续复用（避免重复 createRoot）
    if (!root) {
      // eslint-disable-next-line no-console
      console.log('[sub-react-app] creating root on:', el)
      root = ReactDOM.createRoot(el)
    }
    
    // eslint-disable-next-line no-console
    console.log('[sub-react-app] calling root.render(<App />)')
    
    // React 18 的 render 是异步的，但立即返回
    root.render(<App {...props} />)
    
    // eslint-disable-next-line no-console
    console.log('[sub-react-app] root.render() returned (async rendering)')
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[sub-react-app] render() exception:', e)
    const container = props.container
    if (container) {
      container.innerHTML = '<div style="padding:12px;border:2px solid #ef4444;background:#fef2f2;color:#991b1b">' +
        '<b>[sub-react-app] render() 异常</b><pre style="margin:8px 0 0;white-space:pre-wrap">' + 
        (e && e.stack ? e.stack : String(e)) + '</pre></div>'
    }
    throw e
  }
}

/**
 * qiankun 生命周期：必须导出
 */
export async function bootstrap() {
  // eslint-disable-next-line no-console
  console.log('[sub-react-app] bootstrap')
}

export async function mount(props) {
  // eslint-disable-next-line no-console
  console.log('[sub-react-app] mount props:', props)
  
  // ✅ 诊断：如果找不到 #sub-root，显示可视化错误
  const { container } = props
  let el = container ? container.querySelector('#sub-root') : null
  
  if (!el && container) {
    // 如果 querySelector 找不到，尝试直接创建（兜底）
    el = document.createElement('div')
    el.id = 'sub-root'
    container.appendChild(el)
    // eslint-disable-next-line no-console
    console.warn('[sub-react-app] #sub-root not found, created one')
  }
  
  if (!el) {
    const errMsg = 'mount() 失败：找不到 #sub-root 容器！container=' + (container ? 'exists' : 'null')
    // eslint-disable-next-line no-console
    console.error('[sub-react-app]', errMsg, { props, container })
    
    // 显示错误到页面
    if (container) {
      container.innerHTML = 
        '<div style="padding:12px;border:2px solid #ef4444;border-radius:10px;background:#fef2f2;color:#991b1b">' +
        '<b>[sub-react-app] 渲染失败</b><pre style="margin:8px 0 0;white-space:pre-wrap">' + errMsg + '</pre></div>'
    }
    throw new Error(errMsg)
  }
  
  render(props)
  
  // ✅ 等待至少一帧，确保 React 18 开始渲染（避免 single-spa #31 超时）
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0)
    })
  })
}

export async function unmount() {
  // eslint-disable-next-line no-console
  console.log('[sub-react-app] unmount')
  if (root) {
    root.unmount()
    root = null
  }
}

/**
 * 独立运行（不被 qiankun 加载）时，直接渲染
 * qiankun 会注入 window.__POWERED_BY_QIANKUN__ = true
 */
if (!window.__POWERED_BY_QIANKUN__) {
  render()
}



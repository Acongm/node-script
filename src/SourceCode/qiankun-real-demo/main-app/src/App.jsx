import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { initGlobalState, loadMicroApp, start } from 'qiankun'
import { useLocation } from 'react-router-dom'

/**
 * 主应用：真实演示两种“传值”
 * 1) props / callback：主 → 子（函数）/ 子 → 主（回调调用）
 * 2) globalState：主子双向同步（qiankun 的 initGlobalState）
 */
export default function App() {
  const location = useLocation()
  const [logs, setLogs] = useState([])
  const [latestFromSub, setLatestFromSub] = useState(null)
  const [mounted, setMounted] = useState(false)
  const subContainerRef = useRef(null)

  // ✅ 诊断：确保 App 组件始终渲染
  useEffect(() => {
    console.log('[main-app] ✅ App component mounted/updated')
    return () => {
      console.warn('[main-app] ⚠️ App component unmounting!')
    }
  }, [])

  // 主应用维护的全局状态（通过 qiankun actions 同步给子应用）
  const actions = useMemo(() => {
    const a = initGlobalState({
      count: 0,
      user: { name: 'Alice' },
      from: 'main-app',
      // ✅ 主应用可以指定子应用要显示哪个 JSX 页面
      // 约定：'home' | 'transfer' | 'about'
      subPage: 'transfer',
    })
    return a
  }, [])

  const actionsRef = useRef(actions)
  actionsRef.current = actions

  const startedRef = useRef(false)
  const microAppRef = useRef(null)

  useEffect(() => {
    // 监听全局状态变化（包括子应用 setGlobalState）
    actions.onGlobalStateChange((state, prev) => {
      setLogs((l) => [
        ...l,
        {
          type: 'globalStateChange',
          time: new Date().toLocaleTimeString(),
          prev,
          state,
        },
      ])
    }, true)
  }, [actions])

  useEffect(() => {
    // 启动 qiankun（只启动一次）
    if (!startedRef.current) {
      start({
        prefetch: false,
        sandbox: {
          // ⚠️ 暂时禁用 strictStyleIsolation，测试是否是它导致主应用被卸载
          // strictStyleIsolation: true,
          // experimentalStyleIsolation: true,
        },
        // ✅ 添加 HTML Entry 处理配置，确保不影响主应用
        // 注意：qiankun 默认会提取子应用的 <head> 内容，可能会影响主应用
      })
      startedRef.current = true
    }
  }, [actions])

  const mountSubApp = useCallback(async () => {
    if (microAppRef.current) return

    setLogs((l) => [...l, { type: 'beforeLoad', time: new Date().toLocaleTimeString(), app: 'sub-react-app' }])

    const containerEl = subContainerRef.current
    if (!containerEl) {
      setLogs((l) => [
        ...l,
        { type: 'mountError', time: new Date().toLocaleTimeString(), app: 'sub-react-app', message: 'container ref is null' },
      ])
      return
    }

    // ✅ 诊断：挂载前检查容器和主应用 root
    console.log('[main-app] 🚀 准备挂载子应用')
    console.log('[main-app] containerEl:', containerEl)
    console.log('[main-app] main app root:', document.getElementById('root'))
    console.log('[main-app] main app root children:', document.getElementById('root')?.children.length)

    const app = loadMicroApp({
      name: 'sub-react-app',
      entry: 'http://localhost:7101/qiankun.html',
      // ✅ 用稳定的 DOM 引用，避免 mount 期间 query 选择器拿不到/拿到被 React 替换的节点
      container: containerEl,
      // ✅ 添加配置，防止影响主应用的 DOM
      sandbox: {
        // 使用 Proxy 沙箱，更安全
        strictStyleIsolation: false, // 暂时禁用，避免 Shadow DOM 导致的问题
      },
      // ✅ 确保子应用只在容器内渲染
      singular: false, // 允许多个实例
      props: {
        onMessageFromSub: (payload) => {
          setLatestFromSub(payload)
          setLogs((l) => [
            ...l,
            {
              type: 'propsMessage',
              time: new Date().toLocaleTimeString(),
              payload,
            },
          ])
        },
        actions,
        mainUser: { name: 'Alice', role: 'admin' },
      },
    })

    microAppRef.current = app
    
    // ✅ 诊断：挂载前检查主应用 DOM
    const mainRoot = document.getElementById('root')
    const pageEl = document.querySelector('.page')
    const testBar = document.querySelector('[style*="position: fixed"][style*="top: 40px"]')
    
    if (!pageEl || !testBar) {
      console.error('[main-app] ❌ 挂载前主应用 DOM 就不完整！', { pageEl, testBar })
    }
    
    // ✅ 保存主应用的 DOM 快照（用于恢复）
    const mainAppSnapshot = {
      mainRootHTML: mainRoot?.innerHTML.substring(0, 500),
      pageElParent: pageEl?.parentElement,
      testBarParent: testBar?.parentElement,
    }
    console.log('[main-app] 📊 挂载前主应用状态:', {
      mainRoot,
      pageEl,
      testBar,
      containerEl,
      containerHTML: containerEl.innerHTML.substring(0, 100),
      snapshot: mainAppSnapshot,
    })
    
    try {
      // ✅ 诊断：监听容器变化和主应用 root 的变化
      const containerObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          const target = mutation.target
          // 只记录容器内的变化
          if (containerEl.contains(target) || target === containerEl) {
            console.log('[main-app] 📦 子应用容器变化:', {
              type: mutation.type,
              added: mutation.addedNodes.length,
              removed: mutation.removedNodes.length,
              target: target.id || target.className || target.tagName,
            })
          }
          // ⚠️ 如果主应用 root 被修改，立即报警
          if (target.id === 'root' && mutation.removedNodes.length > 0) {
            console.error('[main-app] ⚠️ 主应用 root 的直接子节点被移除！', {
              removed: Array.from(mutation.removedNodes).map(n => ({
                nodeName: n.nodeName,
                id: n.id,
                className: n.className,
              })),
              added: Array.from(mutation.addedNodes).map(n => ({
                nodeName: n.nodeName,
                id: n.id,
                className: n.className,
              })),
            })
          }
        })
      })
      // 同时监听容器和主应用 root
      containerObserver.observe(containerEl, { childList: true, subtree: true })
      containerObserver.observe(document.getElementById('root'), { childList: true, subtree: false })
      
      // ✅ 在挂载过程中，定期检查主应用 DOM 是否被影响
      const checkInterval = setInterval(() => {
        const currentPageEl = document.querySelector('.page')
        const currentTestBar = document.querySelector('[style*="position: fixed"][style*="top: 40px"]')
        if (!currentPageEl && pageEl) {
          console.error('[main-app] ⚠️ 检测到主应用 .page 元素在挂载过程中被移除！')
        }
        if (!currentTestBar && testBar) {
          console.error('[main-app] ⚠️ 检测到主应用测试栏在挂载过程中被移除！')
        }
      }, 100)
      
      // ✅ 等待真正 mount 完成
      await app.mountPromise
      
      // 清除检查定时器
      clearInterval(checkInterval)
      
      // ✅ 诊断：挂载后立即检查主应用 DOM
      const afterMountMainRoot = document.getElementById('root')
      const afterMountPageEl = document.querySelector('.page')
      const afterMountTestBar = document.querySelector('[style*="position: fixed"][style*="top: 40px"]')
      
      const afterMount = {
        mainRoot: afterMountMainRoot,
        pageEl: afterMountPageEl,
        testBar: afterMountTestBar,
        containerEl: containerEl,
        containerHTML: containerEl.innerHTML.substring(0, 200),
        mainRootChildren: afterMountMainRoot?.children.length,
        mainRootHTML: afterMountMainRoot?.innerHTML.substring(0, 500),
      }
      console.log('[main-app] 📊 挂载后主应用状态:', afterMount)
      
      // ✅ 检查主应用是否被影响
      if (!afterMountTestBar && testBar) {
        console.error('[main-app] ❌ 主应用的测试栏消失了！')
        console.error('[main-app] 测试栏原来的位置:', testBar.parentElement)
        console.error('[main-app] 主应用 root 的当前子节点:', Array.from(afterMountMainRoot?.children || []).map(c => ({
          nodeName: c.nodeName,
          id: c.id,
          className: c.className,
        })))
      }
      if (!afterMountPageEl && pageEl) {
        console.error('[main-app] ❌ 主应用的 .page 元素消失了！')
        console.error('[main-app] .page 元素原来的位置:', pageEl.parentElement)
        // ✅ 尝试恢复主应用
        if (mainAppSnapshot.pageElParent && mainAppSnapshot.pageElParent !== afterMountMainRoot) {
          console.warn('[main-app] ⚠️ 检测到主应用 DOM 被修改，尝试恢复...')
          // 这里可以尝试恢复，但可能已经太晚了
        }
      }
      
      containerObserver.disconnect()
      
      setMounted(true)
      setLogs((l) => [...l, { type: 'afterMount', time: new Date().toLocaleTimeString(), app: 'sub-react-app' }])
    } catch (e) {
      setMounted(false)
      microAppRef.current = null
      setLogs((l) => [
        ...l,
        {
          type: 'mountError',
          time: new Date().toLocaleTimeString(),
          app: 'sub-react-app',
          message: e?.message || String(e),
        },
      ])
      // eslint-disable-next-line no-console
      console.error('[main-app] sub-react-app mount error:', e)
    }
  }, [actions])

  const unmountSubApp = useCallback(async () => {
    if (!microAppRef.current) return
    await microAppRef.current.unmount()
    microAppRef.current = null
    setMounted(false)
    setLogs((l) => [...l, { type: 'afterUnmount', time: new Date().toLocaleTimeString(), app: 'sub-react-app' }])
  }, [])

  // ✅ 改为手动控制，避免路由自动挂载导致的冲突
  // 用户点击"挂载子应用"按钮时才会挂载，主应用内容始终显示
  // useEffect(() => {
  //   const isSubRoute = location.pathname.startsWith('/sub')
  //   if (isSubRoute && !mounted) {
  //     const timer = setTimeout(() => {
  //       mountSubApp()
  //     }, 100)
  //     return () => clearTimeout(timer)
  //   } else if (!isSubRoute && mounted) {
  //     unmountSubApp()
  //   }
  // }, [location.pathname, mounted, mountSubApp, unmountSubApp])

  return (
    <div className="page">
      {/* ✅ 测试：确保主应用在渲染 - 使用更高的 z-index 和更明显的样式 */}
      <div style={{ 
        position: 'fixed', 
        top: '40px', // 在 HTML 测试元素下方
        left: 0, 
        right: 0, 
        background: '#10b981', 
        color: 'white', 
        padding: '12px 16px', 
        zIndex: 99998, // 比 HTML 测试元素低一点，但比子应用高
        fontSize: '16px',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        borderBottom: '2px solid #059669'
      }}>
        ✅ React 主应用正在运行 - URL: {location.pathname} - 子应用已{mounted ? '挂载' : '未挂载'}
      </div>
      <div style={{ marginTop: '80px' }}></div>
      <h1>qiankun 主应用（main-app）</h1>

      <section className="card">
        <h2>挂载控制（避免路由激活带来的困惑）</h2>
        <div className="row">
          <button className="btn" onClick={mounted ? unmountSubApp : mountSubApp}>
            {mounted ? '卸载子应用' : '挂载子应用'}
          </button>
        </div>
        <p className="muted">
          当前路径：<code>{location.pathname}</code>（点击下面的"挂载子应用"按钮来挂载子应用，主应用内容会始终显示）
        </p>
      </section>

      <section className="card">
        <h2>方式 1：Props/回调传值（子 → 主）</h2>
        <div className="row">
          <div className="box">
            <div className="muted">最新一条来自子应用：</div>
            <pre className="pre">{latestFromSub ? JSON.stringify(latestFromSub, null, 2) : '（暂无）'}</pre>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>方式 2：GlobalState（主 ↔ 子）</h2>
        <div className="row">
          <button
            className="btn"
            onClick={() => {
              // 主应用更新全局状态，子应用会收到 onGlobalStateChange 回调
              const next = Math.floor(Math.random() * 1000)
              actionsRef.current.setGlobalState({ count: next, from: 'main-app' })
            }}
          >
            主应用 setGlobalState({`{ count: random }`})
          </button>

          <button
            className="btn"
            onClick={() => {
              const ok = actionsRef.current.setGlobalState({ subPage: 'home', from: 'main-app' })
              setLogs((l) => [
                ...l,
                { type: 'setSubPage', time: new Date().toLocaleTimeString(), ok, subPage: 'home' },
              ])
            }}
          >
            让子应用显示 Home.jsx
          </button>

          <button
            className="btn"
            onClick={() => {
              const ok = actionsRef.current.setGlobalState({ subPage: 'transfer', from: 'main-app' })
              setLogs((l) => [
                ...l,
                { type: 'setSubPage', time: new Date().toLocaleTimeString(), ok, subPage: 'transfer' },
              ])
            }}
          >
            让子应用显示 Transfer.jsx
          </button>

          <button
            className="btn"
            onClick={() => {
              const ok = actionsRef.current.setGlobalState({ subPage: 'about', from: 'main-app' })
              setLogs((l) => [
                ...l,
                { type: 'setSubPage', time: new Date().toLocaleTimeString(), ok, subPage: 'about' },
              ])
            }}
          >
            让子应用显示 About.jsx
          </button>
        </div>
        <p className="muted">
          子应用也会调用 <code>actions.setGlobalState</code>，你会在下面日志看到双向变化。
        </p>
      </section>

      <section className="card">
        <h2>子应用挂载容器（包裹关系演示）</h2>
        <p className="muted">
          👇 下面的蓝色边框区域就是子应用的容器，子应用会渲染到这里，不会覆盖主应用的其他内容
        </p>
        {/* ✅ 关键：容器内部完全不要有任何 React 渲染的内容（避免和 qiankun 抢 DOM） */}
        {/* 占位文字用 CSS ::after 伪元素显示，不会触发 React DOM 操作 */}
        <div 
          id="subapp-container" 
          ref={subContainerRef} 
          className={`subapp-container ${!mounted ? 'subapp-container-empty' : ''}`}
        />
      </section>

      <section className="card">
        <h2>事件日志</h2>
        <div className="row">
          <button className="btn" onClick={() => setLogs([])}>
            清空日志
          </button>
        </div>
        <pre className="pre">{JSON.stringify(logs, null, 2)}</pre>
      </section>
    </div>
  )
}



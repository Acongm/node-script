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
          // strictStyleIsolation: true,
          // experimentalStyleIsolation: true,
        },
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

    const app = loadMicroApp({
      name: 'sub-react-app',
      entry: 'http://localhost:7101/qiankun.html',
      // ✅ 用稳定的 DOM 引用，避免 mount 期间 query 选择器拿不到/拿到被 React 替换的节点
      container: containerEl,
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
    try {
      // ✅ 等待真正 mount 完成
      await app.mountPromise
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

  // ✅ 路由命中 /sub 时自动挂载（满足你截图里期待的行为）
  useEffect(() => {
    const isSubRoute = location.pathname.startsWith('/sub')
    if (isSubRoute) {
      mountSubApp()
    } else {
      unmountSubApp()
    }
  }, [location.pathname, mountSubApp, unmountSubApp])

  return (
    <div className="page">
      <h1>qiankun 主应用（main-app）</h1>

      <section className="card">
        <h2>挂载控制（避免路由激活带来的困惑）</h2>
        <div className="row">
          <button className="btn" onClick={mounted ? unmountSubApp : mountSubApp}>
            {mounted ? '卸载子应用' : '挂载子应用'}
          </button>
        </div>
        <p className="muted">
          当前路径：<code>{location.pathname}</code>（访问 <code>/sub</code> 会自动挂载，也可用按钮手动控制）
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
        <h2>子应用挂载容器</h2>
        {/* ✅ 关键：容器内部不要再让 React 渲染任何子节点（避免和 qiankun 抢 DOM） */}
        <div id="subapp-container" ref={subContainerRef} className="subapp-container" />
        {!mounted && <div className="muted">（进入 /sub 或点“挂载子应用”后，子应用会渲染到上面的容器里）</div>}
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



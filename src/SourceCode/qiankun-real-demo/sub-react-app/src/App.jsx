import React, { useEffect, useMemo, useState } from 'react'
import PageHome from './pages/PageHome'
import PageAbout from './pages/PageAbout'
import PageTransfer from './pages/PageTransfer'

/**
 * 子应用：演示两种“传值”
 * - props 回调：props.onMessageFromSub(payload)
 * - globalState：props.actions.onGlobalStateChange / props.actions.setGlobalState
 */
export default function App(props) {
  const [globalState, setGlobalState] = useState(null)
  const [localPage, setLocalPage] = useState('transfer')
  const [lastStateAt, setLastStateAt] = useState(null)

  const hasActions = Boolean(props?.actions?.onGlobalStateChange && props?.actions?.setGlobalState)

  useEffect(() => {
    if (!hasActions) return

    const off = props.actions.onGlobalStateChange((state) => {
      setGlobalState(state)
      setLastStateAt(new Date().toLocaleTimeString())
    }, true)

    // qiankun 的 onGlobalStateChange 会返回一个“取消订阅”函数（部分版本）
    // 这里做兼容处理
    return () => {
      if (typeof off === 'function') off()
    }
  }, [hasActions, props.actions])

  // ✅ 当前要展示的“子应用页面”
  // - 被 qiankun 加载时：由主应用通过 globalState.subPage 指定
  // - 独立运行时：用本地 state 切换
  const currentPage = hasActions ? (globalState?.subPage || 'transfer') : localPage

  const go = (next) => {
    if (hasActions) {
      // 注意：qiankun 的 setGlobalState 只有在 key 存在于 initGlobalState 初始值时才会生效
      props.actions.setGlobalState({ subPage: next, from: 'sub-react-app' })
    } else {
      setLocalPage(next)
    }
  }

  const pageNode = useMemo(() => {
    const commonProps = {
      actions: props.actions,
      hasActions,
      mainUser: props.mainUser,
      onMessageFromSub: props.onMessageFromSub,
      globalState,
    }

    switch (currentPage) {
      case 'home':
        return <PageHome />
      case 'about':
        return <PageAbout />
      case 'transfer':
      default:
        return <PageTransfer {...commonProps} />
    }
  }, [currentPage, globalState, hasActions, props.actions, props.mainUser, props.onMessageFromSub])

  return (
    <div className="sub-page">
      <h2>子应用：sub-react-app</h2>

      <section className="card">
        <h3>子应用路由/页面（演示：显示某个 JSX 页面）</h3>
        <div className="row">
          <button className="btn" onClick={() => go('home')}>
            打开 Home.jsx
          </button>
          <button className="btn" onClick={() => go('transfer')}>
            打开 Transfer.jsx
          </button>
          <button className="btn" onClick={() => go('about')}>
            打开 About.jsx
          </button>
        </div>
        <p className="muted">
          当前页面：<b>{currentPage}</b>（被 qiankun 加载时由主应用通过 <code>globalState.subPage</code> 控制）
        </p>
        <div className="muted">
          hasActions：<b>{String(hasActions)}</b> ｜ globalState.subPage：
          <b>{String(globalState?.subPage ?? '(none)')}</b> ｜ lastStateAt：
          <b>{String(lastStateAt ?? '(none)')}</b>
        </div>
      </section>

      <section className="card">
        <h3>子应用当前运行模式</h3>
        <ul>
          <li>
            __POWERED_BY_QIANKUN__：<b>{String(Boolean(window.__POWERED_BY_QIANKUN__))}</b>
          </li>
          <li>
            说明：独立运行时为 false；被主应用 qiankun 加载时为 true。
          </li>
        </ul>
      </section>

      <section className="card">{pageNode}</section>
    </div>
  )
}



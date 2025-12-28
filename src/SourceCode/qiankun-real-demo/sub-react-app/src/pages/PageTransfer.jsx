import React, { useMemo, useState } from 'react'

/**
 * 这个页面复用你之前的“传值演示”UI
 * - props 回调：子 -> 主
 * - actions(globalState)：主 <-> 子
 */
export default function PageTransfer({ actions, hasActions, mainUser, onMessageFromSub, globalState }) {
  const [mainMsg, setMainMsg] = useState(null)

  const payload = useMemo(() => {
    return {
      from: 'sub-react-app',
      page: 'PageTransfer',
      time: new Date().toISOString(),
      random: Math.floor(Math.random() * 10000),
    }
  }, [])

  return (
    <div>
      <h3>子应用页面：Transfer.jsx（主子传值演示）</h3>

      <section className="card">
        <h4>方式 1：props/回调传值（子 → 主）</h4>
        <button
          className="btn"
          onClick={() => {
            if (typeof onMessageFromSub === 'function') {
              onMessageFromSub(payload)
              setMainMsg({ ok: true, payload })
            } else {
              setMainMsg({ ok: false, error: '未收到 onMessageFromSub（说明你可能没被 qiankun 加载）' })
            }
          }}
        >
          发送消息给主应用（props 回调）
        </button>
        <pre className="pre">{mainMsg ? JSON.stringify(mainMsg, null, 2) : '（点击按钮发送）'}</pre>
      </section>

      <section className="card">
        <h4>方式 2：GlobalState（主 ↔ 子）</h4>
        <div className="row">
          <button
            className="btn"
            disabled={!hasActions}
            onClick={() => {
              actions.setGlobalState({
                from: 'sub-react-app',
                count: (globalState?.count || 0) + 1,
              })
            }}
          >
            子应用 setGlobalState(count + 1)
          </button>

          <button
            className="btn"
            disabled={!hasActions}
            onClick={() => {
              actions.setGlobalState({
                from: 'sub-react-app',
                user: { name: 'Bob' },
              })
            }}
          >
            子应用 setGlobalState(user=Bob)
          </button>
        </div>

        <p className="muted">
          {!hasActions ? '（未拿到 actions：你在独立运行子应用）' : '（点击后主应用也会收到 onGlobalStateChange 日志）'}
        </p>

        <div className="muted">当前 globalState：</div>
        <pre className="pre">{globalState ? JSON.stringify(globalState, null, 2) : '（暂无）'}</pre>
      </section>

      <section className="card">
        <h4>主应用传来的只读数据（props）</h4>
        <pre className="pre">{JSON.stringify({ mainUser }, null, 2)}</pre>
      </section>
    </div>
  )
}



import React from 'react'

export default function PageAbout() {
  return (
    <div>
      <h3>子应用页面：About.jsx</h3>
      <p className="muted">
        这个页面用来验证“主应用指定 subPage 后，子应用确实切到了对应 JSX 页面”。
      </p>
      <p>你可以把这里替换成你想展示的任意 JSX 页面。</p>
    </div>
  )
}



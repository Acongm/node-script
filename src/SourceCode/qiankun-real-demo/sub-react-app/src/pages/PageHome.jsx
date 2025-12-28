import React from 'react'

export default function PageHome() {
  return (
    <div>
      <h3>子应用页面：Home.jsx</h3>
      <p className="muted">这是一个示例页面，你可以把它替换成你真实的业务页面组件。</p>
      <ul>
        <li>支持被主应用通过 globalState.subPage 指定打开</li>
        <li>支持子应用内部切换页面</li>
      </ul>
    </div>
  )
}



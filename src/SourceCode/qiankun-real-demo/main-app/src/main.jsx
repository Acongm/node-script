import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // ⚠️ 重要：主应用作为 qiankun 宿主时，开发环境不建议开启 React.StrictMode。
  // StrictMode 会在 dev 下执行“挂载→卸载→再挂载”，导致子应用 mount 期间容器被移除，
  // 从而触发 qiankun 报错：Target container not existed after mounted.
  <BrowserRouter>
    <App />
  </BrowserRouter>
)



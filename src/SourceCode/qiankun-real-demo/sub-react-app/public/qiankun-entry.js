/**
 * 让 Vite 子应用在 qiankun 下可加载的"兼容入口"
 *
 * 背景：
 * - Vite dev 默认入口是 <script type="module" src="/src/main.jsx">
 * - qiankun 的 HTML Entry 在很多情况下不会执行 module script
 *
 * 解决：
 * - 用普通 <script src="/qiankun-entry.js">
 * - 运行时动态 import 子应用的 ESM 模块
 * - 把 lifecycle 挂到 window['sub-react-app']，供 qiankun 调用
 */

// ⚠️ 关键问题：qiankun HTML Entry 会把脚本提取后插入主应用 DOM 执行
// 此时 document.currentScript.src 已经不是子应用的地址了
// 解决方案：直接从 window.location 或 __INJECTED_PUBLIC_PATH_BY_QIANKUN__ 获取

var origin
if (window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__) {
  // qiankun 注入的公共路径
  origin = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__.replace(/\/$/, '')
  console.log('[qiankun-entry] using __INJECTED_PUBLIC_PATH_BY_QIANKUN__:', origin)
} else {
  // 开发环境：直接硬编码子应用地址（生产环境应该从配置读取）
  origin = 'http://localhost:7101'
  console.log('[qiankun-entry] using hardcoded origin:', origin)
}

// 告诉子应用“我在 qiankun 环境下”（避免 main.jsx 走独立 render）
window.__POWERED_BY_QIANKUN__ = true

// ✅ 可视化诊断：即便 React 没渲染，你也能看到脚本执行到了哪一步
// ⚠️ 子应用用 sub-root，避免与主应用 #root 冲突
var rootEl = document.getElementById('sub-root')
if (rootEl) {
  rootEl.innerHTML =
    '<div style="padding:12px;border:1px dashed #60a5fa;border-radius:10px;background:#eff6ff;color:#1f2937">' +
    '<b>[sub-react-app]</b> qiankun-entry.js 已执行，等待 mount()…' +
    '</div>'
}

/**
 * ✅ 关键修复：
 * qiankun 在 LOADING_SOURCE_CODE 阶段会“同步”读取 window[appName] 上的生命周期
 * 所以这里必须**先同步挂载生命周期对象**，不能 async 后再挂（否则会报：You need to export lifecycle functions）
 *
 * 真正的 ESM import 延迟到 mount 时再做（mount 本身允许返回 Promise）
 */
var cachedModule = null

function loadLifecycleModule() {
  console.log('[qiankun-entry] loadLifecycleModule called, cachedModule:', !!cachedModule)
  if (cachedModule) return Promise.resolve(cachedModule)
  
  var importUrl = origin + '/src/main.jsx'
  console.log('[qiankun-entry] importing:', importUrl)
  
  return import(importUrl)
    .then(function (m) {
      console.log('[qiankun-entry] import success, raw module:', m)
      console.log('[qiankun-entry] module keys:', Object.keys(m))
      console.log('[qiankun-entry] m.default:', m.default)
      console.log('[qiankun-entry] m.bootstrap:', m.bootstrap)
      console.log('[qiankun-entry] m.mount:', m.mount)
      console.log('[qiankun-entry] m.unmount:', m.unmount)
      
      // ✅ 检测导出是否在 m.default 上（Vite 某些情况下会这样）
      if (m.default && typeof m.default === 'object') {
        console.log('[qiankun-entry] found m.default object, keys:', Object.keys(m.default))
        if (m.default.mount) {
          console.log('[qiankun-entry] lifecycle functions are on m.default, using it')
          cachedModule = m.default
          return m.default
        }
      }
      
      cachedModule = m
      return m
    })
    .catch(function (e) {
      console.error('[qiankun-entry] import failed:', e)
      throw e
    })
}

window['sub-react-app'] = {
  bootstrap: function () {
    console.log('[qiankun-entry] bootstrap() called')
    return loadLifecycleModule().then(function (m) {
      return m.bootstrap && m.bootstrap()
    })
  },
  mount: function (props) {
    console.log('[qiankun-entry] mount() called, props:', props)
    
    // ✅ 关键修复：确保 #sub-root 一定存在（qiankun HTML Entry 可能不保留）
    var container = props.container
    console.log('[qiankun-entry] container:', container)
    
    var subRoot = container && container.querySelector('#sub-root')
    console.log('[qiankun-entry] querySelector #sub-root:', subRoot)
    
    if (!subRoot && container) {
      console.log('[qiankun-entry] creating #sub-root dynamically')
      subRoot = document.createElement('div')
      subRoot.id = 'sub-root'
      container.appendChild(subRoot)
    }
    rootEl = subRoot // 更新全局引用
    console.log('[qiankun-entry] final rootEl:', rootEl)

    if (rootEl) {
      rootEl.innerHTML =
        '<div style="padding:12px;border:1px dashed #60a5fa;border-radius:10px;background:#ecfeff;color:#1f2937">' +
        '<b>[sub-react-app]</b> mount() 已被 qiankun 调用，正在加载 /src/main.jsx…' +
        '</div>'
    }
    return loadLifecycleModule()
      .then(function (m) {
        console.log('[qiankun-entry] lifecycle module loaded, calling m.mount()')
        
        if (rootEl) {
          rootEl.innerHTML =
            '<div style="padding:12px;border:1px dashed #60a5fa;border-radius:10px;background:#f0fdf4;color:#1f2937">' +
            '<b>[sub-react-app]</b> /src/main.jsx 已加载，准备 render…' +
            '</div>'
        }
        
        if (m.mount) {
          return m.mount(props)
        } else {
          console.error('[qiankun-entry] m.mount is not a function!')
          throw new Error('m.mount is not a function')
        }
      })
      .catch(function (e) {
        console.error('[qiankun-entry] mount error:', e)
        
        if (rootEl) {
          rootEl.innerHTML =
            '<div style="padding:12px;border:1px solid #ef4444;border-radius:10px;background:#fef2f2;color:#991b1b">' +
            '<b>[sub-react-app]</b> 加载或 mount 失败：<pre style="white-space:pre-wrap;margin:8px 0 0">' +
            (e && e.stack ? e.stack : e && e.message ? e.message : String(e)) +
            '</pre></div>'
        }
        throw e
      })
  },
  unmount: function (props) {
    console.log('[qiankun-entry] unmount() called')
    return loadLifecycleModule().then(function (m) {
      return m.unmount && m.unmount(props)
    })
  },
}

console.log('[qiankun-entry] window["sub-react-app"] registered, origin:', origin)



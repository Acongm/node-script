/**
 * qiankun CSS 隔离机制（最小实现）
 *
 * qiankun 两种思路（对应 start({ sandbox: { ... } })）：
 * 1) strictStyleIsolation: true  → Shadow DOM（隔离最彻底）
 * 2) experimentalStyleIsolation: true → scoped CSS（给选择器加作用域前缀）
 *
 * 本文件用“最小代码”展示这两种思路在本质上做了什么。
 */

/**
 * 把 CSS 选择器“约束”到某个容器内
 *
 * 例：
 *   .btn { color: red; }
 * 变成：
 *   [data-qiankun="app1"] .btn { color: red; }
 *
 * ⚠️ 注意：
 * - 这是教学版：只覆盖常见选择器场景
 * - 真正生产环境建议使用 PostCSS / css parser（避免 @media/@supports/@keyframes 等边界）
 */
export function scopedCSSText(cssText, scopeSelector) {
  const cleaned = String(cssText || '').trim()
  if (!cleaned) return ''

  // 粗略分块：按 `}` 拆分规则
  const blocks = cleaned.split('}')
  const scopedBlocks = blocks
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const idx = block.indexOf('{')
      if (idx === -1) return ''

      const selectorPart = block.slice(0, idx).trim()
      const bodyPart = block.slice(idx + 1).trim()

      // 跳过 @keyframes / @font-face 等（教学版简单处理）
      if (selectorPart.startsWith('@')) {
        return `${selectorPart}{${bodyPart}}`
      }

      // 多选择器：`.a, .b` → `[scope] .a, [scope] .b`
      const scopedSelector = selectorPart
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          // :root / html / body 这类全局选择器要特别注意（真实 qiankun 也有很多处理）
          // 教学版策略：直接前置 scope
          return `${scopeSelector} ${s}`
        })
        .join(', ')

      return `${scopedSelector}{${bodyPart}}`
    })
    .filter(Boolean)

  return scopedBlocks.join('\n')
}

/**
 * 把样式挂载到容器上（并返回卸载函数）
 *
 * strategy:
 * - none：不隔离（注入到 head，会污染全局）
 * - scoped：scoped CSS（选择器加前缀）
 * - shadow：Shadow DOM（严格隔离）
 */
export function mountStyle(container, cssText, { appName = 'app', strategy = 'scoped' } = {}) {
  if (!container) throw new Error('container is required')

  // 1) 无隔离：直接插到 head（最容易造成“子应用样式污染主应用/其他子应用”）
  if (strategy === 'none') {
    const style = document.createElement('style')
    style.setAttribute('data-from', appName)
    style.textContent = cssText
    document.head.appendChild(style)
    return () => style.remove()
  }

  // 2) scoped：给容器加 data-qiankun="appName"，并改写选择器
  if (strategy === 'scoped') {
    const attr = 'data-qiankun'
    container.setAttribute(attr, appName)

    const scopeSelector = `[${attr}="${appName}"]`
    const scoped = scopedCSSText(cssText, scopeSelector)

    const style = document.createElement('style')
    style.setAttribute('data-from', appName)
    style.textContent = scoped

    // qiankun 的实际效果：样式只在容器内生效（因为选择器被约束了）
    document.head.appendChild(style)

    return () => {
      style.remove()
      container.removeAttribute(attr)
    }
  }

  // 3) shadow：把容器变成 Shadow Host，样式与 DOM 一起隔离
  if (strategy === 'shadow') {
    // ⚠️ 注意：Shadow DOM 会影响弹窗/tooltip 等“挂在 body 的 portal”
    // 真实项目通常需要配合 portal 容器改造
    const shadow = container.shadowRoot || container.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.setAttribute('data-from', appName)
    style.textContent = cssText

    shadow.appendChild(style)

    return () => {
      style.remove()
      // 不建议 remove shadowRoot（浏览器不支持直接销毁），通常做法是清空内容
      // shadow.innerHTML = ''
    }
  }

  throw new Error(`Unknown strategy: ${String(strategy)}`)
}

/**
 * 两份“子应用 CSS”（故意写相同的选择器，观察冲突）
 */
export const APP1_CSS = `
  .micro-card { 
    border: 2px solid #1677ff;
    padding: 8px;
    margin: 8px 0;
  }
  .micro-title { color: #1677ff; font-weight: 600; }
`

export const APP2_CSS = `
  .micro-card { 
    border: 2px solid #ff4d4f;
    padding: 8px;
    margin: 8px 0;
  }
  .micro-title { color: #ff4d4f; font-weight: 600; }
`

/**
 * 你可以在页面里这么用（伪代码）：
 *
 * const c1 = document.getElementById('app1')
 * const c2 = document.getElementById('app2')
 *
 * // ❌ 无隔离：两个子应用都往 head 注入 .micro-card，会互相覆盖
 * mountStyle(c1, APP1_CSS, { appName: 'app1', strategy: 'none' })
 * mountStyle(c2, APP2_CSS, { appName: 'app2', strategy: 'none' })
 *
 * // ✅ scoped：选择器被改写到各自容器
 * mountStyle(c1, APP1_CSS, { appName: 'app1', strategy: 'scoped' })
 * mountStyle(c2, APP2_CSS, { appName: 'app2', strategy: 'scoped' })
 *
 * // ✅ shadow：样式直接隔离在 shadowRoot 内
 * mountStyle(c1, APP1_CSS, { appName: 'app1', strategy: 'shadow' })
 */



/**
 * qiankun JS 隔离机制（最小实现）
 *
 * 目标：用“可读”代码讲清楚 qiankun 的核心：ProxySandbox / SnapshotSandbox + 副作用清理
 *
 * ⚠️ 注意：
 * - 下面的实现是“教学版最小实现”，不是 qiankun 生产级代码
 * - 真实 qiankun 还会处理更多边界（document、动态 script、多层沙箱、全局 patchers 等）
 */

/**
 * 记录并清理副作用（事件监听、定时器）
 * qiankun 为什么需要它？
 * - 子应用 mount 期间注册的 listener / timer，如果不清理，会泄漏到主应用生命周期之外
 */
function createSideEffectScope(appName) {
  const listeners = new Set()
  const intervals = new Set()
  const timeouts = new Set()

  const recordListener = (type, handler, options) => {
    listeners.add({ type, handler, options })
  }

  const recordInterval = (id) => intervals.add(id)
  const recordTimeout = (id) => timeouts.add(id)

  const cleanup = () => {
    // 清理事件监听
    for (const { type, handler, options } of listeners) {
      window.removeEventListener(type, handler, options)
    }
    listeners.clear()

    // 清理定时器
    for (const id of intervals) {
      clearInterval(id)
    }
    intervals.clear()

    for (const id of timeouts) {
      clearTimeout(id)
    }
    timeouts.clear()

    // 你也可以在这里清理：requestAnimationFrame、history patch、fetch patch 等
    // qiankun 真实实现会更“系统化”地 patch 并回滚。
    // eslint-disable-next-line no-console
    console.log(`[${appName}] side effects cleaned`)
  }

  return {
    recordListener,
    recordInterval,
    recordTimeout,
    cleanup,
  }
}

/**
 * ProxySandbox（现代浏览器）
 *
 * 核心思想：
 * - 子应用看到的“全局对象”是 proxyWindow（Proxy）
 * - 子应用写 global 变量：proxyWindow.xxx = 1 → 写进 fakeWindow（不会污染真实 window）
 * - 子应用读 global 变量：先从 fakeWindow 读，读不到再从真实 window 读
 *
 * 同时：对 addEventListener / setInterval 这类副作用 API 做“记录”，unmount 时清理。
 */
export function createProxySandbox(appName = 'micro-app') {
  const fakeWindow = Object.create(null)
  const effectScope = createSideEffectScope(appName)

  let running = false

  const proxy = new Proxy(fakeWindow, {
    get(target, key) {
      // 1) 先读沙箱自己的属性
      if (key in target) return target[key]

      // 2) 特判：副作用 API 包装（教学版）
      if (key === 'addEventListener') {
        return (type, handler, options) => {
          effectScope.recordListener(type, handler, options)
          return window.addEventListener(type, handler, options)
        }
      }
      if (key === 'setInterval') {
        return (fn, ms, ...args) => {
          const id = window.setInterval(fn, ms, ...args)
          effectScope.recordInterval(id)
          return id
        }
      }
      if (key === 'setTimeout') {
        return (fn, ms, ...args) => {
          const id = window.setTimeout(fn, ms, ...args)
          
          effectScope.recordTimeout(id)
          return id
        }
      }

      // 3) 默认：回落到真实 window
      const value = window[key]

      // qiankun 会处理 this 绑定问题：
      // - 比如 window.addEventListener 如果脱离 window 调用，会报 Illegal invocation
      if (typeof value === 'function' && !value.prototype) {
        return value.bind(window)
      }

      return value
    },

    set(target, key, value) {
      // 子应用卸载后，写操作不再生效（教学版）
      if (!running) return true

      target[key] = value
      return true
    },

    has(target, key) {
      // 让 `key in window` 在沙箱里也成立
      return key in target || key in window
    },

    deleteProperty(target, key) {
      if (key in target) {
        delete target[key]
      }
      return true
    },
  })

  const active = () => {
    running = true
    // eslint-disable-next-line no-console
    console.log(`[${appName}] sandbox active`)
  }

  const inactive = () => {
    running = false
    effectScope.cleanup()

    // 可选：清空 fakeWindow（视需求而定）
    // Object.keys(fakeWindow).forEach((k) => delete fakeWindow[k])
    // eslint-disable-next-line no-console
    console.log(`[${appName}] sandbox inactive`)
  }

  return { proxy, active, inactive }
}

/**
 * SnapshotSandbox（兼容 IE 的思想）
 *
 * 核心思想：
 * - active：拍下 window 快照
 * - inactive：恢复快照（把 window 改回去）
 *
 * 缺点：
 * - 需要遍历 window（很重）
 * - 运行时会真实污染 window（只是卸载时回滚）
 * - 多实例困难（两个子应用同时运行会互相覆盖）
 */
export function createSnapshotSandbox(appName = 'micro-app') {
  let windowSnapshot = {}
  let running = false

  const active = () => {
    running = true
    windowSnapshot = {}

    // ⚠️ 教学版：for...in 只能遍历可枚举属性，真实场景会更复杂
    // 这里重点是理解“快照/回滚”的思想
    // eslint-disable-next-line guard-for-in
    for (const key in window) {
      windowSnapshot[key] = window[key]
    }

    // eslint-disable-next-line no-console
    console.log(`[${appName}] snapshot active`)
  }

  const inactive = () => {
    running = false

    // eslint-disable-next-line guard-for-in
    for (const key in windowSnapshot) {
      window[key] = windowSnapshot[key]
    }

    // eslint-disable-next-line no-console
    console.log(`[${appName}] snapshot inactive (window restored)`)
  }

  return { active, inactive, get running() { return running } }
}

/**
 * 模拟 qiankun 执行子应用脚本的方式：with(proxyWindow) { ... }
 *
 * qiankun 中：import-html-entry 会把子应用脚本内容拿到字符串，然后用 Function 执行。
 * 这里我们只保留关键点：让脚本“看到的 window”变成 proxy。
 */
export function execScriptWithSandbox(code, proxyWindow) {
  // ⚠️ 注意：with 在严格模式下不可用；new Function 默认是非严格模式
  // eslint-disable-next-line no-new-func
  const runner = new Function(
    'window',
    'self',
    'globalThis',
    `
      ;(function() {
        with(window) {
          ${code}
        }
      })()
    `
  )

  // self/globalThis 也指向 proxy（让子应用用 self/globalThis 写全局时也隔离）
  runner(proxyWindow, proxyWindow, proxyWindow)
}

/**
 * 一个“子应用脚本”样例（故意做一些会污染全局的事）
 */
export const DEMO_MICRO_APP_SCRIPT = `
  // 1) 写全局变量（如果没有沙箱，会污染真实 window）
  window.__MICRO_APP_HELLO__ = (window.__MICRO_APP_HELLO__ || 0) + 1

  // 2) 注册事件监听（如果不清理，会造成泄漏）
  const onResize = () => {
    // console.log('resize from micro app')
  }
  window.addEventListener('resize', onResize)

  // 3) 启动定时器（如果不清理，会一直跑）
  window.setInterval(() => {
    window.__MICRO_APP_TICK__ = (window.__MICRO_APP_TICK__ || 0) + 1
  }, 1000)
`

/**
 * 你可以在控制台这样“演示”：
 *
 * import { createProxySandbox, execScriptWithSandbox, DEMO_MICRO_APP_SCRIPT } from './01-js-sandbox-mini'
 *
 * const s1 = createProxySandbox('app1')
 * s1.active()
 * execScriptWithSandbox(DEMO_MICRO_APP_SCRIPT, s1.proxy)
 * // 观察：真实 window 上不会出现 __MICRO_APP_HELLO__（写进了 fakeWindow）
 * // 但 listener/timer 是真实挂在 window 上的，所以我们做了记录 → inactive() 清理
 *
 * s1.inactive()
 */



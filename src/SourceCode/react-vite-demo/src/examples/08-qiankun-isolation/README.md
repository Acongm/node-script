# qiankun 的 JS / CSS 隔离机制（用最小可读代码讲清楚）

> 说明：本目录不是 qiankun 源码，而是**按 qiankun 的核心思想做的“最小实现”**，用来帮助你读懂它的隔离策略。
> - **JS 隔离**：Proxy 沙箱（现代浏览器）/ 快照沙箱（兼容 IE）
> - **CSS 隔离**：scoped CSS（选择器加作用域）/ Shadow DOM（严格隔离）

## 你应该重点看什么

- `01-js-sandbox-mini.js`
  - `createProxySandbox()`：模拟 qiankun 的 ProxySandbox 核心思路
  - `createSnapshotSandbox()`：模拟快照沙箱的“激活记录、失活恢复”
  - `execScriptWithSandbox()`：模拟 import-html-entry 执行子应用脚本的方式（用 `with(proxy)`）
  - `patchers`：演示 qiankun 为什么要“记录副作用并在 unmount 清理”（event listener / timer）

- `02-css-isolation-mini.js`
  - `scopedCSSText()`：把 `.btn {}` 改写为 `[data-qiankun="app1"] .btn {}`（核心思想）
  - `mountStyle()`：演示三种策略：无隔离 / scoped / shadow

## 如何把这段“最小实现”映射回 qiankun

### JS 沙箱（ProxySandbox）

qiankun 真实做法（抽象后）：

1. 为每个子应用创建一个 `proxyWindow`
2. 执行子应用脚本时，让它的“全局对象”指向 `proxyWindow`
3. 拦截 `window.xxx =` 这类写操作，写入沙箱而不是写进真实 `window`
4. 记录副作用（listener/timer 等），在 `unmount` 时清理

### CSS 隔离

qiankun 提供两类思路：

1. **strictStyleIsolation（严格）**：使用 Shadow DOM（隔离彻底，但兼容性/弹窗等有坑）
2. **experimentalStyleIsolation（实验）**：scoped CSS（给容器加属性选择器前缀）

> 你会发现：CSS 隔离不是“神奇魔法”，本质就是**把选择器约束到子应用容器内**。



# qiankun 真实双应用 Demo（主应用 + 子应用传值）

> 目标：让你“真实跑起来”理解 qiankun 微前端如何在**主/子应用之间传值**。
>
> 本 demo 提供两种主流通信方式：
> 1. **Props/回调传值**：主应用通过 `registerMicroApps(..., { props })` 传入函数，子应用调用回传数据
> 2. **GlobalState 全局状态**：主应用用 `initGlobalState` 建立共享状态，子应用订阅/更新（双向）

## 目录结构

```
qiankun-real-demo/
├── main-app/        # 主应用（React + Vite + qiankun）
└── sub-react-app/   # 子应用（React + Vite，导出 bootstrap/mount/unmount）
```

## 运行方式（你本地执行）

> 说明：我在仓库里放的是完整工程代码；依赖需要你在本机安装（因为这里不能联网安装）。

### 1) 启动子应用（端口 7101）

```bash
cd src/SourceCode/qiankun-real-demo/sub-react-app
npm i
npm run dev
```

### 2) 启动主应用（端口 7100）

```bash
cd src/SourceCode/qiankun-real-demo/main-app
npm i
npm run dev
```

### 3) 打开页面

- 主应用：`http://localhost:7100/`
- 子应用（独立运行）：`http://localhost:7101/`
- 子应用（给 qiankun 加载的入口）：`http://localhost:7101/qiankun.html`

## 你应该观察什么

### Props/回调传值

- 主应用把 `onMessageFromSub` 传给子应用
- 子应用点击按钮调用 `props.onMessageFromSub({ ... })`
- 主应用 UI 实时展示收到的数据

### GlobalState 传值（qiankun 官方推荐之一）

- 主应用：
  - `const actions = initGlobalState({ count: 0, user: { name: 'Alice' } })`
  - `actions.setGlobalState({ count: count + 1 })`
- 子应用：
  - `props.actions.onGlobalStateChange((state) => { ... })`
  - `props.actions.setGlobalState({ ... })`

## 常见踩坑（我已经在代码里处理/注释）

- **子应用 dev server 必须允许跨域**：需要 `cors: true` + `Access-Control-Allow-Origin: *`
- **子应用需要支持两种运行模式**：
  - 被 qiankun 加载（导出生命周期）
  - 独立运行（直接 render）
- **资源路径**：用 qiankun 的 HTML Entry 时，相对路径会按 entry 自动解析；本 demo 仍在 `vite.config` 里做了建议配置



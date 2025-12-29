/**
 * Fiber 数据结构详解
 * 
 * Fiber 是 React 16 引入的核心架构
 * 每个 React 元素对应一个 Fiber 节点
 * Fiber 节点包含足够的信息以便中断后恢复
 */

// ==================== Fiber 节点定义 ====================

/**
 * 💡 Fiber 节点的完整结构（简化版）
 */
class FiberNode {
  constructor(tag, pendingProps, key) {
    // ========== 实例相关 ==========
    this.tag = tag                // 组件类型（FunctionComponent/ClassComponent/HostComponent等）
    this.key = key                // React 元素的 key
    this.elementType = null       // 元素类型
    this.type = null              // 组件函数/类，或 DOM 标签名
    this.stateNode = null         // 对应的真实 DOM 节点或组件实例

    // ========== 树结构（单链表）==========
    this.return = null            // 父 Fiber 节点
    this.child = null             // 第一个子 Fiber 节点
    this.sibling = null           // 下一个兄弟 Fiber 节点
    this.index = 0                // 在父节点中的索引

    // ========== 状态和 Props ==========
    this.ref = null               // ref 引用
    this.pendingProps = pendingProps  // 新的 props
    this.memoizedProps = null     // 上次渲染的 props
    this.memoizedState = null     // 上次渲染的 state（Hooks 链表）
    this.updateQueue = null       // 更新队列

    // ========== 副作用 ==========
    this.flags = NoFlags          // 副作用标记（Placement/Update/Deletion）
    this.subtreeFlags = NoFlags   // 子树的副作用标记
    this.deletions = null         // 要删除的子节点

    // ========== 调度相关 ==========
    this.lanes = NoLanes          // 当前 Fiber 的优先级
    this.childLanes = NoLanes     // 子树的优先级

    // ========== 双缓冲 ==========
    this.alternate = null         // 指向 workInProgress/current 树的对应节点
  }
}

// ==================== Fiber 类型（tag）==========

const FiberTag = {
  FunctionComponent: 0,       // 函数组件
  ClassComponent: 1,          // 类组件
  IndeterminateComponent: 2,  // 未确定的组件
  HostRoot: 3,                // 根节点（ReactDOM.render）
  HostPortal: 4,              // Portal
  HostComponent: 5,           // 原生 DOM 元素（div、span 等）
  HostText: 6,                // 文本节点
  Fragment: 7,                // Fragment
  Mode: 8,                    // StrictMode/ConcurrentMode
  ContextConsumer: 9,         // Context.Consumer
  ContextProvider: 10,        // Context.Provider
  ForwardRef: 11,             // forwardRef
  Profiler: 12,               // Profiler
  SuspenseComponent: 13,      // Suspense
  MemoComponent: 14,          // React.memo
  SimpleMemoComponent: 15,    // 简化的 memo
  LazyComponent: 16,          // React.lazy
}

// ==================== 副作用标记（flags）==========

const FiberFlags = {
  NoFlags: 0b000000000000000000000000,         // 无副作用
  PerformedWork: 0b000000000000000000000001,   // 执行了工作
  Placement: 0b000000000000000000000010,       // 插入节点
  Update: 0b000000000000000000000100,          // 更新节点
  PlacementAndUpdate: 0b000000000000000000000110, // 插入并更新
  Deletion: 0b000000000000000000001000,        // 删除节点
  ChildDeletion: 0b000000000000000000010000,   // 子节点删除
  ContentReset: 0b000000000000000000100000,    // 重置文本内容
  Callback: 0b000000000000000001000000,        // 有回调
  DidCapture: 0b000000000000000010000000,      // 捕获了错误
  Ref: 0b000000000000000100000000,             // ref 需要更新
  Snapshot: 0b000000000000001000000000,        // 需要 snapshot
  Passive: 0b000000000000010000000000,         // useEffect
  Hydrating: 0b000000000000100000000000,       // Hydration
  HydratingAndUpdate: 0b000000000000100000000100, // Hydration 并更新
}

// ==================== 优先级（Lanes）==========

/**
 * 💡 Lane 模型：31 条车道表示不同优先级
 * 数字越小，优先级越高
 */
const Lanes = {
  NoLanes: 0b0000000000000000000000000000000,
  NoLane: 0b0000000000000000000000000000000,

  // 同步优先级（最高）
  SyncLane: 0b0000000000000000000000000000001,

  // 输入相关（高优先级）
  InputContinuousHydrationLane: 0b0000000000000000000000000000010,
  InputContinuousLane: 0b0000000000000000000000000000100,

  // 默认优先级
  DefaultHydrationLane: 0b0000000000000000000000000001000,
  DefaultLane: 0b0000000000000000000000000010000,

  // 过渡优先级（低优先级）
  TransitionHydrationLane: 0b0000000000000000000000000100000,
  TransitionLanes: 0b0000000001111111111111111000000,

  // 重试优先级
  RetryLanes: 0b0000011110000000000000000000000,

  // 选择性 Hydration
  SelectiveHydrationLane: 0b0000100000000000000000000000000,

  // 空闲优先级（最低）
  IdleHydrationLane: 0b0001000000000000000000000000000,
  IdleLane: 0b0010000000000000000000000000000,

  // 屏幕外优先级
  OffscreenLane: 0b0100000000000000000000000000000,
}

// ==================== Fiber 树示例 ==========

/**
 * React 元素树：
 * <App>
 *   <div>
 *     <Header />
 *     <Content />
 *     <Footer />
 *   </div>
 * </App>
 * 
 * 对应的 Fiber 树结构：
 * 
 *     App (FunctionComponent)
 *      ↓ child
 *     div (HostComponent)
 *      ↓ child
 *   Header (FunctionComponent)
 *      ↓ sibling
 *   Content (FunctionComponent)
 *      ↓ sibling
 *   Footer (FunctionComponent)
 * 
 * 链表指针关系：
 * - App.child → div
 * - div.child → Header
 * - div.return → App
 * - Header.sibling → Content
 * - Header.return → div
 * - Content.sibling → Footer
 * - Content.return → div
 * - Footer.return → div
 */

// 模拟创建 Fiber 节点
function createFiberTree() {
  // 创建 App Fiber
  const appFiber = new FiberNode(FiberTag.FunctionComponent, {}, null)
  appFiber.type = App

  // 创建 div Fiber
  const divFiber = new FiberNode(FiberTag.HostComponent, {}, null)
  divFiber.type = 'div'
  divFiber.return = appFiber
  appFiber.child = divFiber

  // 创建 Header Fiber
  const headerFiber = new FiberNode(FiberTag.FunctionComponent, {}, null)
  headerFiber.type = Header
  headerFiber.return = divFiber
  divFiber.child = headerFiber

  // 创建 Content Fiber
  const contentFiber = new FiberNode(FiberTag.FunctionComponent, {}, null)
  contentFiber.type = Content
  contentFiber.return = divFiber
  headerFiber.sibling = contentFiber

  // 创建 Footer Fiber
  const footerFiber = new FiberNode(FiberTag.FunctionComponent, {}, null)
  footerFiber.type = Footer
  footerFiber.return = divFiber
  contentFiber.sibling = footerFiber

  return appFiber
}

// ==================== 双缓冲机制 ==========

/**
 * 💡 React 维护两棵 Fiber 树
 * 
 * 1. current 树：当前屏幕上显示的内容
 * 2. workInProgress 树：正在后台构建的新树
 * 
 * 通过 alternate 指针相互指向：
 * current.alternate === workInProgress
 * workInProgress.alternate === current
 * 
 * 渲染完成后，切换指针：
 * root.current = workInProgress
 */

let currentRoot = null        // 当前树的根节点
let workInProgressRoot = null // 工作中的树的根节点

function prepareFreshStack(root) {
  // 创建 workInProgress 树的根节点
  workInProgressRoot = createWorkInProgress(root.current, null)
  return workInProgressRoot
}

function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate
  
  if (workInProgress === null) {
    // 首次渲染：创建新的 Fiber 节点
    workInProgress = new FiberNode(
      current.tag,
      pendingProps,
      current.key
    )
    workInProgress.type = current.type
    workInProgress.stateNode = current.stateNode

    // 建立双向连接
    workInProgress.alternate = current
    current.alternate = workInProgress
  } else {
    // 更新：复用现有节点
    workInProgress.pendingProps = pendingProps
    workInProgress.flags = NoFlags
    workInProgress.subtreeFlags = NoFlags
    workInProgress.deletions = null
  }

  // 复制状态
  workInProgress.child = current.child
  workInProgress.memoizedProps = current.memoizedProps
  workInProgress.memoizedState = current.memoizedState
  workInProgress.updateQueue = current.updateQueue
  workInProgress.lanes = current.lanes
  workInProgress.childLanes = current.childLanes

  return workInProgress
}

/**
 * 📌 Fiber 架构的关键优势
 * 
 * 1. 可中断渲染：
 *    - 链表结构支持保存断点
 *    - 随时可以暂停和恢复
 * 
 * 2. 优先级调度：
 *    - Lane 模型支持 31 种优先级
 *    - 高优先级可以打断低优先级
 * 
 * 3. 时间切片：
 *    - 将工作拆分为小单元
 *    - 每个单元执行时间可控
 * 
 * 4. 双缓冲：
 *    - 后台构建，一次性提交
 *    - 用户看不到半成品 UI
 * 
 * 5. 副作用收集：
 *    - flags 标记需要执行的操作
 *    - Commit 阶段批量执行
 */

// 占位函数
function App() {}
function Header() {}
function Content() {}
function Footer() {}
const NoFlags = 0
const NoLanes = 0

export {
  FiberNode,
  FiberTag,
  FiberFlags,
  Lanes,
  createFiberTree,
  createWorkInProgress
}





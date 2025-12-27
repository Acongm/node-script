import { useState } from 'react'
import DemoSection from '../components/DemoSection'

function FiberVisualization() {
  const [selectedNode, setSelectedNode] = useState(null)

  const getFiberDetails = (name) => {
    const nodes = {
      'App': {
        type: 'App',
        stateNode: '函数组件实例',
        memoizedProps: '{}',
        memoizedState: 'null',
        flags: 'NoFlags',
        lanes: '0b0000',
      },
      'div': {
        type: 'div',
        stateNode: '<div> DOM 节点',
        memoizedProps: '{ className: "container" }',
        memoizedState: 'null',
        flags: 'Update',
        lanes: '0b0001',
      },
      'Header': {
        type: 'Header',
        stateNode: '函数组件实例',
        memoizedProps: '{}',
        memoizedState: 'null',
        flags: 'NoFlags',
        lanes: '0b0000',
      },
    }
    return nodes[name] || nodes['App']
  }

  const architectureDiagram = `
┌─────────────────────────────────────┐
│         React 架构（React 16+）      │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│     Scheduler（调度器）              │
│  - 任务调度                          │
│  - 时间切片                          │
│  - 优先级管理                        │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   Reconciler（协调器 - Fiber）      │
│  - Diff 算法                         │
│  - Fiber 树构建                      │
│  - 副作用收集                        │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│    Renderer（渲染器）                │
│  - DOM 操作（ReactDOM）              │
│  - 原生组件（React Native）          │
│  - Canvas（React ART）               │
└─────────────────────────────────────┘`

  return (
    <div>
      <div className="page-header">
        <h1>Fiber 架构可视化</h1>
        <p className="description">
          本示例可视化展示 Fiber 架构的核心概念：Fiber 树结构、双缓冲机制、工作循环等。
        </p>
      </div>

      <DemoSection title="1. Fiber 架构概述">
        <div className="info">
          <strong>Fiber 是什么？</strong><br/>
          Fiber 是 React 16 引入的新协调引擎，将渲染工作拆分为可中断的小单元。
          每个 Fiber 节点代表一个组件或 DOM 元素，包含足够的信息以便中断后恢复。
        </div>

        <pre style={{ whiteSpace: 'pre', fontFamily: 'monospace', lineHeight: '1.4' }}>
          {architectureDiagram}
        </pre>
      </DemoSection>

      <DemoSection title="2. Fiber 节点数据结构">
        <div className="info">
          点击节点查看详细的 Fiber 数据结构信息
        </div>

        <div style={{ background: '#fafafa', padding: '20px', borderRadius: '4px', marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Fiber 树结构：</div>
          <div>
            <div 
              onClick={() => setSelectedNode('App')}
              style={{
                display: 'inline-block',
                padding: '12px 16px',
                margin: '5px',
                background: selectedNode === 'App' ? '#1890ff' : 'white',
                color: selectedNode === 'App' ? 'white' : '#333',
                border: '2px solid #1890ff',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}>
              <div style={{ fontWeight: 'bold' }}>&lt;App /&gt;</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>FunctionComponent</div>
            </div>
          </div>
          <div style={{ marginLeft: '40px' }}>
            <div 
              onClick={() => setSelectedNode('div')}
              style={{
                display: 'inline-block',
                padding: '12px 16px',
                margin: '5px',
                background: selectedNode === 'div' ? '#1890ff' : 'white',
                color: selectedNode === 'div' ? 'white' : '#333',
                border: '2px solid #1890ff',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}>
              <div style={{ fontWeight: 'bold' }}>&lt;div&gt;</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>HostComponent</div>
            </div>
          </div>
          <div style={{ marginLeft: '80px' }}>
            <div 
              onClick={() => setSelectedNode('Header')}
              style={{
                display: 'inline-block',
                padding: '12px 16px',
                margin: '5px',
                background: selectedNode === 'Header' ? '#1890ff' : 'white',
                color: selectedNode === 'Header' ? 'white' : '#333',
                border: '2px solid #1890ff',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}>
              <div style={{ fontWeight: 'bold' }}>&lt;Header /&gt;</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>child</div>
            </div>
            <div style={{
              display: 'inline-block',
              padding: '12px 16px',
              margin: '5px',
              background: 'white',
              border: '2px solid #1890ff',
              borderRadius: '6px',
              marginLeft: '20px'
            }}>
              <div style={{ fontWeight: 'bold' }}>&lt;Content /&gt;</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>sibling</div>
            </div>
            <div style={{
              display: 'inline-block',
              padding: '12px 16px',
              margin: '5px',
              background: 'white',
              border: '2px solid #1890ff',
              borderRadius: '6px',
              marginLeft: '20px'
            }}>
              <div style={{ fontWeight: 'bold' }}>&lt;Footer /&gt;</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>sibling</div>
            </div>
          </div>
        </div>

        {selectedNode && (
          <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>Fiber 节点详情：{selectedNode}</h3>
            {Object.entries(getFiberDetails(selectedNode)).map(([key, value]) => (
              <div key={key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px',
                marginBottom: '4px',
                background: 'white',
                borderRadius: '3px',
                fontSize: '13px'
              }}>
                <span style={{ color: '#666', fontWeight: 500 }}>{key}:</span>
                <span style={{ color: '#1890ff', fontFamily: 'monospace' }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        <pre>{`// Fiber 节点核心字段
type Fiber = {
  // 实例相关
  type: any,              // 组件类型（函数/类/原生标签）
  stateNode: any,         // 对应的 DOM 节点或组件实例
  key: null | string,
  ref: null | Ref,
  
  // 树结构（链表）
  return: Fiber | null,   // 父节点
  child: Fiber | null,    // 第一个子节点
  sibling: Fiber | null,  // 下一个兄弟节点
  
  // 状态和 Props
  pendingProps: any,      // 新的 props
  memoizedProps: any,     // 上次渲染的 props
  memoizedState: any,     // 上次渲染的 state
  updateQueue: any,       // 更新队列
  
  // 副作用
  flags: Flags,           // 副作用标记（Placement/Update/Deletion）
  subtreeFlags: Flags,    // 子树的副作用标记
  
  // 调度相关
  lanes: Lanes,           // 优先级车道
  childLanes: Lanes,      // 子树优先级
  
  // 双缓冲
  alternate: Fiber | null // 指向另一棵树的对应节点
};`}</pre>
      </DemoSection>

      <DemoSection title="3. 双缓冲机制（Double Buffering）">
        <div className="info">
          React 维护两棵 Fiber 树：current（当前屏幕显示）和 workInProgress（后台构建）。
          渲染完成后，通过切换指针实现快速更新。
        </div>

        <pre style={{ whiteSpace: 'pre', fontFamily: 'monospace', lineHeight: '1.6' }}>{`渲染阶段（可中断）:
┌──────────────┐         ┌──────────────┐
│ current 树    │        │ workInProgress│
│ (屏幕显示)   │◄──────►│  (后台构建)   │
│              │alternate│              │
└──────────────┘         └──────────────┘
                     ↓
               diff + 副作用收集
                     ↓
提交阶段（同步，不可中断）:
┌──────────────┐         ┌──────────────┐
│ current 树    │   切换  │ workInProgress│
│              │ ◄────── │  变成 current │
└──────────────┘         └──────────────┘`}</pre>

        <pre>{`// 双缓冲示例
let currentRoot = null;
let workInProgressRoot = null;

function beginWork() {
  // 在 workInProgress 树上工作
  // 可以随时中断
  workInProgressRoot.child = reconcile(currentRoot.child);
}

function commitRoot() {
  // 工作完成，切换指针（原子操作）
  currentRoot = workInProgressRoot;
  workInProgressRoot = null;
  
  // 用户看到新的 UI
}`}</pre>
      </DemoSection>

      <DemoSection title="4. 工作循环（Work Loop）">
        <div className="info">
          Fiber 通过工作循环遍历节点，每处理一个节点检查时间片是否用完。
          深度优先遍历：先 child，无 child 找 sibling，无 sibling 回到 return。
        </div>

        <pre>{`// 简化的工作循环
function workLoop(deadline) {
  let shouldYield = false;
  
  while (workInProgress && !shouldYield) {
    // 处理单个 Fiber 节点
    performUnitOfWork(workInProgress);
    
    // 检查时间片是否用完
    shouldYield = deadline.timeRemaining() < 1;
  }
  
  if (workInProgress) {
    // 还有工作，下一帧继续
    requestIdleCallback(workLoop);
  } else {
    // 工作完成，提交
    commitRoot();
  }
}

function performUnitOfWork(fiber) {
  // 1. beginWork: 处理当前节点
  const next = beginWork(fiber);
  
  if (next) {
    // 有子节点，继续处理子节点
    workInProgress = next;
    return;
  }
  
  // 2. completeWork: 完成当前节点
  completeWork(fiber);
  
  // 3. 找下一个工作单元
  if (fiber.sibling) {
    // 有兄弟节点，处理兄弟
    workInProgress = fiber.sibling;
  } else {
    // 回到父节点
    workInProgress = fiber.return;
  }
}`}</pre>

        <pre style={{ whiteSpace: 'pre', fontFamily: 'monospace', lineHeight: '1.6' }}>{`遍历顺序示例：
    App (1)
     ↓
    div (2)
     ↓
  Header (3) → Content (5) → Footer (7)
     ↓            ↓             ↓
    h1 (4)       p (6)      span (8)

深度优先：1→2→3→4→5→6→7→8
完成顺序：4→3→6→5→8→7→2→1`}</pre>
      </DemoSection>

      <DemoSection title="5. React 15 vs Fiber 对比">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px'
        }}>
          <div style={{ background: '#fafafa', padding: '15px', borderRadius: '4px', borderLeft: '3px solid #ff4d4f' }}>
            <h4 style={{ marginBottom: '10px' }}>React 15（Stack Reconciler）</h4>
            <pre style={{ fontSize: '12px', margin: 0 }}>{`// 递归，无法中断
function reconcile(vnode) {
  const dom = createDOM(vnode);
  vnode.children.forEach(child => {
    reconcile(child); // 递归
  });
  // 一旦开始，必须完成整棵树
}

问题：
❌ 无法中断
❌ 大组件树卡顿
❌ 无法区分优先级
❌ 用户交互响应慢`}</pre>
          </div>

          <div style={{ background: '#fafafa', padding: '15px', borderRadius: '4px', borderLeft: '3px solid #52c41a' }}>
            <h4 style={{ marginBottom: '10px' }}>React 16+ (Fiber)</h4>
            <pre style={{ fontSize: '12px', margin: 0 }}>{`// 可中断的工作循环
function workLoop(deadline) {
  while (work && !shouldYield()) {
    work = performUnitOfWork(work);
  }
  
  if (work) {
    requestIdleCallback(workLoop);
  }
}

优势：
✅ 可中断、可恢复
✅ 时间切片
✅ 优先级调度
✅ 用户交互流畅`}</pre>
          </div>
        </div>
      </DemoSection>

      <DemoSection title="6. 生活类比">
        <div className="info">
          <strong>盖楼房的类比：</strong><br/><br/>
          
          <strong>React 15（递归）：</strong><br/>
          包工头说必须连续干，从第1层盖到第50层，中途不能停。
          有紧急电话也得等楼盖完才能接。<br/><br/>
          
          <strong>Fiber（可中断）：</strong><br/>
          每盖完一层就问：有没有紧急事？
          没有就继续盖下一层，有就先处理紧急事，之后再回来继续盖。
          用小本子（Fiber节点）记录盖到第几层了。<br/><br/>
          
          <strong>关键点：</strong><br/>
          1. 书签 = Fiber节点的链表结构，记录位置<br/>
          2. 暂停键 = 时间切片，定期检查是否需要暂停<br/>
          3. 任务管理器 = Scheduler，决定先做什么后做什么<br/>
          4. 草稿本 = workInProgress树，可以反复修改，不影响正式版
        </div>
      </DemoSection>
    </div>
  )
}

export default FiberVisualization


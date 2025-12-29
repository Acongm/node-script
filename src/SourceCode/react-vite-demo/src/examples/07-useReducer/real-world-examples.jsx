/**
 * 实际应用示例
 * 
 * 展示 useReducer 在真实项目中的使用场景
 */

import { useReducer } from 'react'

// ==================== 示例 1：购物车 ====================

/**
 * 购物车状态包含：
 * - items: 商品列表
 * - total: 总价
 * - discount: 折扣
 * - shipping: 运费
 * 
 * 这些状态高度关联，适合 useReducer
 */

const initialCartState = {
  items: [],
  total: 0,
  discount: 0,
  shipping: 0,
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity } = action.payload
      
      // 检查是否已存在
      const existingIndex = state.items.findIndex(
        item => item.product.id === product.id
      )
      
      let newItems
      if (existingIndex >= 0) {
        // 已存在，增加数量
        newItems = state.items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        // 不存在，添加新项
        newItems = [...state.items, { product, quantity }]
      }
      
      // 💡 自动重新计算总价
      const total = calculateTotal(newItems)
      
      return {
        ...state,
        items: newItems,
        total,
      }
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(
        item => item.product.id !== action.payload
      )
      
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload
      
      const newItems = state.items.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
      
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
      }
    }
    
    case 'APPLY_DISCOUNT': {
      return {
        ...state,
        discount: action.payload,
        total: state.total - action.payload,
      }
    }
    
    case 'SET_SHIPPING': {
      return {
        ...state,
        shipping: action.payload,
        total: state.total + action.payload,
      }
    }
    
    case 'CLEAR_CART':
      return initialCartState
    
    default:
      return state
  }
}

// 辅助函数
function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + item.product.price * item.quantity
  }, 0)
}

function ShoppingCart() {
  const [cart, dispatch] = useReducer(cartReducer, initialCartState)

  const addToCart = (product, quantity = 1) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { product, quantity }
    })
  }

  const removeFromCart = (productId) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: productId
    })
  }

  const updateQuantity = (productId, quantity) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { productId, quantity }
    })
  }

  return (
    <div>
      <h2>购物车</h2>
      
      {cart.items.map(item => (
        <div key={item.product.id}>
          <span>{item.product.name}</span>
          <span>¥{item.product.price}</span>
          <input
            type="number"
            value={item.quantity}
            onChange={e => updateQuantity(
              item.product.id,
              Number(e.target.value)
            )}
          />
          <button onClick={() => removeFromCart(item.product.id)}>
            删除
          </button>
        </div>
      ))}
      
      <div>
        <p>折扣：¥{cart.discount}</p>
        <p>运费：¥{cart.shipping}</p>
        <p>总计：¥{cart.total}</p>
      </div>
      
      <button onClick={() => dispatch({ type: 'CLEAR_CART' })}>
        清空购物车
      </button>
    </div>
  )
}

/**
 * 💡 为什么购物车适合 useReducer？
 * 
 * 1. 多个相关状态：
 *    - items 变化 → total 需要重新计算
 *    - discount 变化 → total 需要更新
 *    - shipping 变化 → total 需要更新
 * 
 * 2. 复杂的业务逻辑：
 *    - 添加商品需要检查是否已存在
 *    - 更新数量需要重新计算总价
 *    - 应用折扣需要调整总价
 * 
 * 3. 状态一致性：
 *    - reducer 保证所有相关状态同步更新
 *    - 不会出现 items 变了但 total 没变的情况
 * 
 * 4. 易于测试：
 *    - cartReducer 是纯函数
 *    - 可以独立测试每个 action
 */

// ==================== 示例 2：表单向导（多步骤）====================

const initialWizardState = {
  step: 1,           // 当前步骤
  maxStep: 3,        // 总步骤数
  canGoNext: false,  // 是否可以下一步
  canGoPrev: false,  // 是否可以上一步
  
  // 各步骤的数据
  step1Data: { name: '', email: '' },
  step2Data: { address: '', city: '' },
  step3Data: { paymentMethod: '', cardNumber: '' },
  
  // 验证状态
  step1Valid: false,
  step2Valid: false,
  step3Valid: false,
  
  // UI 状态
  isSubmitting: false,
  error: null,
}

function wizardReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_STEP1': {
      const step1Valid = validateStep1(action.payload)
      return {
        ...state,
        step1Data: action.payload,
        step1Valid,
        canGoNext: step1Valid,
      }
    }
    
    case 'UPDATE_STEP2': {
      const step2Valid = validateStep2(action.payload)
      return {
        ...state,
        step2Data: action.payload,
        step2Valid,
        canGoNext: step2Valid,
      }
    }
    
    case 'UPDATE_STEP3': {
      const step3Valid = validateStep3(action.payload)
      return {
        ...state,
        step3Data: action.payload,
        step3Valid,
        canGoNext: step3Valid,
      }
    }
    
    case 'NEXT_STEP': {
      const nextStep = state.step + 1
      return {
        ...state,
        step: nextStep,
        canGoPrev: nextStep > 1,
        canGoNext: isStepValid(state, nextStep),
      }
    }
    
    case 'PREV_STEP': {
      const prevStep = state.step - 1
      return {
        ...state,
        step: prevStep,
        canGoPrev: prevStep > 1,
        canGoNext: true,  // 上一步一定是验证过的
      }
    }
    
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, error: null }
    
    case 'SUBMIT_SUCCESS':
      return initialWizardState  // 重置所有状态
    
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, error: action.payload }
    
    default:
      return state
  }
}

// 验证函数
function validateStep1(data) {
  return data.name.length > 0 && data.email.includes('@')
}

function validateStep2(data) {
  return data.address.length > 0 && data.city.length > 0
}

function validateStep3(data) {
  return data.paymentMethod && data.cardNumber.length === 16
}

function isStepValid(state, step) {
  switch (step) {
    case 1: return state.step1Valid
    case 2: return state.step2Valid
    case 3: return state.step3Valid
    default: return false
  }
}

function FormWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState)

  const handleSubmit = async () => {
    dispatch({ type: 'SUBMIT_START' })
    
    try {
      await submitWizard({
        ...state.step1Data,
        ...state.step2Data,
        ...state.step3Data,
      })
      dispatch({ type: 'SUBMIT_SUCCESS' })
    } catch (err) {
      dispatch({ type: 'SUBMIT_ERROR', payload: err.message })
    }
  }

  return (
    <div>
      <h2>步骤 {state.step} / {state.maxStep}</h2>
      
      {/* 根据当前步骤显示不同内容 */}
      {state.step === 1 && (
        <Step1Form 
          data={state.step1Data}
          onChange={data => dispatch({ type: 'UPDATE_STEP1', payload: data })}
        />
      )}
      
      {state.step === 2 && (
        <Step2Form 
          data={state.step2Data}
          onChange={data => dispatch({ type: 'UPDATE_STEP2', payload: data })}
        />
      )}
      
      {state.step === 3 && (
        <Step3Form 
          data={state.step3Data}
          onChange={data => dispatch({ type: 'UPDATE_STEP3', payload: data })}
        />
      )}
      
      {/* 导航按钮 */}
      <button 
        onClick={() => dispatch({ type: 'PREV_STEP' })}
        disabled={!state.canGoPrev}
      >
        上一步
      </button>
      
      {state.step < state.maxStep ? (
        <button 
          onClick={() => dispatch({ type: 'NEXT_STEP' })}
          disabled={!state.canGoNext}
        >
          下一步
        </button>
      ) : (
        <button 
          onClick={handleSubmit}
          disabled={!state.step3Valid || state.isSubmitting}
        >
          {state.isSubmitting ? '提交中...' : '提交'}
        </button>
      )}
      
      {state.error && <p>{state.error}</p>}
    </div>
  )
}

/**
 * 💡 为什么多步骤表单适合 useReducer？
 * 
 * 1. 状态复杂：
 *    - 当前步骤
 *    - 每步的数据
 *    - 每步的验证状态
 *    - 导航状态（能否前进/后退）
 * 
 * 2. 业务逻辑复杂：
 *    - 步骤切换需要验证
 *    - 更新数据需要重新验证
 *    - 提交需要合并所有步骤数据
 * 
 * 3. 状态一致性：
 *    - reducer 保证状态转换的原子性
 *    - 不会出现步骤和验证状态不一致
 * 
 * 4. 可维护性：
 *    - 所有逻辑集中在 reducer
 *    - 易于理解状态转换
 *    - 易于添加新步骤
 */

// ==================== 示例 3：异步状态管理 ====================

/**
 * 💡 处理异步操作的典型模式
 * 
 * 状态包含：
 * - data: 数据
 * - loading: 加载中
 * - error: 错误信息
 */

const initialAsyncState = {
  data: null,
  loading: false,
  error: null,
}

function asyncReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        loading: true,
        error: null,
      }
    
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        data: action.payload,
        error: null,
      }
    
    case 'FETCH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      }
    
    case 'RESET':
      return initialAsyncState
    
    default:
      return state
  }
}

function UserProfile({ userId }) {
  const [state, dispatch] = useReducer(asyncReducer, initialAsyncState)

  const fetchUser = async () => {
    dispatch({ type: 'FETCH_START' })
    
    try {
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()
      dispatch({ type: 'FETCH_SUCCESS', payload: data })
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err.message })
    }
  }

  // 💡 优点：
  // - 状态转换清晰（START → SUCCESS/ERROR）
  // - 不会出现 loading=true 但 error 有值的情况
  // - 易于理解异步流程

  if (state.loading) return <div>加载中...</div>
  if (state.error) return <div>错误: {state.error}</div>
  if (!state.data) return <button onClick={fetchUser}>加载用户</button>
  
  return (
    <div>
      <h2>{state.data.name}</h2>
      <p>{state.data.email}</p>
      <button onClick={() => dispatch({ type: 'RESET' })}>重置</button>
    </div>
  )
}

/**
 * 💡 异步状态的典型模式
 * 
 * 三种状态：
 * 1. 初始/空闲：loading=false, data=null, error=null
 * 2. 加载中：loading=true, data=null, error=null
 * 3. 成功：loading=false, data=..., error=null
 * 4. 失败：loading=false, data=null, error=...
 * 
 * useReducer 的优势：
 * ✅ 状态转换清晰
 * ✅ 不会出现不一致的中间状态
 * ✅ 易于理解和维护
 */

// ==================== 示例 4：复杂 UI 状态（模态框管理）====================

/**
 * 管理多个模态框、侧边栏等 UI 状态
 */

const initialUIState = {
  // 模态框
  modals: {
    settings: false,
    profile: false,
    help: false,
  },
  
  // 侧边栏
  sidebar: {
    isOpen: false,
    activeTab: 'menu',
  },
  
  // 通知
  notifications: [],
  
  // 主题
  theme: 'light',
}

function uiReducer(state, action) {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload]: true,
        }
      }
    
    case 'CLOSE_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload]: false,
        }
      }
    
    case 'CLOSE_ALL_MODALS':
      return {
        ...state,
        modals: {
          settings: false,
          profile: false,
          help: false,
        }
      }
    
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebar: {
          ...state.sidebar,
          isOpen: !state.sidebar.isOpen,
        }
      }
    
    case 'SET_SIDEBAR_TAB':
      return {
        ...state,
        sidebar: {
          ...state.sidebar,
          activeTab: action.payload,
        }
      }
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: Date.now(),
            message: action.payload,
            timestamp: new Date(),
          }
        ]
      }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          n => n.id !== action.payload
        )
      }
    
    case 'TOGGLE_THEME':
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      }
    
    default:
      return state
  }
}

function AppUI() {
  const [ui, dispatch] = useReducer(uiReducer, initialUIState)

  return (
    <div className={ui.theme}>
      {/* 模态框 */}
      {ui.modals.settings && (
        <SettingsModal onClose={() => dispatch({ 
          type: 'CLOSE_MODAL', 
          payload: 'settings' 
        })} />
      )}
      
      {/* 侧边栏 */}
      {ui.sidebar.isOpen && (
        <Sidebar 
          activeTab={ui.sidebar.activeTab}
          onTabChange={tab => dispatch({ 
            type: 'SET_SIDEBAR_TAB', 
            payload: tab 
          })}
          onClose={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        />
      )}
      
      {/* 通知 */}
      {ui.notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          onClose={() => dispatch({ 
            type: 'REMOVE_NOTIFICATION', 
            payload: notification.id 
          })}
        />
      ))}
      
      {/* 控制按钮 */}
      <button onClick={() => dispatch({ type: 'OPEN_MODAL', payload: 'settings' })}>
        设置
      </button>
      <button onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}>
        切换侧边栏
      </button>
      <button onClick={() => dispatch({ type: 'TOGGLE_THEME' })}>
        切换主题
      </button>
    </div>
  )
}

/**
 * 🎯 复杂 UI 状态为什么适合 useReducer？
 * 
 * 1. 状态关联：
 *    - 打开新模态框 → 可能需要关闭其他模态框
 *    - 切换主题 → 影响所有 UI 元素
 * 
 * 2. 操作集中：
 *    - 所有 UI 操作在一个 reducer 中
 *    - 易于理解 UI 状态转换
 * 
 * 3. 易于扩展：
 *    - 添加新模态框只需一个 action
 *    - 添加新 UI 状态很容易
 * 
 * 4. 可预测：
 *    - 每个 action 都有明确的状态转换
 *    - 不会出现意外的 UI 状态
 */

// 占位组件
function SettingsModal({ onClose }) { return <div>Settings</div> }
function Sidebar({ activeTab, onTabChange, onClose }) { return <div>Sidebar</div> }
function Notification({ message, onClose }) { return <div>{message}</div> }
function Step1Form({ data, onChange }) { return <div>Step 1</div> }
function Step2Form({ data, onChange }) { return <div>Step 2</div> }
function Step3Form({ data, onChange }) { return <div>Step 3</div> }
async function submitWizard(data) { return Promise.resolve() }

export { ShoppingCart, FormWizard, UserProfile, AppUI }





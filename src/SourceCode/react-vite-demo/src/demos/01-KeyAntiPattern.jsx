import { useState, useRef } from 'react'
import DemoSection from '../components/DemoSection'

// ❌ 错误示例：使用 index 作为 key
function TodoItemWrong({ todo, onDelete }) {
  const renderCount = useRef(0)
  renderCount.current++
  
  return (
    <div className="list-item">
      <span style={{ width: '100px' }}>ID: {todo.id}</span>
      <input 
        type="text" 
        defaultValue={todo.text}
        placeholder="输入一些文字试试..."
        style={{ flex: 1 }}
      />
      <span style={{ 
        background: '#52c41a', 
        color: 'white', 
        padding: '2px 8px', 
        borderRadius: '3px',
        fontSize: '12px' 
      }}>
        渲染 {renderCount.current} 次
      </span>
      <button className="danger" onClick={onDelete}>删除</button>
    </div>
  )
}

function WrongKeyDemo() {
  const [todos, setTodos] = useState([
    { id: 'a', text: '任务 A' },
    { id: 'b', text: '任务 B' },
    { id: 'c', text: '任务 C' },
  ])

  const addTodo = () => {
    const newId = String.fromCharCode(97 + todos.length)
    setTodos([...todos, { id: newId, text: `任务 ${newId.toUpperCase()}` }])
  }

  const deleteFirst = () => {
    setTodos(todos.slice(1))
  }

  const reset = () => {
    setTodos([
      { id: 'a', text: '任务 A' },
      { id: 'b', text: '任务 B' },
      { id: 'c', text: '任务 C' },
    ])
  }

  return (
    <DemoSection title="使用 index 作为 key（错误示例）" type="wrong">
      <div className="warning">
        <strong>问题：</strong>当你在输入框中输入文字后删除第一项，会发现输入的内容出现在错误的位置！
        <br/>
        <strong>原因：</strong>React 使用 key 来识别元素。使用 index 作为 key 时，删除第一项后，
        原来 index=1 的元素变成了 index=0，React 认为是同一个元素被更新了，而不是删除了。
      </div>
      
      <div className="controls">
        <button className="success" onClick={addTodo}>添加任务</button>
        <button className="danger" onClick={deleteFirst}>删除第一项</button>
        <button className="primary" onClick={reset}>重置</button>
      </div>

      <div className="list">
        {todos.map((todo, index) => (
          <TodoItemWrong 
            key={index}  // ❌ 使用 index 作为 key
            todo={todo} 
            onDelete={() => setTodos(todos.filter((_, i) => i !== index))}
          />
        ))}
      </div>
    </DemoSection>
  )
}

// ✅ 正确示例：使用稳定的 id 作为 key
function TodoItemCorrect({ todo, onDelete }) {
  const renderCount = useRef(0)
  renderCount.current++
  
  return (
    <div className="list-item">
      <span style={{ width: '100px' }}>ID: {todo.id}</span>
      <input 
        type="text" 
        defaultValue={todo.text}
        placeholder="输入一些文字试试..."
        style={{ flex: 1 }}
      />
      <span style={{ 
        background: '#52c41a', 
        color: 'white', 
        padding: '2px 8px', 
        borderRadius: '3px',
        fontSize: '12px' 
      }}>
        渲染 {renderCount.current} 次
      </span>
      <button className="danger" onClick={onDelete}>删除</button>
    </div>
  )
}

function CorrectKeyDemo() {
  const [todos, setTodos] = useState([
    { id: 'a', text: '任务 A' },
    { id: 'b', text: '任务 B' },
    { id: 'c', text: '任务 C' },
  ])

  const addTodo = () => {
    const newId = String.fromCharCode(97 + todos.length)
    setTodos([...todos, { id: newId, text: `任务 ${newId.toUpperCase()}` }])
  }

  const deleteFirst = () => {
    setTodos(todos.slice(1))
  }

  const reset = () => {
    setTodos([
      { id: 'a', text: '任务 A' },
      { id: 'b', text: '任务 B' },
      { id: 'c', text: '任务 C' },
    ])
  }

  return (
    <DemoSection title="使用稳定的 id 作为 key（正确示例）" type="correct">
      <div className="info">
        <strong>改进：</strong>使用数据的唯一标识（如 ID）作为 key，删除第一项后，输入的内容会保持在正确的位置。
        <br/>
        <strong>原理：</strong>React 通过 id 识别每个元素，删除时真正移除对应的组件实例，其他组件保持不变。
        观察渲染次数：删除第一项时，只有第一项被销毁，其他项的渲染次数不变。
      </div>
      
      <div className="controls">
        <button className="success" onClick={addTodo}>添加任务</button>
        <button className="danger" onClick={deleteFirst}>删除第一项</button>
        <button className="primary" onClick={reset}>重置</button>
      </div>

      <div className="list">
        {todos.map((todo) => (
          <TodoItemCorrect 
            key={todo.id}  // ✅ 使用 id 作为 key
            todo={todo} 
            onDelete={() => setTodos(todos.filter(t => t.id !== todo.id))}
          />
        ))}
      </div>
    </DemoSection>
  )
}

function KeyAntiPattern() {
  return (
    <div>
      <div className="page-header">
        <h1>Key 错误使用示例</h1>
        <p className="description">
          本示例演示在列表中使用 index 作为 key 的问题。<br/>
          操作步骤：输入一些文字 → 删除第一项 → 观察输入框内容的变化
        </p>
      </div>

      <WrongKeyDemo />
      <CorrectKeyDemo />
    </div>
  )
}

export default KeyAntiPattern


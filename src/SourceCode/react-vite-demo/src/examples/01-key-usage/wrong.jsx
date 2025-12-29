/**
 * ❌ 错误示例：使用 index 作为 key
 * 
 * 问题：
 * 1. 删除列表项时，后续项的 index 会改变
 * 2. React 会认为是"更新"而不是"删除"
 * 3. 导致组件实例混淆，状态绑定错误
 */

import { useState } from 'react'

// 子组件：包含内部状态（输入框）
function TodoItem({ todo, onDelete }) {
  return (
    <div>
      <span>ID: {todo.id}</span>
      {/* 📌 这个输入框有内部状态（用户输入的值） */}
      <input 
        type="text" 
        defaultValue={todo.text}
        placeholder="输入一些文字..."
      />
      <button onClick={onDelete}>删除</button>
    </div>
  )
}

function TodoList() {
  const [todos, setTodos] = useState([
    { id: 'a', text: '任务 A' },
    { id: 'b', text: '任务 B' },
    { id: 'c', text: '任务 C' },
  ])

  const deleteFirst = () => {
    setTodos(todos.slice(1))
  }

  return (
    <div>
      <button onClick={deleteFirst}>删除第一项</button>
      
      {/* ❌ 问题：使用 index 作为 key */}
      {todos.map((todo, index) => (
        <TodoItem 
          key={index}  // ❌ 每次删除后，index 会重新分配
          todo={todo} 
          onDelete={() => setTodos(todos.filter((_, i) => i !== index))}
        />
      ))}
    </div>
  )
}

/**
 * 🔍 问题演示：
 * 
 * 初始状态：
 * index=0  key=0  id=a  input="任务 A"
 * index=1  key=1  id=b  input="任务 B"  ← 用户在这里输入了 "测试"
 * index=2  key=2  id=c  input="任务 C"
 * 
 * 删除第一项后：
 * index=0  key=0  id=b  input="任务 A"  ← ❌ React 认为这是之前的 key=0（id=a）
 * index=1  key=1  id=c  input="测试"     ← ❌ 用户输入出现在错误的位置
 * 
 * 💡 原理：
 * React 使用 key 来跟踪元素身份
 * - key=0 之前对应 id=a，现在对应 id=b
 * - React 认为 key=0 的元素只是 props 变了（id 从 a 变成 b）
 * - 但组件实例被复用，输入框的值（DOM 状态）没有被清除
 * - 导致 id=b 的任务显示了 id=a 的输入内容
 */

export default TodoList





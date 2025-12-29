/**
 * ✅ 正确示例：使用稳定的 id 作为 key
 * 
 * 优势：
 * 1. 每个元素有唯一且稳定的标识
 * 2. 删除时，React 真正删除对应的组件实例
 * 3. 其他组件实例保持不变，状态正确
 */

import { useState } from 'react'

function TodoItem({ todo, onDelete }) {
  return (
    <div>
      <span>ID: {todo.id}</span>
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
      
      {/* ✅ 解决：使用稳定的 id 作为 key */}
      {todos.map((todo) => (
        <TodoItem 
          key={todo.id}  // ✅ id 是稳定且唯一的
          todo={todo} 
          onDelete={() => setTodos(todos.filter(t => t.id !== todo.id))}
        />
      ))}
    </div>
  )
}

/**
 * 🔍 正确行为：
 * 
 * 初始状态：
 * key=a  id=a  input="任务 A"
 * key=b  id=b  input="任务 B"  ← 用户在这里输入了 "测试"
 * key=c  id=c  input="任务 C"
 * 
 * 删除第一项后：
 * key=b  id=b  input="测试"     ← ✅ 保持在正确的位置
 * key=c  id=c  input="任务 C"  ← ✅ 保持不变
 * 
 * 💡 原理：
 * - key=a 被删除，React 卸载对应的组件实例
 * - key=b 和 key=c 的组件实例保持不变
 * - 各自的内部状态（输入框的值）得以保留
 * - 用户输入的内容出现在正确的位置
 * 
 * 📌 最佳实践：
 * 1. 使用数据的唯一标识（如数据库 ID）
 * 2. 可以使用 UUID 或其他唯一生成器
 * 3. 避免使用 index，除非：
 *    - 列表是静态的（不会增删改）
 *    - 列表项没有内部状态
 *    - 列表永远不会重新排序
 */

export default TodoList





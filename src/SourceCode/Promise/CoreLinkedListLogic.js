// 链表 Promise 的核心逻辑提取
// 仅保留链表操作最关键的三个部分：定义、入队、遍历

// 1. 结构定义
class LinkedList {
  constructor() {
    this.head = null; // 头指针 (执行起点)
    this.tail = null; // 尾指针 (插入位置)
  }
}

// 2. 入队逻辑 (O(1) 复杂度)
// 对应 .then() 操作
function append (list, name, callback) {
  const node = {
    name: name, // 给节点起个名字，方便打印看
    callback,
    next: null
  };

  if (list.tail) {
    // 如果链表不为空，旧尾巴指向新节点
    list.tail.next = node;
    // 更新尾指针到新节点
    list.tail = node;
  } else {
    // 链表为空，头尾都指向新节点
    list.head = node;
    list.tail = node;
  }
}

// 3. 遍历执行逻辑
// 对应 resolve() 后的执行过程
function execute (list, initialValue) {
  let current = list.head;
  let value = initialValue;

  while (current) {
    // 执行当前任务
    value = current.callback(value);

    // 指针后移，处理下一个
    current = current.next;
  }
}

// --- 测试 ---
const taskList = new LinkedList();

console.log('1. 构建链表...');
append(taskList, "任务A", val => val + 1);
append(taskList, "任务B", val => val * 2);
append(taskList, "任务C", val => val);

console.log('1.5. 执行链表...前');

console.dir(taskList, { depth: null }); 

console.log('2. 执行链表...');
execute(taskList, 10); // 初始值 10

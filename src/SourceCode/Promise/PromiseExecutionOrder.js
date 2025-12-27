/**
 * Promise 执行顺序详解 (Event Loop 机制拆解)
 * 
 * JavaScript 的执行机制基于 "Event Loop" (事件循环)。
 * 核心概念：
 * 1. **同步代码 (Synchronous)**: 立即在主线程(Call Stack)执行。
 * 2. **异步代码 (Asynchronous)**: 分为宏任务(Macrotask)和微任务(Microtask)。
 * 
 * **执行优先级**:
 * 同步代码 > 微任务 (Microtask) > 宏任务 (Macrotask)
 * 
 * - **微任务**: Promise.then, process.nextTick (Node.js), MutationObserver
 * - **宏任务**: setTimeout, setInterval, setImmediate (Node.js), I/O, UI Rendering
 */

console.log('1. 脚本开始 (同步)');

// 宏任务 1
setTimeout(() => {
    console.log('2. setTimeout 1 (宏任务)');
    
    // 宏任务内部的微任务
    Promise.resolve().then(() => {
        console.log('3. setTimeout 1 内部的 Promise.then (微任务)');
    });
}, 0);

// Promise 构造函数是同步执行的
new Promise((resolve) => {
    console.log('4. Promise 构造函数 (同步)');
    resolve();
}).then(() => {
    // .then 回调是微任务
    console.log('5. Promise 1 .then (微任务)');
}).then(() => {
    // 链式调用，前一个 then 执行完产生新的微任务
    console.log('6. Promise 1 链式 .then (微任务)');
});

// 宏任务 2
setTimeout(() => {
    console.log('7. setTimeout 2 (宏任务)');
}, 0);

// 另一个 Promise
new Promise((resolve) => {
    console.log('8. Promise 2 构造函数 (同步)');
    resolve();
}).then(() => {
    console.log('9. Promise 2 .then (微任务)');
});

console.log('10. 脚本结束 (同步)');

/**
 * ============================================
 * 详细执行步骤拆解：
 * ============================================
 * 
 * **第一轮事件循环 (Main Script):**
 * 1. 执行同步代码: console.log('1...') -> 输出 1
 * 2. 遇到 setTimeout 1: 放入 [宏任务队列] (记为 Macro1)
 * 3. 遇到 new Promise 1:
 *    - 执行 executor (同步): console.log('4...') -> 输出 4
 *    - 调用 resolve(): Promise 状态变为 fulfilled
 *    - 遇到 .then: 回调放入 [微任务队列] (记为 Micro1)
 * 4. 遇到 setTimeout 2: 放入 [宏任务队列] (记为 Macro2)
 * 5. 遇到 new Promise 2:
 *    - 执行 executor (同步): console.log('8...') -> 输出 8
 *    - 遇到 .then: 回调放入 [微任务队列] (记为 Micro2)
 * 6. 执行同步代码: console.log('10...') -> 输出 10
 * 
 * **当前状态**:
 * - 输出: 1, 4, 8, 10
 * - 微任务队列: [Micro1, Micro2]
 * - 宏任务队列: [Macro1, Macro2]
 * 
 * **清空微任务队列:**
 * 7. 取出 Micro1 执行:
 *    - console.log('5...') -> 输出 5
 *    - 产生新的 .then: 放入 [微任务队列] (记为 Micro3)
 * 8. 取出 Micro2 执行:
 *    - console.log('9...') -> 输出 9
 * 9. 取出 Micro3 执行 (Micro1 产生的链式):
 *    - console.log('6...') -> 输出 6
 * 
 * **当前状态**:
 * - 输出: 1, 4, 8, 10, 5, 9, 6
 * - 微任务队列: [] (空)
 * - 宏任务队列: [Macro1, Macro2]
 * 
 * **开始下一轮事件循环 (执行宏任务):**
 * 10. 取出 Macro1 (setTimeout 1) 执行:
 *     - console.log('2...') -> 输出 2
 *     - 遇到 Promise.resolve().then: 放入 [微任务队列] (记为 Micro4)
 * 
 * **宏任务执行完，必须再次检查并清空微任务队列:**
 * 11. 取出 Micro4 执行:
 *     - console.log('3...') -> 输出 3
 * 
 * **继续执行宏任务:**
 * 12. 取出 Macro2 (setTimeout 2) 执行:
 *     - console.log('7...') -> 输出 7
 * 
 * **最终输出顺序**:
 * 1, 4, 8, 10 (同步)
 * 5, 9, 6 (第一轮微任务)
 * 2 (宏任务1)
 * 3 (宏任务1里的微任务)
 * 7 (宏任务2)
 */

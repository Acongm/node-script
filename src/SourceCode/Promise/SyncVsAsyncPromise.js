// 这是一个如果不使用 setTimeout (同步执行) 会导致的问题演示

console.log('--- 1. 正常 Promise (异步微任务) ---');
const p1 = new Promise((resolve) => {
    console.log('p1 executor');
    resolve(1);
});

p1.then((val) => {
    console.log('p1.then:', val);
});

console.log('p1 结束');

/**
 * 预期输出 (标准 Promise):
 * p1 executor
 * p1 结束
 * p1.then: 1
 * 
 * 关键点：'p1 结束' 在 'p1.then' 之前输出。Promise 保证 .then 回调永远是异步执行的。
 */


console.log('\n--- 2. 如果我们手动写的 MyPromise 只有同步执行 (去掉 setTimeout) ---');

class SyncPromise {
    constructor(executor) {
        this.callbacks = [];
        const resolve = (value) => {
            // 这里没有 setTimeout，直接遍历执行
            this.callbacks.forEach(fn => fn(value));
        };
        executor(resolve);
    }
    
    then(onFulfilled) {
        this.callbacks.push(onFulfilled);
    }
}

const p2 = new SyncPromise((resolve) => {
    console.log('p2 executor');
    // 如果 resolve 是同步调用的（例如这里没写 setTimeout）
    // 此时 callbacks 还是空的！因为 then 还没执行！
    resolve(2); 
});

p2.then((val) => {
    console.log('p2.then:', val);
});

console.log('p2 结束');

/**
 * 实际输出 (错误的同步实现):
 * p2 executor
 * p2 结束
 * (p2.then 的日志永远不会打印！)
 * 
 * 为什么？
 * 1. p2 executor 执行。
 * 2. 调用 resolve(2)。
 * 3. resolve 遍历 this.callbacks。
 * 4. 但是此时 .then 还没运行，this.callbacks 是空的 []。
 * 5. resolve 结束。
 * 6. 执行 p2.then，把回调放入 callbacks。
 * 7. 但是 resolve 已经跑完了，这个回调永远不会被触发了。
 */


console.log('\n--- 3. 即使加了 setTimeout 模拟异步，为什么要统一异步？ ---');
// Promise/A+ 规范 2.2.4:
// "onFulfilled or onRejected must not be called until the execution context stack contains only platform code."
// 简单说：.then 的回调必须在当前脚本所有同步代码执行完之后才能执行。

class MixedPromise {
    constructor(executor) {
        this.state = 'pending';
        this.value = undefined;
        this.callbacks = [];
        
        const resolve = (val) => {
            this.state = 'fulfilled';
            this.value = val;
            // 如果这里是同步执行
            this.callbacks.forEach(fn => fn(val));
        };
        executor(resolve);
    }

    then(fn) {
        if (this.state === 'fulfilled') {
            // 场景 A: 已经在 resolve 之后调用 then
            // 如果这里直接同步执行 fn(this.value)
            fn(this.value); 
        } else {
            // 场景 B: 还在 pending
            this.callbacks.push(fn);
        }
    }
}

console.log('ZalGo Unleashed (同步/异步混合的不确定性)');
const p3 = new MixedPromise(resolve => resolve(3)); // 立即 resolve
p3.then(v => console.log('p3.then (同步执行):', v));
console.log('p3 结束');

const p4 = new MixedPromise(resolve => setTimeout(() => resolve(4), 0)); // 异步 resolve
p4.then(v => console.log('p4.then (异步执行):', v));
console.log('p4 结束');

/**
 * 问题：
 * p3 的回调在 "p3 结束" 之前执行（同步）。
 * p4 的回调在 "p4 结束" 之后执行（异步）。
 * 
 * 这种不一致性（称为 "Releasing Zalgo"）是编程的大忌。
 * 开发者无法预测代码的执行顺序。
 * 
 * 所以 Promise 强制规定：**所有** 回调必须异步执行。
 * 无论 resolve 是同步调用的还是异步调用的，.then 的回调都要放到微任务队列里。
 */

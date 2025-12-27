// 极简版 Promise (基于数组/发布订阅)
// 去除了复杂的 Promise/A+ 规范检查，只保留核心逻辑
// 方便理解：状态管理 + 异步队列 + 链式调用

class SimplePromise {
    // 1. 定义状态
    static PENDING = 'pending';
    static FULFILLED = 'fulfilled';
    static REJECTED = 'rejected';

    constructor(executor) {
        this.status = SimplePromise.PENDING; // 初始状态
        this.value = null;                   // 成功值
        this.reason = null;                  // 失败原因
        
        // 2. 定义回调队列 (发布订阅模式)
        // 当 Promise 还是 pending 时，then 注册的回调会存在这里
        this.onFulfilledCallbacks = [];
        this.onRejectedCallbacks = [];

        // resolve 函数：改变状态，执行回调
        const resolve = (value) => {
            // 只有 pending 才能改变状态
            if (this.status === SimplePromise.PENDING) {
                this.status = SimplePromise.FULFILLED;
                this.value = value;
                // 状态变了，把之前存的成功回调都执行了
                this.onFulfilledCallbacks.forEach(cb => cb());
            }
        };

        // reject 函数：改变状态，执行回调
        const reject = (reason) => {
            if (this.status === SimplePromise.PENDING) {
                this.status = SimplePromise.REJECTED;
                this.reason = reason;
                // 状态变了，把之前存的失败回调都执行了
                this.onRejectedCallbacks.forEach(cb => cb());
            }
        };

        // 立即执行 executor
        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }

    // 3. then 方法：处理状态，返回新 Promise
    then(onFulfilled, onRejected) {
        // 参数缺省处理 (值穿透)
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : val => val;
        onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err };

        // 为了链式调用，必须返回一个新的 Promise
        return new SimplePromise((resolve, reject) => {
            
            // 封装一个处理函数，用来处理回调返回值 x
            const handle = (callback, data) => {
                try {
                    const x = callback(data);
                    // 简化版核心：判断返回值 x 是不是 Promise
                    if (x instanceof SimplePromise) {
                        // 如果是 Promise，就等它结束，复用它的 resolve/reject
                        x.then(resolve, reject);
                    } else {
                        // 如果是普通值，直接 resolve
                        resolve(x);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            // 情况1: 已经成功了 (同步 resolve) -> 异步执行回调
            if (this.status === SimplePromise.FULFILLED) {
                setTimeout(() => handle(onFulfilled, this.value), 0);
            }

            // 情况2: 已经失败了 (同步 reject) -> 异步执行回调
            if (this.status === SimplePromise.REJECTED) {
                setTimeout(() => handle(onRejected, this.reason), 0);
            }

            // 情况3: 还在等待 (异步 resolve) -> 存入队列
            if (this.status === SimplePromise.PENDING) {
                this.onFulfilledCallbacks.push(() => {
                    setTimeout(() => handle(onFulfilled, this.value), 0);
                });
                this.onRejectedCallbacks.push(() => {
                    setTimeout(() => handle(onRejected, this.reason), 0);
                });
            }
        });
    }
}

// ==========================================
// 测试代码
// ==========================================
console.log('--- 简化版 Promise 测试 ---');

const p = new SimplePromise((resolve, reject) => {
    console.log('1. 构造函数同步执行');
    setTimeout(() => {
        resolve('异步数据');
    }, 1000);
});

p.then(data => {
    console.log(`2. 收到数据: ${data}`);
    return '链式结果 1';
}).then(data => {
    console.log(`3. 收到: ${data}`);
    // 返回一个新的异步 Promise
    return new SimplePromise(resolve => {
        setTimeout(() => {
            resolve('链式结果 2 (异步)');
        }, 1000);
    });
}).then(data => {
    console.log(`4. 收到: ${data}`);
});

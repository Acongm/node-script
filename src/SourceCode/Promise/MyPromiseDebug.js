// 简易版Promise实现 - 带调试日志
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

// 全局步骤计数器
let stepCount = 0;
const log = (msg, ...args) => {
    stepCount++;
    console.log(`【${stepCount}】${msg}`, ...args);
};

// Promise 实例 ID 计数器
let promiseIdCounter = 0;

class MyPromise {
    constructor(executor) {
        this.id = ++promiseIdCounter; // 给每个实例分配唯一 ID
        log(`[1. Constructor] 创建 Promise(id=${this.id}) 实例，状态为 PENDING`);
        this.status = PENDING; 
        this.value = undefined; 
        this.reason = undefined; 
        this.onFulfilledCallbacks = []; 
        this.onRejectedCallbacks = []; 

        const resolve = (value) => {
            log(`[Resolve] Promise(id=${this.id}) resolve被调用，尝试将状态改为 FULFILLED, 当前状态: ${this.status}, 值: ${value}`);
            if (this.status === PENDING) {
                this.status = FULFILLED;
                this.value = value;
                log(`[Resolve] Promise(id=${this.id}) 状态已更新为 FULFILLED，准备异步执行 ${this.onFulfilledCallbacks.length} 个成功回调`);
                
                setTimeout(() => {
                    log(`[ResolveAsync] Promise(id=${this.id}) 开始执行 onFulfilledCallbacks 队列`);
                    this.onFulfilledCallbacks.forEach(fn => fn());
                }, 0);
            }
        };

        const reject = (reason) => {
            log(`[Reject] Promise(id=${this.id}) reject被调用，尝试将状态改为 REJECTED, 当前状态: ${this.status}, 原因: ${reason}`);
            if (this.status === PENDING) {
                this.status = REJECTED;
                this.reason = reason;
                log(`[Reject] Promise(id=${this.id}) 状态已更新为 REJECTED，准备异步执行 ${this.onRejectedCallbacks.length} 个失败回调`);
                
                setTimeout(() => {
                    log(`[RejectAsync] Promise(id=${this.id}) 开始执行 onRejectedCallbacks 队列`);
                    this.onRejectedCallbacks.forEach(fn => fn());
                }, 0);
            }
        };

        try {
            log(`[2. Executor] Promise(id=${this.id}) 立即执行 executor 函数`);
            executor(resolve, reject);
        } catch (error) {
            log(`[ExecutorError] Promise(id=${this.id}) executor 执行出错`, error);
            reject(error);
        }
    }

    then(onFulfilled, onRejected) {
        log(`[3. Then] Promise(id=${this.id}) .then 方法被调用`);
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
        onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };

        const promise2 = new MyPromise((resolve, reject) => {
            // 注意：这里的 this 指向调用 then 的那个 Promise (上一个 Promise)
            log(`[ThenExecutor] 正在构造新的 Promise，当前上一个 Promise(id=${this.id}) 状态: ${this.status}`);
            
            if (this.status === FULFILLED) {
                log(`[Then] Promise(id=${this.id}) 状态是 FULFILLED，安排异步执行 onFulfilled`);
                setTimeout(() => {
                    try {
                        const x = onFulfilled(this.value);
                        this.resolvePromise(promise2, x, resolve, reject);
                    } catch (error) {
                        reject(error);
                    }
                }, 0);
            }

            if (this.status === REJECTED) {
                log(`[Then] Promise(id=${this.id}) 状态是 REJECTED，安排异步执行 onRejected`);
                setTimeout(() => {
                    try {
                        const x = onRejected(this.reason);
                        this.resolvePromise(promise2, x, resolve, reject);
                    } catch (error) {
                        reject(error);
                    }
                }, 0);
            }

            if (this.status === PENDING) {
                log(`[Then] Promise(id=${this.id}) 状态是 PENDING，将回调加入队列`);
                this.onFulfilledCallbacks.push(() => {
                    log(`[Callback] 执行 Promise(id=${this.id}) pending 状态加入的成功回调`);
                    setTimeout(() => {
                        try {
                            const x = onFulfilled(this.value);
                            this.resolvePromise(promise2, x, resolve, reject);
                        } catch (error) {
                            reject(error);
                        }
                    }, 0);
                });

                this.onRejectedCallbacks.push(() => {
                    log(`[Callback] 执行 Promise(id=${this.id}) pending 状态加入的失败回调`);
                    setTimeout(() => {
                        try {
                            const x = onRejected(this.reason);
                            this.resolvePromise(promise2, x, resolve, reject);
                        } catch (error) {
                            reject(error);
                        }
                    }, 0);
                });
            }
        });

        return promise2;
    }

    resolvePromise(promise2, x, resolve, reject) {
        // promise2 是新创建的 Promise
        log(`[ResolvePromise] 开始处理返回值 x: ${x}, 目标 Promise(id=${promise2.id})`);
        if (promise2 === x) {
            return reject(new TypeError('Chaining cycle detected for promise'));
        }

        let called = false;
        if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
            try {
                const then = x.then;
                if (typeof then === 'function') {
                    log(`[ResolvePromise] x 是一个 Promise/Thenable，调用它的 then`);
                    then.call(x, y => {
                        if (called) return;
                        called = true;
                        this.resolvePromise(promise2, y, resolve, reject);
                    }, r => {
                        if (called) return;
                        called = true;
                        reject(r);
                    });
                } else {
                    log(`[ResolvePromise] x 是普通对象，直接 resolve 目标 Promise(id=${promise2.id})`);
                    resolve(x);
                }
            } catch (error) {
                if (called) return;
                called = true;
                reject(error);
            }
        } else {
            log(`[ResolvePromise] x 是普通值，直接 resolve 目标 Promise(id=${promise2.id})`);
            resolve(x);
        }
    }
}

// 演示代码
log('=== 开始演示 ===');

// 场景：异步 Resolve + 链式调用
const p1 = new MyPromise((resolve, reject) => {
    log('[UserExecutor] 用户代码开始执行，设置 1s 后 resolve');
    setTimeout(() => {
        log('[UserTimeout] 定时器触发，调用 resolve');
        resolve('Result 1');
    }, 100);
});

// 为了演示清楚，我把 p1.then(...).then(...) 拆开写
log('--- 准备执行第一个 p1.then ---');
const p2 = p1.then((val) => {
    log(`[UserCallback1] 第一个 then 收到值: ${val}`);
    return 'Result 2';
});
log(`--- p1.then 执行完毕，返回了新的 Promise(id=${p2.id}) ---`);

log(`--- 准备执行 p2.then (即第二个 .then) ---`);
const p3 = p2.then((val) => {
    log(`[UserCallback2] 第二个 then 收到值: ${val}`);
});
log(`--- p2.then 执行完毕，返回了新的 Promise(id=${p3.id}) ---`);

log('=== 同步代码结束 ===');

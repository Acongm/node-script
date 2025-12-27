// 简易版Promise实现
// 定义三种状态常量
const PENDING = 'pending';   // 等待状态
const FULFILLED = 'fulfilled'; // 成功状态
const REJECTED = 'rejected';   // 失败状态

class MyPromise {
    constructor(executor) {
        this.status = PENDING; // 初始状态为 pending
        this.value = undefined; // 存储成功时的值
        this.reason = undefined; // 存储失败时的原因
        this.onFulfilledCallbacks = []; // 存储成功的回调函数（发布订阅模式）
        this.onRejectedCallbacks = []; // 存储失败的回调函数

        // resolve 函数：将状态从 pending 变为 fulfilled
        const resolve = (value) => {
            // 只有 pending 状态才能改变状态
            if (this.status === PENDING) {
                this.status = FULFILLED;
                this.value = value;
                // 状态改变后，异步执行所有订阅的成功回调
                // 使用 setTimeout 模拟微任务（虽然 setTimeout 是宏任务，但这里用于模拟异步）
                setTimeout(() => {
                    this.onFulfilledCallbacks.forEach(fn => fn());
                }, 0);
            }
        };

        // reject 函数：将状态从 pending 变为 rejected
        const reject = (reason) => {
            // 只有 pending 状态才能改变状态
            if (this.status === PENDING) {
                this.status = REJECTED;
                this.reason = reason;
                // 状态改变后，异步执行所有订阅的失败回调
                setTimeout(() => {
                    this.onRejectedCallbacks.forEach(fn => fn());
                }, 0);
            }
        };

        // 立即执行 executor，并传入 resolve 和 reject
        // 如果 executor 执行报错，直接 reject
        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }

    // then 方法：接收成功和失败的回调，并返回一个新的 Promise
    then(onFulfilled, onRejected) {
        // 参数校验：如果不是函数，创建一个默认函数，实现值穿透
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
        onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };

        // 为了实现链式调用，需要返回一个新的 Promise (promise2)
        const promise2 = new MyPromise((resolve, reject) => {
            // 如果当前状态是 fulfilled，异步执行 onFulfilled
            if (this.status === FULFILLED) {
                setTimeout(() => {
                    try {
                        // 获取 onFulfilled 的返回值 x
                        const x = onFulfilled(this.value);
                        // 处理返回值 x，决定 promise2 的状态
                        this.resolvePromise(promise2, x, resolve, reject);
                    } catch (error) {
                        // 如果执行出错，promise2 变为 rejected
                        reject(error);
                    }
                }, 0);
            }

            // 如果当前状态是 rejected，异步执行 onRejected
            if (this.status === REJECTED) {
                setTimeout(() => {
                    try {
                        const x = onRejected(this.reason);
                        this.resolvePromise(promise2, x, resolve, reject);
                    } catch (error) {
                        reject(error);
                    }
                }, 0);
            }

            // 如果当前状态是 pending，将回调函数存入数组（订阅）
            if (this.status === PENDING) {
                this.onFulfilledCallbacks.push(() => {
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

    // resolvePromise：处理 then 回调的返回值 x，决定 promise2 的状态
    // 符合 Promise/A+ 规范的核心方法
    resolvePromise(promise2, x, resolve, reject) {
        // 1. 如果 promise2 和 x 引用同一个对象，抛出类型错误（防止循环引用）
        if (promise2 === x) {
            return reject(new TypeError('Chaining cycle detected for promise'));
        }

        let called = false; // 防止多次调用 resolve 或 reject

        // 2. 如果 x 是对象或函数（可能是 Promise 或 thenable）
        if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
            try {
                // 取出 then 方法
                const then = x.then;
                // 3. 如果 then 是函数，认为 x 是一个 Promise (或 thenable)
                if (typeof then === 'function') {
                    // 执行 then，绑定 this 为 x
                    then.call(x, y => {
                        if (called) return;
                        called = true;
                        // 递归解析 y，因为 y 可能还是一个 Promise
                        this.resolvePromise(promise2, y, resolve, reject);
                    }, r => {
                        if (called) return;
                        called = true;
                        reject(r);
                    });
                } else {
                    // 4. 如果 then 不是函数，说明 x 是普通对象，直接 resolve
                    resolve(x);
                }
            } catch (error) {
                // 取 then 或执行 then 过程中报错
                if (called) return;
                called = true;
                reject(error);
            }
        } else {
            // 5. 如果 x 是普通值（数字、字符串等），直接 resolve
            resolve(x);
        }
    }

    // catch 方法：相当于 then(null, onRejected)
    catch(onRejected) {
        return this.then(null, onRejected);
    }
}

// 静态方法：MyPromise.resolve
// 返回一个解析过的 Promise 对象
MyPromise.resolve = function(value) {
    // 如果 value 已经是 MyPromise 实例，直接返回
    if (value instanceof MyPromise) {
        return value;
    }
    // 否则返回一个新的 MyPromise，并 resolve 这个 value
    return new MyPromise((resolve) => resolve(value));
};

// 静态方法：MyPromise.reject
// 返回一个带有拒绝原因的 Promise 对象
MyPromise.reject = function(reason) {
    return new MyPromise((resolve, reject) => reject(reason));
};

// 静态方法：MyPromise.all
// 接收一个 Promise 数组，只有当所有 Promise 都成功时才成功，只要有一个失败就失败
MyPromise.all = function(promises) {
    return new MyPromise((resolve, reject) => {
        const results = []; // 存储所有 Promise 的结果
        let completed = 0; // 计数器，记录已完成的 Promise 数量
        
        // 如果传入空数组，直接 resolve 空数组
        if (promises.length === 0) {
            resolve(results);
            return;
        }
        
        promises.forEach((promise, index) => {
            // 使用 MyPromise.resolve 包装，防止传入的不是 Promise
            MyPromise.resolve(promise).then(result => {
                results[index] = result; // 按顺序存储结果
                completed++;
                // 当所有 Promise 都完成时，resolve 结果数组
                if (completed === promises.length) {
                    resolve(results);
                }
            }).catch(reject); // 只要有一个失败，直接 reject
        });
    });
};

// 静态方法：MyPromise.race
// 接收一个 Promise 数组，只要有一个 Promise 完成（成功或失败），就采用它的结果
MyPromise.race = function(promises) {
    return new MyPromise((resolve, reject) => {
        promises.forEach(promise => {
            // 谁先完成（resolve 或 reject），MyPromise 就以谁的状态为准
            MyPromise.resolve(promise).then(resolve).catch(reject);
        });
    });
};

// ==========================================
// 测试 Demo
// ==========================================

// console.log('--- 测试 1: 基本功能 ---');
const p1 = new MyPromise((resolve, reject) => {
    setTimeout(() => {
        resolve('成功！');
    }, 1000);
});

p1.then(value => {
    console.log('p1 then:', value);
    return '链式调用';
}).then(value => {
    console.log('p1 chain:', value);
});

// console.log('--- 测试 2: 错误处理 ---');
const p2 = new MyPromise((resolve, reject) => {
    setTimeout(() => {
        reject('失败！');
    }, 500);
});

p2.then(value => {
    console.log('p2 success:', value);
}).catch(reason => {
    console.error('p2 catch:', reason);
});

// console.log('--- 测试 3: MyPromise.all ---');
const p3 = MyPromise.resolve(3);
const p4 = 42;
const p5 = new MyPromise((resolve, reject) => {
    setTimeout(resolve, 100, 'foo');
});

MyPromise.all([p3, p4, p5]).then(values => {
    console.log('MyPromise.all results:', values); // [3, 42, "foo"]
});

// console.log('--- 测试 4: MyPromise.race ---');
const p6 = new MyPromise(resolve => setTimeout(resolve, 500, 'one'));
const p7 = new MyPromise(resolve => setTimeout(resolve, 100, 'two'));

MyPromise.race([p6, p7]).then(value => {
    console.log('MyPromise.race result:', value); // "two"
});

/*
 * ==========================================
 * MyPromise 源码执行流程总结
 * ==========================================
 * 
 * 1. 【初始化】new MyPromise(executor)
 *    - 状态初始化为 PENDING。
 *    - 立即执行 executor(resolve, reject)。
 * 
 * 2. 【注册回调】调用 .then(onFulfilled, onRejected)
 *    - 【同步执行】：
 *      - 无论当前状态如何，.then 总是立即返回一个新的 Promise 实例 (promise2)。
 *      - 如果状态是 PENDING：将回调封装并存入 callbacks 队列（发布订阅）。
 * 
 * 3. 【状态变更】调用 resolve(value) 或 reject(reason)
 *    - 修改当前 Promise 的状态 (PENDING -> FULFILLED/REJECTED)。
 *    - 保存 value 或 reason。
 *    - 【异步触发】：使用 setTimeout 将“执行回调队列”的任务放入微任务/宏任务队列。
 * 
 * 4. 【执行回调】
 *    - 当主线程同步代码执行完毕，事件循环取出回调任务执行。
 *    - 执行 onFulfilled(value) 或 onRejected(reason)。
 * 
 * 5. 【链式传递】resolvePromise(promise2, x, resolve, reject)
 *    - 获取回调的返回值 x。
 *    - 如果 x 是普通值：直接 resolve promise2。
 *    - 如果 x 是 Promise：等待 x 状态改变，然后用 x 的结果去 resolve/reject promise2。
 *    - 这样实现了 .then 的链式调用和状态传递。
 */

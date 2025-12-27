// 简易版Promise实现
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
    constructor(executor) {
        this.status = PENDING; // 初始状态
        this.value = undefined; // 成功的值
        this.reason = undefined; // 失败的原因
        this.onFulfilledCallbacks = []; // 存储成功回调
        this.onRejectedCallbacks = []; // 存储失败回调

        const resolve = (value) => {
            if (this.status === PENDING) {
                this.status = FULFILLED;
                this.value = value;
                // 异步执行所有成功回调
                setTimeout(() => {
                    this.onFulfilledCallbacks.forEach(fn => fn());
                }, 0);
            }
        };

        const reject = (reason) => {
            if (this.status === PENDING) {
                this.status = REJECTED;
                this.reason = reason;
                // 异步执行所有失败回调
                setTimeout(() => {
                    this.onRejectedCallbacks.forEach(fn => fn());
                }, 0);
            }
        };

        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }

    then(onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
        onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };

        const promise2 = new MyPromise((resolve, reject) => {
            if (this.status === FULFILLED) {
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

    resolvePromise(promise2, x, resolve, reject) {
        if (promise2 === x) {
            return reject(new TypeError('Chaining cycle detected for promise'));
        }

        let called = false;
        if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
            try {
                const then = x.then;
                if (typeof then === 'function') {
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
                    resolve(x);
                }
            } catch (error) {
                if (called) return;
                called = true;
                reject(error);
            }
        } else {
            resolve(x);
        }
    }
}

// 静态方法
MyPromise.resolve = function(value) {
    return new MyPromise((resolve) => resolve(value));
};

MyPromise.reject = function(reason) {
    return new MyPromise((resolve, reject) => reject(reason));
};

MyPromise.all = function(promises) {
    return new MyPromise((resolve, reject) => {
        const results = [];
        let completed = 0;
        
        if (promises.length === 0) {
            resolve(results);
            return;
        }
        
        promises.forEach((promise, index) => {
            MyPromise.resolve(promise).then(result => {
                results[index] = result;
                completed++;
                if (completed === promises.length) {
                    resolve(results);
                }
            }).catch(reject);
        });
    });
};

MyPromise.race = function(promises) {
    return new MyPromise((resolve, reject) => {
        promises.forEach(promise => {
            MyPromise.resolve(promise).then(resolve).catch(reject);
        });
    });
};
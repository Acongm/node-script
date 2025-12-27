// 链表节点类：用于存储 .then 注册的回调函数和下一次 Promise 的控制权
class HandlerNode {
    constructor(onFulfilled, onRejected, resolve, reject) {
        this.onFulfilled = onFulfilled; // 成功回调
        this.onRejected = onRejected;   // 失败回调
        this.resolve = resolve;         // 下一个 Promise 的 resolve
        this.reject = reject;           // 下一个 Promise 的 reject
        this.next = null;               // 指向链表中的下一个节点
    }
}

// 使用链表实现回调管理的 Promise
class LinkedListPromise {
    static PENDING = 'pending';
    static FULFILLED = 'fulfilled';
    static REJECTED = 'rejected';

    constructor(executor) {
        this.status = LinkedListPromise.PENDING;
        this.value = undefined;
        this.reason = undefined;
        
        // 使用链表头尾指针代替数组
        this.head = null; // 链表头
        this.tail = null; // 链表尾

        const resolve = (value) => {
            if (this.status === LinkedListPromise.PENDING) {
                this.status = LinkedListPromise.FULFILLED;
                this.value = value;
                this.processQueue();
            }
        };

        const reject = (reason) => {
            if (this.status === LinkedListPromise.PENDING) {
                this.status = LinkedListPromise.REJECTED;
                this.reason = reason;
                this.processQueue();
            }
        };

        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }

    then(onFulfilled, onRejected) {
        // 参数校验与默认值
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : val => val;
        onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err };

        return new LinkedListPromise((resolve, reject) => {
            // 创建新的节点
            const node = new HandlerNode(onFulfilled, onRejected, resolve, reject);

            // 将节点加入链表尾部
            if (this.tail) {
                this.tail.next = node;
                this.tail = node;
            } else {
                this.head = node;
                this.tail = node;
            }

            // 如果当前已经不是 PENDING 状态，立即触发处理队列
            // (虽然是"立即"，但 processQueue 内部是异步执行的)
            if (this.status !== LinkedListPromise.PENDING) {
                this.processQueue();
            }
        });
    }

    // 处理链表中的所有回调任务
    processQueue() {
        // 使用 setTimeout 模拟微任务，确保异步执行
        setTimeout(() => {
            if (this.status === LinkedListPromise.PENDING) return;

            // 从头节点开始遍历
            let currentNode = this.head;
            
            while (currentNode) {
                const { onFulfilled, onRejected, resolve, reject } = currentNode;
                
                try {
                    let x;
                    if (this.status === LinkedListPromise.FULFILLED) {
                        x = onFulfilled(this.value);
                    } else {
                        x = onRejected(this.reason);
                    }

                    // 核心：处理返回值 x
                    this.resolvePromise(x, resolve, reject);
                } catch (error) {
                    reject(error);
                }

                // 移动到下一个节点
                currentNode = currentNode.next;
            }

            // 处理完毕后清空链表，防止重复执行
            this.head = null;
            this.tail = null;
        }, 0);
    }

    // 解析返回值 x，决定下一个 Promise 的状态
    resolvePromise(x, resolve, reject) {
        // 如果 x 是一个 Promise (或具有 then 方法的对象)
        if (x instanceof LinkedListPromise || (typeof x === 'object' && x !== null && typeof x.then === 'function')) {
            // 如果是异步的 Promise，必须等待它状态改变
            // 这里我们简单处理，假设 x 是同类型的 Promise
            // 如果 x 是 Promise，调用它的 then，将 resolve/reject 传入
            // 这样 x 完成时，会自动触发下一个 Promise 的 resolve/reject
            try {
                const then = x.then;
                if (typeof then === 'function') {
                    then.call(x, 
                        y => {
                            // 递归解析，直到 y 是普通值
                            this.resolvePromise(y, resolve, reject); 
                        },
                        r => {
                            reject(r);
                        }
                    );
                } else {
                    resolve(x);
                }
            } catch (e) {
                reject(e);
            }
        } else {
            // 如果是普通值（同步），直接 resolve
            resolve(x);
        }
    }
}

// ==========================================
// 测试案例
// ==========================================

console.log('--- 测试开始 ---');

const p1 = new LinkedListPromise((resolve, reject) => {
    console.log('1. 构造函数同步执行');
    setTimeout(() => {
        console.log('2. 异步 resolve 触发');
        resolve('Result Data');
    }, 1000);
});

p1.then(res => {
    console.log(`3. 第一个 then 收到: ${res}`);
    return 'Chain Data 1'; // 同步返回
}).then(res => {
    console.log(`4. 第二个 then 收到: ${res}`);
    // 返回一个新的异步 Promise
    return new LinkedListPromise(resolve => {
        setTimeout(() => {
            resolve('Async Chain Data 2');
        }, 1000);
    });
}).then(res => {
    console.log(`5. 第三个 then 收到 (等待异步后): ${res}`);
});

console.log('--- 同步代码结束，等待异步结果 ---');

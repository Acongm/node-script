// 极简版链表 Promise
// 移除了错误处理(reject)和复杂的 Promise/A+ 规范检查
// 只保留核心：用链表管理回调，实现 .then 的顺序执行

class SimplePromise {
    constructor(executor) {
        // 链表头尾指针
        this.head = null;
        this.tail = null;

        const resolve = (value) => {
            // 模拟异步：保证 .then 先把链表建好，再执行
            setTimeout(() => {
                this.executeChain(value);
            }, 0);
        };

        executor(resolve);
    }

    // 注册回调：向链表末尾追加节点
    then(onFulfilled) {
        return new SimplePromise((resolveNext) => {
            // 1. 创建节点（不用复杂的类，直接用对象）
            const node = {
                callback: onFulfilled,
                resolveNext: resolveNext, // 用于触发下一个 Promise
                next: null
            };

            // 2. 加入链表（尾插法）
            if (this.tail) {
                this.tail.next = node; // 旧尾巴指向新节点
                this.tail = node;      // 更新尾巴指针
            } else {
                this.head = node;      // 头也是它
                this.tail = node;      // 尾也是它
            }
        });
    }

    // 执行链表：从头到尾遍历
    executeChain(value) {
        let currentNode = this.head;

        // 遍历链表中的每一个任务
        while (currentNode) {
            const { callback, resolveNext } = currentNode;
            
            // 1. 执行当前的回调，获取返回值
            const result = callback(value);

            // 2. 判断返回值是不是异步的 SimplePromise
            if (result instanceof SimplePromise) {
                // 如果是异步，必须等它完成
                // 这里利用它的 then 方法，把"触发下一个节点"的任务交给它
                result.then(nextValue => {
                    resolveNext(nextValue);
                });
            } else {
                // 如果是同步值，直接传递给下一个 Promise
                resolveNext(result);
            }

            // 3. 移动到下一个节点
            currentNode = currentNode.next;
        }
    }
}

// ==========================================
// 测试代码
// ==========================================
console.log('--- 开始测试 ---');

const p = new SimplePromise(resolve => {
    console.log('1. 构造函数执行');
    setTimeout(() => {
        console.log('2. 异步 resolve');
        resolve('初始数据');
    }, 1000);
});

p.then(data => {
    console.log(`3. 收到: ${data}`);
    return '第一步结果';
}).then(data => {
    console.log(`4. 收到: ${data}`);
    // 返回一个新的异步任务
    return new SimplePromise(resolve => {
        setTimeout(() => {
            resolve('第二步异步结果');
        }, 1000);
    });
}).then(data => {
    console.log(`5. 收到: ${data}`);
});

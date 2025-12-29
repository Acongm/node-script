# JS 为什么会设计 Promise & 如何手写实现一个 Promise

## 笔试题（6题）

### 1. 为什么需要 Promise
JS 为什么会设计 Promise？它解决了什么问题（回调地狱、错误处理、组合异步）？

**【作答】：**

```
解决的问题:
1. 回调地狱（Callback Hell）：多层嵌套回调导致代码难以阅读和维护
2. 错误处理困难：回调函数中错误处理分散，难以统一捕获
3. 异步流程控制：难以按顺序执行多个异步操作，难以并行处理
4. 信任问题：回调可能被多次调用或不被调用，缺乏状态管理

回调地狱示例及 Promise 改进:

// 回调地狱
getData(function(a) {
  getMoreData(a, function(b) {
    getMoreData(b, function(c) {
      getMoreData(c, function(d) {
        // 嵌套过深，难以维护
      });
    });
  });
});

// Promise 改进
getData()
  .then(a => getMoreData(a))
  .then(b => getMoreData(b))
  .then(c => getMoreData(c))
  .then(d => {
    // 链式调用，清晰易读
  })
  .catch(error => {
    // 统一错误处理
  });

错误处理优势:

// 回调方式：错误处理分散
function fetchData(callback) {
  asyncOperation((err, data) => {
    if (err) {
      // 每个回调都要处理错误
      callback(err);
      return;
    }
    callback(null, data);
  });
}

// Promise 方式：统一错误处理
fetchData()
  .then(data => {
    // 处理数据
  })
  .catch(error => {
    // 统一捕获所有错误
  });

异步组合能力:

// 串行执行
promise1()
  .then(result1 => promise2(result1))
  .then(result2 => promise3(result2));

// 并行执行
Promise.all([promise1(), promise2(), promise3()])
  .then(([r1, r2, r3]) => {
    // 所有结果都返回后处理
  });

// 竞态执行
Promise.race([promise1(), promise2()])
  .then(firstResult => {
    // 第一个完成的结果
  });
```

---

### 2. Promise 状态机
Promise 的三种状态是什么？状态转换规则？为什么状态不可逆？

**【作答】：**

```
三种状态:
1. pending（等待中）：初始状态，既不是成功也不是失败
2. fulfilled（已成功）：操作成功完成
3. rejected（已失败）：操作失败

状态转换规则:
- 只能从 pending → fulfilled 或 pending → rejected
- 状态一旦改变，就不能再变回 pending
- fulfilled 和 rejected 之间不能相互转换
- 状态转换是单向的、不可逆的

为什么不可逆:
1. 保证一致性：一旦 Promise 有了确定的结果（成功或失败），这个结果就是最终的，不会改变
2. 避免竞态条件：如果状态可以逆转，可能导致多个 then 回调看到不同的状态
3. 简化逻辑：不可逆性使得 Promise 的行为可预测，便于理解和调试
4. 符合现实语义：异步操作的结果一旦确定，在逻辑上就不应该改变
```

---

### 3. Promise A+ 规范核心
Promise A+ 规范的核心要点有哪些？then 方法的返回值处理、链式调用、值穿透？

**【作答】：**

```
核心要点:
1. Promise 必须提供 then 方法来访问当前或最终的值或原因
2. then 方法必须返回一个新的 Promise
3. onFulfilled 和 onRejected 都是可选的，如果不是函数则必须被忽略
4. onFulfilled 和 onRejected 必须作为函数调用，且最多调用一次
5. then 方法可以被同一个 Promise 调用多次
6. 执行顺序：then 方法必须异步执行（微任务）

then 返回值处理:
1. 如果 onFulfilled 或 onRejected 返回一个值 x，则运行 Promise 解决过程 [[Resolve]](promise2, x)
2. 如果返回一个 Promise，则采用该 Promise 的状态
3. 如果抛出异常，则 promise2 必须被拒绝，并以该异常作为原因
4. 如果 onFulfilled 不是函数且 promise1 已成功，promise2 必须成功并返回相同的值（值穿透）
5. 如果 onRejected 不是函数且 promise1 已失败，promise2 必须失败并返回相同的原因（值穿透）

链式调用:
Promise 的 then 方法返回一个新的 Promise，因此可以链式调用：

promise
  .then(value => {
    return value * 2;  // 返回普通值，下一个 then 接收该值
  })
  .then(value => {
    return new Promise(resolve => resolve(value + 1));  // 返回 Promise，等待其解决
  })
  .then(value => {
    console.log(value);  // 接收上一个 Promise 的结果
  });

值穿透:
当 then 的参数不是函数时，值会"穿透"到下一个 then：

Promise.resolve(1)
  .then(2)  // 2 不是函数，被忽略
  .then(3)  // 3 不是函数，被忽略
  .then(value => console.log(value));  // 输出 1，值穿透了

Promise.reject('error')
  .then(null, null)  // 两个参数都不是函数
  .catch(err => console.log(err));  // 错误也会穿透
```

---

### 4. Promise 静态方法
Promise.all / race / allSettled / any 的区别？各自的使用场景和返回值？

**【作答】：**

```
Promise.all:
- 功能：等待所有 Promise 成功，或第一个失败
- 返回值：如果全部成功，返回所有结果的数组（按输入顺序）；如果有一个失败，立即返回该失败原因
- 使用场景：需要等待多个异步操作全部完成，且它们相互依赖
- 特点：短路特性，一旦有 Promise 失败，立即返回失败

示例：
Promise.all([promise1(), promise2(), promise3()])
  .then(([r1, r2, r3]) => console.log('全部成功', r1, r2, r3))
  .catch(err => console.log('有失败', err));

Promise.race:
- 功能：返回第一个完成（成功或失败）的 Promise 结果
- 返回值：第一个完成的 Promise 的结果或原因
- 使用场景：超时控制、竞态条件、获取最快响应
- 特点：不等待其他 Promise，只要有一个完成就返回

示例：
Promise.race([fetchData(), timeout(5000)])
  .then(data => console.log('数据获取成功'))
  .catch(err => console.log('超时或失败'));

Promise.allSettled:
- 功能：等待所有 Promise 完成（无论成功或失败）
- 返回值：包含所有结果的数组，每个元素是 {status: 'fulfilled'|'rejected', value|reason}
- 使用场景：需要知道所有异步操作的结果，即使有失败也要继续
- 特点：不会短路，等待所有 Promise 完成

示例：
Promise.allSettled([promise1(), promise2(), promise3()])
  .then(results => {
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Promise ${index} 成功:`, result.value);
      } else {
        console.log(`Promise ${index} 失败:`, result.reason);
      }
    });
  });

Promise.any:
- 功能：等待第一个成功的 Promise，或所有都失败
- 返回值：第一个成功的 Promise 的结果；如果全部失败，返回 AggregateError
- 使用场景：多个备用方案，只要有一个成功即可
- 特点：忽略失败，只关注成功

示例：
Promise.any([fetchFromServer1(), fetchFromServer2(), fetchFromServer3()])
  .then(data => console.log('任一服务器响应成功', data))
  .catch(err => console.log('所有服务器都失败', err));
```

---

### 5. 手写 Promise 核心逻辑
手写一个简化版 Promise，实现构造函数、状态管理、then 方法。

**【作答】：**

```javascript
class MyPromise {
  constructor(executor) {
    this.state = 'pending';  // pending, fulfilled, rejected
    this.value = undefined;   // 成功时的值
    this.reason = undefined; // 失败时的原因
    this.onFulfilledCallbacks = []; // 成功回调队列
    this.onRejectedCallbacks = [];  // 失败回调队列

    const resolve = (value) => {
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = value;
        // 异步执行所有成功回调
        this.onFulfilledCallbacks.forEach(fn => fn());
      }
    };

    const reject = (reason) => {
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.reason = reason;
        // 异步执行所有失败回调
        this.onRejectedCallbacks.forEach(fn => fn());
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    // 值穿透：如果参数不是函数，则忽略
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason; };

    // 返回新的 Promise 以支持链式调用
    const promise2 = new MyPromise((resolve, reject) => {
      if (this.state === 'fulfilled') {
        // 异步执行，使用 setTimeout 模拟微任务
        setTimeout(() => {
          try {
            const x = onFulfilled(this.value);
            this.resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      } else if (this.state === 'rejected') {
        setTimeout(() => {
          try {
            const x = onRejected(this.reason);
            this.resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      } else {
        // pending 状态，将回调加入队列
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

  // Promise 解决过程
  resolvePromise(promise2, x, resolve, reject) {
    // 防止循环引用
    if (promise2 === x) {
      return reject(new TypeError('Chaining cycle detected'));
    }

    let called = false; // 防止多次调用

    if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
      try {
        const then = x.then;
        if (typeof then === 'function') {
          // x 是 thenable 对象
          then.call(
            x,
            y => {
              if (called) return;
              called = true;
              this.resolvePromise(promise2, y, resolve, reject);
            },
            r => {
              if (called) return;
              called = true;
              reject(r);
            }
          );
        } else {
          // x 是普通对象
          resolve(x);
        }
      } catch (error) {
        if (called) return;
        called = true;
        reject(error);
      }
    } else {
      // x 是普通值
      resolve(x);
    }
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  static resolve(value) {
    if (value instanceof MyPromise) {
      return value;
    }
    return new MyPromise(resolve => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => reject(reason));
  }
}
```

---

### 6. async/await 与 Promise
async/await 是如何基于 Promise 实现的？它的优势是什么？错误处理如何做？

**【作答】：**

```
实现原理:
async/await 本质上是 Promise 的语法糖，基于 Generator 函数和自动执行器实现：

1. async 函数总是返回一个 Promise
2. await 会暂停函数执行，等待 Promise 解决
3. 如果 await 的是 Promise，则等待其解决；如果是普通值，则直接返回
4. 底层通过 Generator + 自动执行器实现暂停和恢复

转换过程：
async function foo() {
  const result = await promise;
  return result;
}

// 等价于
function foo() {
  return promise.then(result => {
    return result;
  });
}

优势:
1. 代码更简洁：消除了 .then() 链，代码看起来像同步代码
2. 错误处理更直观：可以使用 try/catch 处理异步错误
3. 调试友好：调用栈更清晰，断点调试更方便
4. 条件逻辑更简单：if/else、循环等控制流更自然
5. 变量作用域更清晰：不需要在 then 回调中定义变量

错误处理:
1. try/catch 捕获：可以捕获 await 表达式中抛出的错误
2. catch 方法：async 函数返回的 Promise 可以用 .catch() 捕获
3. 错误传播：async 函数中抛出的错误会被转换为 rejected Promise

// 方式1：try/catch
async function fetchData() {
  try {
    const data = await api.getData();
    return data;
  } catch (error) {
    console.error('获取数据失败', error);
    throw error; // 重新抛出，让调用者处理
  }
}

// 方式2：.catch()
fetchData()
  .then(data => console.log(data))
  .catch(error => console.error(error));

等价转换示例:

// async/await 版本
async function example() {
  try {
    const user = await fetchUser();
    const posts = await fetchPosts(user.id);
    const comments = await fetchComments(posts[0].id);
    return { user, posts, comments };
  } catch (error) {
    console.error(error);
  }
}

// Promise 版本
function example() {
  return fetchUser()
    .then(user => {
      return fetchPosts(user.id).then(posts => {
        return fetchComments(posts[0].id).then(comments => {
          return { user, posts, comments };
        });
      });
    })
    .catch(error => {
      console.error(error);
    });
}

// 更清晰的 Promise 版本（使用链式调用）
function example() {
  return fetchUser()
    .then(user => fetchPosts(user.id))
    .then(posts => fetchComments(posts[0].id))
    .then(comments => ({ user, posts, comments }))
    .catch(error => console.error(error));
}
```

---

## 面试题（4题）

### 1. 手写 Promise.all
手写实现 Promise.all，要求处理边界情况（空数组、非 Promise 值、reject 短路）。

**【作答】：**

```javascript
Promise.myAll = function(promises) {
  // 处理空数组
  if (!Array.isArray(promises)) {
    throw new TypeError('参数必须是数组');
  }

  if (promises.length === 0) {
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    const results = [];
    let completedCount = 0;
    const total = promises.length;

    promises.forEach((promise, index) => {
      // 处理非 Promise 值，使用 Promise.resolve 包装
      Promise.resolve(promise)
        .then(value => {
          results[index] = value;
          completedCount++;

          // 所有 Promise 都完成
          if (completedCount === total) {
            resolve(results);
          }
        })
        .catch(error => {
          // 一旦有 Promise 失败，立即 reject（短路特性）
          reject(error);
        });
    });
  });
};

// 测试用例

// 1. 基本功能：全部成功
Promise.myAll([
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
]).then(results => {
  console.log('全部成功:', results); // [1, 2, 3]
});

// 2. 有失败的情况：短路
Promise.myAll([
  Promise.resolve(1),
  Promise.reject('error'),
  Promise.resolve(3)
]).catch(error => {
  console.log('捕获错误:', error); // 'error'
});

// 3. 空数组
Promise.myAll([]).then(results => {
  console.log('空数组:', results); // []
});

// 4. 非 Promise 值
Promise.myAll([1, 2, Promise.resolve(3)])
  .then(results => {
    console.log('包含非Promise值:', results); // [1, 2, 3]
  });

// 5. 异步操作
Promise.myAll([
  new Promise(resolve => setTimeout(() => resolve('a'), 100)),
  new Promise(resolve => setTimeout(() => resolve('b'), 50)),
  Promise.resolve('c')
]).then(results => {
  console.log('异步操作:', results); // ['a', 'b', 'c'] (保持输入顺序)
});






```

---

### 2. Promise 链式调用原理
详细解释 Promise 链式调用的原理，为什么 then 可以链式调用？返回值如何影响下一个 then？

**【作答】：**

```




```

---

### 3. Promise 实践问题
在实际开发中，Promise 使用有哪些常见坑（未捕获错误、忘记 return、循环中的 Promise）？如何规避？

**【作答】：**

```




```

---

### 4. Promise vs Callback vs async/await
对比回调、Promise、async/await 三种异步方案的优缺点，什么场景下你会选择哪一种？

**【作答】：**

```




```

---


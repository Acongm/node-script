# JS 为什么会设计 Promise & 如何手写实现一个 Promise

## 笔试题（6题）

### 1. 为什么需要 Promise
JS 为什么会设计 Promise？它解决了什么问题（回调地狱、错误处理、组合异步）？

**【作答】：**

```
解决的问题:


回调地狱示例及 Promise 改进:


错误处理优势:


异步组合能力:


```

---

### 2. Promise 状态机
Promise 的三种状态是什么？状态转换规则？为什么状态不可逆？

**【作答】：**

```
三种状态:


状态转换规则:


为什么不可逆:


```

---

### 3. Promise A+ 规范核心
Promise A+ 规范的核心要点有哪些？then 方法的返回值处理、链式调用、值穿透？

**【作答】：**

```
核心要点:


then 返回值处理:


链式调用:


值穿透:


```

---

### 4. Promise 静态方法
Promise.all / race / allSettled / any 的区别？各自的使用场景和返回值？

**【作答】：**

```
Promise.all:


Promise.race:


Promise.allSettled:


Promise.any:


```

---

### 5. 手写 Promise 核心逻辑
手写一个简化版 Promise，实现构造函数、状态管理、then 方法。

**【作答】：**

```javascript
class MyPromise {
  constructor(executor) {
    // 你的实现
  }

  then(onFulfilled, onRejected) {
    // 你的实现
  }
}
```

---

### 6. async/await 与 Promise
async/await 是如何基于 Promise 实现的？它的优势是什么？错误处理如何做？

**【作答】：**

```
实现原理:


优势:


错误处理:


等价转换示例:


```

---

## 面试题（4题）

### 1. 手写 Promise.all
手写实现 Promise.all，要求处理边界情况（空数组、非 Promise 值、reject 短路）。

**【作答】：**

```javascript
Promise.myAll = function(promises) {
  // 你的实现
};

// 测试用例






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


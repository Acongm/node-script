# Webpack 架构 & 与 Rollup、Vite 对比 & 核心原理

## 笔试题（6题）

### 1. Webpack 构建流程
画出 Webpack 构建流程的关键步骤（entry → loader → plugin → chunk → asset），并解释每个步骤的作用。

**【作答】：**

```
流程图：


各步骤作用：
entry:

loader:

plugin:

chunk:

asset:


```

---

### 2. Loader vs Plugin
loader 与 plugin 的本质区别是什么？各自的执行时机、能力边界？举例说明什么场景用 loader，什么场景用 plugin。

**【作答】：**

```
本质区别：


执行时机：
loader:

plugin:


能力边界：


使用场景示例：


```

---

### 3. Module Graph vs Chunk Graph
Webpack 的 module graph 与 chunk graph 分别是什么？它们之间的关系？为什么需要两个图？

**【作答】：**

```
Module Graph:


Chunk Graph:


两者关系：


为什么需要两个图：


```

---

### 4. Rollup Tree-shaking
Rollup 的 tree-shaking 为什么通常比 Webpack 更"干净"？需要满足哪些条件才能有效 tree-shake？

**【作答】：**

```
Rollup tree-shaking 更干净的原因：


有效 tree-shake 的条件：


```

---

### 5. Vite 为什么快
Vite dev 为什么快？请从三个层面分析：请求、编译、缓存/预构建。

**【作答】：**

```
请求层面：


编译层面：


缓存/预构建层面：


```

---

### 6. Webpack HMR 原理
解释 Webpack HMR 的基本原理，包括：hash、manifest、module.hot API、更新边界的概念。

**【作答】：**

```
Hash 的作用：


Manifest 是什么：


module.hot API：


更新边界：


完整流程：


```

---

## 面试题（4题）

### 1. 从 0 设计打包器
从 0 设计一个打包器，你会如何抽象"模块解析、依赖图构建、产物生成"这三个核心环节？需要考虑哪些扩展点？

**【作答】：**

```




```

---

### 2. Vite 的开发/生产模式差异
Vite 为什么开发用 ESM、生产仍要 bundling？分别解决什么问题？这种设计有什么取舍？

**【作答】：**

```




```

---

### 3. Webpack 性能优化
Webpack 性能瓶颈通常在哪几个环节？你会如何定位（指标/工具/策略）？给出你的优化清单。

**【作答】：**

```




```

---

### 4. Webpack 迁移到 Vite
一个大型项目从 Webpack 迁移到 Vite，你会如何评估风险、兼容性问题、分阶段落地方案？

**【作答】：**

```




```

---


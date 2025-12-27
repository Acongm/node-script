# 从性能优化到 HTTP 变化及缓存

## 笔试题（6题）

### 1. HTTP/1.1 vs HTTP/2 vs HTTP/3
对比 HTTP/1.1、HTTP/2、HTTP/3 的核心差异，以及它们对前端性能优化的影响。

**【作答】：**

```
HTTP/1.1:
核心特性:
性能瓶颈:


HTTP/2:
核心特性:
性能提升:


HTTP/3:
核心特性:
性能提升:


对前端优化策略的影响:


```

---

### 2. HTTP 缓存机制
HTTP 缓存机制详解：强缓存（Expires、Cache-Control）vs 协商缓存（ETag、Last-Modified）。

**【作答】：**

```
强缓存:
Expires:
Cache-Control:


协商缓存:
ETag:
Last-Modified:


缓存流程:


优先级:


```

---

### 3. Cache-Control 指令
Cache-Control 常用指令有哪些？max-age、no-cache、no-store、public、private 的区别？

**【作答】：**

```
max-age:


no-cache:


no-store:


public:


private:


组合使用场景:


```

---

### 4. 缓存策略设计
如何为不同资源设计缓存策略（HTML、JS/CSS、图片、API）？文件指纹（hash）的作用？

**【作答】：**

```
HTML:


JS/CSS:


图片/字体:


API:


文件指纹 (hash):


```

---

### 5. Service Worker 缓存
Service Worker 缓存与 HTTP 缓存的区别？SW 缓存策略有哪些（CacheFirst、NetworkFirst）？

**【作答】：**

```
区别:


CacheFirst:


NetworkFirst:


StaleWhileRevalidate:


其他策略:


```

---

### 6. 缓存失效与更新
如何解决缓存更新问题？版本号、文件指纹、缓存清理策略？

**【作答】：**

```
缓存更新问题:


版本号方案:


文件指纹方案:


缓存清理:


最佳实践:


```

---

## 面试题（4题）

### 1. 缓存策略优化
给一个网站设计完整的缓存策略，从 HTTP 缓存到 CDN 到 Service Worker，如何组合使用？

**【作答】：**

```




```

---

### 2. HTTP/2 优化策略变化
HTTP/2 下，传统的性能优化策略（合并文件、雪碧图、域名分片）哪些失效了？为什么？

**【作答】：**

```




```

---

### 3. 缓存问题排查
用户反馈"看到的是旧版本"，你如何排查缓存问题？从浏览器、CDN、服务器多个层面分析。

**【作答】：**

```




```

---

### 4. 缓存实践经验
讲一个你优化缓存策略的经验：初始状态、优化方案、效果数据、遇到的坑？

**【作答】：**

```




```

---


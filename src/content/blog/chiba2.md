---
title: 'Chiba’s Memory Management, Safety, and Concurrency Design'
description: 'One of Chiba’s core objectives is to provide near-zero-overhead automatic memory management without relying on a traditional Tracing GC, while ensuring memory safety in concurrent environments.'
pubDate: 'April 16 2026'
heroImage: '/chiba2.jpeg'
ogImage: 'https://chiba-lang.org/chiba2.jpeg'
---

Chiba 语言的目标之一是在不引入传统 Tracing GC 的前提下，提供接近零负担的自动内存管理，同时在并发场景下保证内存安全。它不是依赖单一机制来解决所有问题，而是把不同场景拆成六层：基于 `reset` 的 Arena、传染性逃逸分析、Perceus 精确引用计数 + FBIP、跨 world 的 `send` 安全约束、可变引用与 `#[sync]`，以及最后以 world 为单位的并发与调度模型。
One of Chiba’s core objectives is to provide near-zero-overhead automatic memory management without relying on a traditional Tracing GC, while ensuring memory safety in concurrent environments. Instead of a monolithic mechanism, Chiba decomposes different scenarios into six distinct layers: `reset`-based Arenas, contagious escape analysis, Perceus reference counting with FBIP, `send` safety constraints for cross-world data, mutable references with `#[sync]`, and finally, a world-based concurrency and scheduling model.

读这篇文章时，可以先抓住一个总原则：**值应该尽可能待在最便宜、最局部、最短命的地方；只有在生命周期、共享方式或线程边界逼迫它升级时，才进入更重的机制。**
When reading this, keep one guiding principle in mind: **values should reside in the cheapest, most local, and shortest-lived location possible; they only upgrade to heavier mechanisms when forced by their lifecycle, sharing patterns, or thread boundaries.**

---

## 第一层：`reset` 作天然 Arena 边界 / Layer 1: `reset` as a Natural Arena Boundary

Chiba 使用 `shift` / `reset` 作为 delimited continuation 的操作原语。一个有趣的性质是：`reset :label { ... }` 天然定义了一个作用域边界，执行流无论以何种方式离开这个边界，边界内分配的临时对象都应该失效。因此，我们让每一个 `reset` 关联一个 Arena (Bump Allocator)。
Chiba uses `shift` / `reset` as its primitives for delimited continuations. An intriguing property of `reset :label { ... }` is that it naturally defines a scope boundary. Regardless of how execution leaves this boundary, temporary objects allocated within it should become invalid. Consequently, we associate an Arena (Bump Allocator) with every `reset`.

在这个 `reset` 内部产生的所有局部中间值，默认都分配在这个 Arena 中。离开 `reset` 时，Arena 被一次性、整体、O(1) 地释放——不需要逐对象遍历，不需要引用计数，不需要 GC。
All local intermediate values generated inside a `reset` are allocated in this Arena by default. When leaving the `reset`, the Arena is freed in its entirety in O(1) time—no per-object traversal, no reference counting, and no GC required.

```
reset :r {
  let xs = map(list, (x) => { x + 1 })   // xs 的所有节点在 :r 的 Arena
  let ys = filter(xs, (x) => { x > 3 })  // ys 的所有节点同上
  fold(ys, 0, (a, b) => { a + b })        // 返回一个 int，:r 结束，xs/ys 批量消失
}
```

### Arena 大小的静态估算 / Static Estimation of Arena Size

Arena 不一定真需要在堆上 malloc。编译器会尽力在编译期估算 `reset` 内部需要的空间。如果 `reset` body 是直线代码，编译器会直接在栈上 `alloca`；如果有循环但能推断次数，则预留上界。栈退化是首选，让用户得到真正意义上的「零堆分配」。
An Arena doesn't necessarily require `malloc` on the heap. The compiler attempts to estimate the required space at compile time. If the `reset` body is straight-line code, it uses `alloca` on the stack; if loops have inferable bounds, it reserves the upper bound. Stack promotion is preferred, providing users with true "zero heap allocation" scopes.

---

## 第二层：传染性逃逸分析 / Layer 2: Contagious Escape Analysis

Arena 只能管理不逃逸的对象。当一个值需要在 `reset` 结束后继续存活，它必须被「提升 (promote)」到堆上，走引用计数路径。逃逸的决定是静态的，在编译期完成。
Arenas can only manage non-escaping objects. When a value must survive beyond the end of a `reset`, it must be "promoted" to the heap and managed via reference counting. This escape decision is static and determined at compile time.

### 逃逸的传染性 / The Contagious Nature of Escaping

关键约束：Arena 内的对象必须保持「纯净」，不持有任何 RC 堆对象的指针。否则 Arena 批量释放时不会调用析构，会导致 RC 泄漏。因此，逃逸沿引用链向上传染：如果值 B 逃逸，所有持有 B 的引用的 Arena 值 A 也必须逃逸，直到不动点为止。
A critical constraint is that objects within an Arena must remain "pure," holding no pointers to RC heap objects. Otherwise, since Arenas are freed in bulk without calling individual destructors, RC counts would leak. Thus, escaping propagates up the reference chain: if value B escapes, any Arena value A holding a reference to B must also escape, until a fixed point is reached.

### 嵌套 `reset` 与分层 Arena / Nested `reset` and Layered Arenas

“逃逸”更准确地说应该是：值要被放到能覆盖它生命周期的最内层区域。如果一个值只逃出内层 `:b` 但活在 `:a` 内，它会分配在 `Arena_a` 而不是堆。这个分析本质上是一次 liveness 传播，代价与普通逃逸分析同阶。
"Escaping" is more accurately described as placing a value in the innermost region that covers its entire lifecycle. If a value escapes an inner `:b` but stays within `:a`, it is allocated in `Arena_a` instead of the heap. This analysis is essentially a liveness propagation with a cost comparable to standard escape analysis.

---

## 第三层：Perceus RC, Uniqueness 与 FBIP / Layer 3: Perceus RC, Uniqueness, and FBIP

逃逸到堆上的对象由 Perceus 精确引用计数管理。Perceus 在编译期插入精确的 `dup`/`drop` 操作：在每个变量的最后一次使用位置才释放，从而最大化重用机会。
Objects that escape to the heap are managed by Perceus precise reference counting. Perceus inserts exact `dup` and `drop` operations at compile time, releasing variables at their precise point of last use to maximize reuse opportunities.

### FBIP：函数式代码，原地修改 / FBIP: Functional But In-Place

当一个值是 `unique`（RC=1），且代码对其做了解构后重构时，Perceus 可以识别出「旧节点可被立即重用」模式，直接原地覆写内存。代码写的是纯函数式风格，但运行时效果等同于手写的命令式原地修改。这就是 FBIP。
When a value is `unique` (RC=1) and is deconstructed then reconstructed, Perceus recognizes the "old node can be immediately reused" pattern and overwrites the memory in place. The code remains purely functional in style, but the runtime performance matches hand-written imperative mutations. This is FBIP.

---

## 第四层：并发模型与 `send` 安全约束 / Layer 4: Concurrency and `send` Safety Constraints

Chiba 的并发模型以 **world** 为单位隔离。不同 world 之间通过 channel 传递消息，这是跨 world 交换数据的唯一合法方式。
Chiba’s concurrency model is isolated by **worlds**. Message passing via channels is the only legal way to exchange data between different worlds.

### `send` 标注 / The `send` Annotation

`send` 是一个逃逸点标注，表示该值可能跨 world 传递。含有 continuation 或 Arena 指针的类型天然不可跨 world（!send），因为这会导致在错误的线程恢复栈帧（UB）。`send` 检查是硬性的语法错误。
The `send` annotation marks a value that may cross world boundaries. Types containing continuations or Arena pointers are inherently non-sendable (!send), as invoking them on the wrong thread would attempt to restore a stack frame in the wrong context (UB). Failing a `send` check results in a hard compilation error.

---

## 第五层：可变引用与 `#[sync]` / Layer 5: Mutable References and `#[sync]`

Chiba 提供 `Ref[T]` 用于单线程内的受控可变性。它类似于 `IORef`，天然是 `!send`。
Chiba provides `Ref[T]` for controlled mutability within a single thread. Similar to `IORef`, it is inherently `!send`.

对于跨 world 的同步，Chiba 使用 `UnsafeRef[T]` 作为最低级原语，并用 `#[sync]` 为结构体打上“同步承诺”。这避免了复杂的名义化类型系统，同时保持了与其结构化类型系统的兼容性。
For cross-world synchronization, Chiba uses `UnsafeRef[T]` as a low-level primitive and employs `#[sync]` to mark structural "synchronization promises." This avoids the complexity of a nominal type system while remaining compatible with its structural typing core.

---

## 第六层：以 World 为单位的调度 / Layer 6: World-based Scheduling

Chiba 不内置全局 M:N 调度器。每个 world 绑定一个 OS 线程。world 内部可以自由实现协程调度，但跨 world 必须走 `send`。这种“请求粘滞”在某个 world 的设计通过局部性（Cache/Arena）极大地优化了 HTTP/RPC 等负载。
Chiba lacks a global M:N scheduler; instead, each world is bound to an OS thread. Users can implement coroutine scheduling within a world, but interaction between worlds must use `send`. This "request-stickiness" to a specific world optimizes workloads like HTTP/RPC by leveraging data locality (Cache/Arena).

---

## 总结 / Summary

Chiba 的内存管理不是单一机制，而是针对不同生命周期的快路径：短命值走 Arena，共享值走 Perceus，唯一值走 FBIP，跨线程走 `send`。
Chiba’s memory management isn't a single mechanism but a series of fast paths for different lifecycles: short-lived values use Arenas, shared values use Perceus, unique values use FBIP, and cross-thread values use `send`.

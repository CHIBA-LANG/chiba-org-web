# Chiba `send` / `!send` Capability Spec

## 0. 范围

本文规定 Chiba 中 `send` / `!send` 的语义位置、表面语法与默认判定方向。

本文的目标不是一次性完成完整并发类型系统，而是先固定下面几件事：

- `send` 是 builtin capability，而不是普通 interface
- `send` / `!send` 可以附着在哪些类型与声明位置上
- closure、`Ref[T]`、`Ptr[T]`、`UnsafeRef[T]`、continuation 的默认方向是什么
- 完整的染色检查应发生在哪一层

当前边界是：

- level-1 固定并行模型所需的 `send` / `!send` / world boundary 基本语义
- level-1 至少要能拒绝显然非法的 world crossing / closure capture / storage 写入
- 后续层级可以扩展更完整的并发协议，但不得改变 `Ref`、ordinary value、Atomic 的根规则

## 0. Scope

This document defines the semantic placement, surface syntax, and default classification rules for `send` and `!send` in Chiba.

The goal is not to finish a full concurrency type system in one step, but level-1 must still fix the parallel-compilation model: `send` is a builtin capability rather than an ordinary interface, `send` and `!send` can attach to specific type and declaration positions, closures and reference-like forms have default directions, and the checker must reject obvious illegal world crossings, closure captures, and writes into `send`-requiring storage. Later layers may extend the concurrency protocol, but they must not change the root rules for `Ref`, ordinary values, and atomics.

## 1. 基本规则

`send` 表示某个值可以跨 world 边界传递，或可以被存入要求可跨 world 传递的类型位置。

`!send` 表示该值不能被当作可跨 world 传递的值使用。

`send` / `!send` 的核心关注点是：

- world boundary legality
- storage legality
- closure capture legality

它们不表示：

- 普通方法集合
- interface witness
- `via` 选择的 implementation bundle
- 函数调用本身的 effect

因此，`send` 必须作为 builtin capability 进入类型系统，而不是作为普通 interface constraint 进入 method resolution。

## 1. Basic Rules

`send` means a value may cross world boundaries or may be stored in a position that requires cross-world mobility. `!send` means the value may not be used that way.

The core concern of `send` and `!send` is world-boundary legality, storage legality, and closure-capture legality. They do not represent method sets, interface witnesses, implementation bundles selected through `via`, or effects of function calls. That is why `send` must enter the type system as a builtin capability, not as an ordinary interface constraint inside method resolution.

## 2. 表面语法

### 2.1 类型后缀 qualifier

`send` / `!send` 应作为完整类型表达式的后缀 qualifier 使用。

例如：

```chiba
type Job ((Msg) => Unit) send
type LocalJob ((Msg) => Unit) !send
```

该 qualifier 修饰的是整个类型表达式，而不是其中某个局部节点。

### 2.2 泛型约束

泛型约束采用：

```chiba
[T: send]
```

这里的 `send` 是 builtin capability requirement，而不是普通 interface 名称。

### 2.3 函数与 closure 签名

函数或 closure 的 `send` 标注放在返回类型之后，表示 callable value 本身的可发送性。

例如：

```chiba
def f(x: T): U send = ...
def g(x: T): U !send = ...

let h = (x: T): U send => ...
let k = (x: T): U !send => ...
```

这里的语义不是“调用该函数会发生 send effect”，而是“该 callable value 自身满足或不满足 send”。

### 2.4 名义类型定义

名义类型定义允许显式承诺或显式否定 `send`：

```chiba
data Packet send = ...
data LocalCell !send = ...
```

其含义是：

- `send`：该名义类型承诺自己满足 `send`
- `!send`：该名义类型显式声明自己不是 `send`

### 2.5 `!send` 不是单独关键字

词法层的保留字是 `send`。

`!send` 是类型语法中的否定形式，而不是新的独立关键字。

## 2. Surface Syntax

`send` and `!send` should be written as postfix qualifiers over complete type expressions, for example `((Msg) => Unit) send` or `((Msg) => Unit) !send`.

They may also appear inside generic constraints such as `[T: send]`, on function or closure signatures to describe the sendability of the callable value itself, and on nominal type declarations such as `data Packet send = ...` or `data LocalCell !send = ...`. The lexer only reserves `send`; `!send` is a negated type form, not an independent keyword.

## 3. 语义位置

`send` 检查的对象是值的可移动性与 world legality，而不是调用表达式本身。

因此，对 callable 的 `send` 检查不应染在普通 call-site 上，而应染在下面这些点：

- closure formation
- capture analysis
- world crossing API
- 存入要求 `send` 的类型位置
- 满足 `[T: send]` 之类的 builtin capability requirement

普通函数调用不会单独触发 `send` 检查。

## 3. Semantic Position

`send` checks apply to the mobility and world-legality of values, not to call expressions themselves.

For callables, checking should happen at closure formation, capture analysis, world-crossing APIs, writes into `send`-requiring storage positions, and satisfaction of builtin requirements such as `[T: send]`. Ordinary calls should not trigger independent `send` checks.

## 4. 默认判定

### 4.1 builtin value

内建标量值默认是 `send`。

### 4.2 结构值

tuple、record、ADT 等结构值默认按成员递归决定 `send`：

- 所有成员都是 `send`，则整体是 `send`
- 任一成员是 `!send`，则整体是 `!send`

`Array[T]` 是普通 immutable value，不带 safe internal mutability。它默认按元素类型递归决定 `send`：若 `T: send`，则 `Array[T]: send`；若 `T: !send`，则 `Array[T]: !send`。

### 4.3 `Ref[T]`

`Ref[T]` 默认是 `!send`。

`Ref[T]` 是单 world 的 safe aliasing / mutation 工具，不应默认跨 world 搬运。

顶层 `Ref[T]` 必须显式写 `#[world_local]`，表示每个 world 一份 cell；它仍然是 `!send`，不是 shared global mutable state。需要跨 world 共享的可变状态请使用 Atomic，或在 unsafe 边界中使用 `UnsafeRef[T]`。

因此：

- `Ref[Array[T]]` 是 `!send`
- `Array[Ref[T]]` 是 `!send`
- closure 捕获 `Ref[T]` 后默认 `!send`

`Ref[T]` 不能通过成员都是 `send` 来洗成 `send`。

### 4.4 Atomic

Atomic capability 默认是 `send`，但只允许通过 atomic API 发生内部可变性。

level-1 首发可采用很小的集合：

- `Atomic[i32]`
- `Atomic[i64]`
- `Atomic[usize]`
- `Atomic[bool]`
- `Atomic[Ptr[T]]`

Atomic API 首发暴露 ordering，集合接近 Rust：Relaxed / Acquire / Release / AcqRel / SeqCst。Ordering 是 atomic 操作参数，不属于 `send` 判定本身。

### 4.5 `Ptr[T]`

`Ptr[T]` 默认是 `send`。

`Ptr[T]` 的危险性由 `unsafe` 负责，而不是由 `send` 再次否决。

### 4.6 `UnsafeRef[T]`

`UnsafeRef[T]` 默认是 `send`。

`UnsafeRef[T]` 不是纯裸地址。

顶层 `UnsafeRef[T]` 会 lower 成 static mutable unsafe handle。它可以跨 world 可见，但语言不保证它的同步、可见性、ordering 或数据竞争安全；这些责任属于 unsafe 协议或库层封装。

它表示一种可跨 world 传递、可共享、且带保活语义的 unsafe handle。

对语言管理对象而言，`UnsafeRef[T]` 通常对应一次到 shared-owned representation 的提升；其典型实现可为 Arc-like RC box。

这种 shared-owned representation 只负责：

- 共享拥有
- 保活
- 跨 world 传递

它不自动负责：

- 并发同步
- 数据竞争避免
- 别名写入安全

这些责任由 `unsafe` 与用户侧协议承担。

### 4.7 continuation

continuation 默认是 `!send`。

continuation 天然携带 control boundary、answer type 与 arena legality，因此不应默认跨 world 传递。

### 4.8 closure 与顶层函数项

closure 是否为 `send` 取决于 capture 环境：

- 无 capture 的 closure 默认是 `send`
- 只要 capture 环境中存在 `!send` 成员，closure 就是 `!send`
- capture by move 不会把 `!send` 值洗白成 `send`

顶层 `def` 没有 closure environment，因此默认可视为 `send`。

## 4. Default Classification

Builtin scalar values are `send` by default. Tuples, records, ADTs, and immutable arrays are classified recursively from their members: all-`send` members make the whole value `send`, while any `!send` member makes the whole value `!send`.

`Array[T]` has no safe internal mutability in level-1, so `Array[T]` is `send` exactly when `T` is `send`. `Ref[T]` is `!send` by default because it is a single-world safe aliasing and mutation tool; therefore both `Ref[Array[T]]` and `Array[Ref[T]]` are `!send`. A top-level `Ref[T]` must be explicitly marked `#[world_local]`; it denotes one cell per world and remains `!send`. Cross-world shared mutable state should use Atomic, or `UnsafeRef[T]` at an unsafe boundary. Atomic capability types are `send`, but their mutation may only happen through atomic APIs; the first level-1 version may restrict `Atomic[T]` to scalar, boolean, usize, and pointer-like types and expose Rust-style ordering parameters. `Ptr[T]` is `send` by default because its danger belongs to `unsafe`, not to `send`. `UnsafeRef[T]` is also `send` by default because it models a cross-world unsafe handle with liveness semantics, similar to an Arc-like shared-owned box. Continuations are `!send` by default because they carry control boundaries, answer types, and arena legality. Closures depend on their capture environment: capture-free closures are `send`, but any captured `!send` member makes the closure `!send`; moving a captured value does not wash a `!send` value into `send`. A top-level `def` has no closure environment, so it is `send` by default.

## 5. 与函数检查的关系

`send` 是 callable value 的属性，不是函数 effect。

因此：

- `def f(...): R send` 描述的是 `f` 这个值可以跨 world 搬运
- 它不描述 `f(...)` 这个调用表达式会发生什么控制或副作用

这一区分必须保持清晰，否则 `send` 会与 future effect system、`reset` / `shift`、IO 语义混层。

## 5. Relation to Function Checking

`send` is a property of the callable value, not a function effect.

So `def f(...): R send` describes the mobility of the function value `f` itself, not the control behavior or side effects of `f(...)`. This distinction must stay sharp, otherwise `send` will get mixed together with a future effect system, `reset` and `shift`, or IO semantics.

## 6. 与泛型系统的关系

`[T: send]` 表示 `T` 必须满足 builtin capability `send`。

它不等价于：

- 普通 interface constraint
- named bundle obligation
- 可经由 `via` 选择实现来源的能力约束

因此，类型系统内部更接近：

```text
BuiltinReq(send, T)
```

而不是：

```text
Send@T
```

## 6. Relation to the Generic System

`[T: send]` means that `T` must satisfy the builtin capability `send`.

It is not equivalent to an ordinary interface constraint, a named bundle obligation, or a capability whose implementation source can be selected through `via`. Internally it should look more like `BuiltinReq(send, T)` than a named-interface predicate.

## 7. 与类型定义和存储位置的关系

`send` / `!send` 应允许出现在：

- callable storage type
- record / tuple / ADT 成员类型位置
- 名义类型定义头部

这样才能同时表达：

- 这个值位置要求可跨 world 传递
- 这个名义类型整体故意被锁成 `!send`

显式 `!send` 允许覆盖结构递归推导结果。

## 7. Relation to Type Definitions and Storage Positions

`send` and `!send` should be legal in callable storage types, record or tuple or ADT member positions, and the header of nominal type definitions.

That makes it possible to express both that a storage position requires cross-world mobility and that an entire nominal type is intentionally locked to `!send`. An explicit `!send` is allowed to override the result inferred from structural recursion.

## 8. 分层边界

本文先固定语义骨架，不要求 level-1 立即实现完整 `send` checker。

当前推荐分层是：

- level-1：固定 `send` 语法位置、默认判定、明显非法 world crossing / closure capture / storage 写入检查，以及 Atomic 基本能力
- level-2：不把 `send` 纳入 interface / `via` / method resolution 世界
- level-3：扩展更完整的 world crossing、closure capture、storage legality 染色检查

## 8. Layering Boundary

This document fixes the semantic skeleton first and does not require level-1 to implement a full `send` checker immediately.

The recommended layering is: level-1 fixes syntax positions, default classification, obvious illegal world-crossing / closure-capture / storage checks, and the minimal atomic capability; level-2 keeps `send` out of the interface, `via`, and method-resolution world; and level-3 extends the full coloring checks for world crossing, closure capture, and storage legality.

## 9. 非目标

下列内容不是本文当前目标：

- 把 `send` 做成普通 interface
- 用 `via` 为 `send` 选择实现来源
- 把 `send` 解释成函数调用 effect
- 在 level-1 中完成全部并发安全证明
- 让 `Array[T]` 获得 safe internal mutability
- 让 `Ref[T]` 通过结构递归推导成 `send`
- 为 Atomic 首发规定所有 target lowering 细节

## 9. Non-Goals

The current goal is not to model `send` as an ordinary interface, not to use `via` to choose an implementation source for `send`, not to reinterpret `send` as a function-call effect, not to give `Array[T]` safe internal mutability, not to make `Ref[T]` become `send` through structural recursion, not to specify every target-level atomic lowering detail in the first version, and not to finish a complete proof of concurrency safety inside level-1.

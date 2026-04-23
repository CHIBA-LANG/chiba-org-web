# Chiba Level 1 Type System Spec

## 0. 范围

这个文档规定 Chiba level-1 类型系统的总体边界、组成层次与实现约束。

本文首先固定下面几件事：

- level-1 到底要检查什么
- level-1 明确不做什么
- row / shape / method / operator / generics / continuation 之间如何分层
- level-2 将来新增的东西放在哪里，而不是提前混入 level-1

## 0. Scope

This document defines the overall boundary, internal layering, and implementation constraints of the Chiba level-1 type system.

It fixes four questions first: what level-1 must check, what level-1 deliberately does not check, how rows, shapes, methods, operators, generics, and continuations are layered, and where future level-2 features should live instead of being mixed into level-1 too early.

## 1. 设计要求

level-1 的类型系统需要同时满足下面要求：

- 保持较快的编译速度
- 保持局部、可缓存、可实例化的检查流程
- 支持 HM 风格的基本推断
- 支持 row polymorphism
- 支持 structural generics
- 支持 method、operator overloading、shape-based dispatch
- 支持 `reset` / `shift` 与 answer type checking
- 在 level-1 就区分值与引用

## 1. Design Requirements

The level-1 type system must remain fast, local, cacheable, and instantiable while supporting basic HM-style inference, row polymorphism, structural generics, methods, operator overloading, shape-based dispatch, `reset` and `shift` with answer type checking, and an explicit distinction between values and references.

## 2. Level-1 与 Level-2 的边界

### 2.1 Level-1

level-1 包含：

- HM 风格的一阶类型推断与 unify
- row polymorphism
- shape-based method resolution
- operator overloading
- structural generics
- instantiation-time checking
- `reset` / `shift` 的 answer type checking
- 值类型与引用类型的区分
- 与隐式 `reset` 对应的 escape / memory legality

### 2.2 Level-2

level-2 再新增：

- interface
- Go-like interface method set
- namespace 作为 implementation bundle
- `via ns.path` 作为显式实现来源选择
- `dyn Interface` 作为显式动态分发对象
- named capability constraints
- witness / dictionary / coherence 相关机制
- 更正式的 satisfaction / specialization 规则

### 2.3 明确边界

level-1 没有 interface。

这意味着 level-1 中 generic、method、operator、shape dispatch 都不能依赖命名能力系统，只能依赖：

- 普通类型推断
- row / shape 约束
- structural obligation
- concrete instantiation 下的最终检查

level-2 引入 interface 后，也不应把 named interface 直接压平为值类型自己的 row。

interface 约束应被看作独立于 value shape 的行为约束层。

## 2. Boundary Between Level-1 and Level-2

Level-1 includes first-order HM inference and unification, row polymorphism, shape-based method resolution, operator overloading, structural generics, instantiation-time checking, answer type checking for `reset` and `shift`, the distinction between value and reference types, and escape or memory legality tied to implicit `reset`.

Level-2 then adds interfaces, Go-like interface method sets, namespaces as implementation bundles, explicit `via ns.path` bundle selection, `dyn Interface`, named capability constraints, witness and dictionary and coherence machinery, and more formal satisfaction and specialization rules. Because level-1 has no interfaces, generics, methods, operators, and shape dispatch at level-1 cannot rely on any named capability system. They must rely on ordinary inference, row or shape constraints, structural obligations, and final checking under concrete instantiations. When interfaces appear in level-2, they must remain a separate behavioral-constraint layer instead of being flattened into value-shape rows.

## 3. Level-1 类型系统总览

level-1 的类型检查可以概括为：

`HM + row/shape + structural obligation + answer type checking + escape legality`

level-1 采用下面的总原则：

- 多态主要集中在值的 shape 上
- 不把 level-1 做成全局重型求解器
- continuation 相关检查必须保留局部性
- 不让 generic 和 continuation 的组合无限制扩张

与 level-2 的衔接原则是：

- value shape 继续由 row / shape 表示
- behavior selection 在 level-2 中通过 named implementation bundle 进入系统
- interface method 不直接覆盖 level-1 的 structural method world

## 3. Level-1 Type System at a Glance

The level-1 checker can be summarized as `HM + row/shape + structural obligation + answer type checking + escape legality`.

The governing principles are that polymorphism should concentrate on value shapes, level-1 should not become a heavy global solver, continuation checks must stay local, and the combination of generics and continuations must not expand without control. The bridge to level-2 is that value shape remains represented by rows and shapes, behavioral selection enters through named implementation bundles, and interface methods do not overwrite the structural method world of level-1.

## 4. 类型分类

### 4.1 值类型

值类型包括：

- builtin scalar
- tuple
- 普通 `data`
- record
- union value
- function / closure value

### 4.2 引用类型

引用类型包括：

- `Ptr[T]`
- `Ref[T]`
- `UnsafeRef[T]`

level-1 需要显式区分值类型与引用类型，因为下面几类规则都依赖这一点：

- arena / escape
- `send`
- continuation capture
- answer type legality

### 4.3 continuation / answer type

continuation 相关类型不应被简单视为普通值类型的一个平凡子类。

level-1 需要至少显式表达：

- continuation 所在的 `reset` 边界
- 当前上下文的 answer type
- continuation 捕获与恢复时的 answer type 一致性

## 4. Type Categories

Value types include builtin scalars, tuples, ordinary `data`, records, union values, and function or closure values. Reference types include `Ptr[T]`, `Ref[T]`, and `UnsafeRef[T]`.

Level-1 must distinguish value types from reference types explicitly because arena and escape rules, `send`, continuation capture, and answer-type legality all depend on that split. Continuation-related types should not be treated as a trivial subclass of ordinary values; level-1 must explicitly represent the `reset` boundary they belong to, the answer type of the current context, and answer-type consistency between capture and resume.

## 5. HM 基础层

level-1 的基础是一阶 HM 风格推断：

- 为表达式分配 fresh type variables
- 生成普通约束
- 对函数、tuple、ADT、record、named type 做 unify
- 做 let-generalization

但 level-1 不等于“只有 HM”。

HM 只是底座，上层还叠加：

- row / shape 约束
- method / operator obligation
- continuation / answer type 约束
- escape / memory legality

## 5. HM Foundation Layer

The base of level-1 is first-order HM-style inference: allocate fresh type variables, generate ordinary constraints, unify functions, tuples, ADTs, records, and named types, and perform let-generalization.

But level-1 is not "HM only". HM is just the foundation. Above it sit row and shape constraints, method and operator obligations, continuation and answer-type obligations, and escape or memory legality.

## 6. Row 与 Shape

### 6.1 Row polymorphism

level-1 支持 row polymorphism。

row 的职责是提供：

- open row / closed row
- 字段存在性约束
- 字段类型约束
- 规范化后的 shape 表示

### 6.2 语法方向

row 语法应尽量复用现有 record update / open record 的心智模型。

本文采用下面方向：

- value 层使用现有 `{base | field: value}`
- type 层尽量复用相同方向的表示

### 6.3 Row 的职责边界

row / shape 是 level-1 method、operator、dispatch 的表示层，而不是另一套独立的全局 subtype 系统。

这意味着：

- row 需要 canonical representation
- row 需要支持快速比较与缓存
- row 不应被设计成任意位置自动 subsumption 的全局 lattice

## 6. Rows and Shapes

Level-1 supports row polymorphism. Rows provide open and closed rows, field-presence constraints, field-type constraints, and normalized shape representations.

The syntax direction should stay aligned with existing record-update intuition, using forms like `{base | field: value}` at the value layer and a corresponding direction at the type layer. Rows and shapes are the representation layer for methods, operators, and dispatch, not a second global subtype system. That is why rows must be canonical, fast to compare and cache, and must avoid turning into a global lattice with automatic subsumption at arbitrary positions.

## 7. Method、Operator 与 Shape Dispatch

level-1 明确包含：

- method
- operator overloading
- shape-based dispatch
- structural generics

因此，level-1 不是纯 HM 系统。

这些能力建立在 shape obligation 上，而不是 interface 上。

### 7.1 方法解析

level-1 的 method resolution 基于 receiver shape。

其核心不是“证明 `T : X`”，而是：

- 当前 receiver 的 normalized shape 是什么
- 当前 concrete instantiation 下可用哪些候选
- 哪个候选最具体且不冲突

### 7.2 运算符重载

operator overloading 也属于 structural obligation 的一部分。

它不应要求 level-1 提前拥有 interface witness 系统。

### 7.3 Shape dispatch

shape dispatch 是 level-1 的已有目标，因此类型系统必须支持：

- 对 concrete shape 的快速筛选
- 对候选方法/操作的懒解析
- 对解析结果的缓存

## 7. Methods, Operators, and Shape Dispatch

Level-1 explicitly includes methods, operator overloading, shape-based dispatch, and structural generics, so it is not a pure HM system. These features are built on shape obligations rather than interfaces.

Method resolution is driven by the receiver shape, the candidates available under a concrete instantiation, and the choice of the most specific non-conflicting candidate rather than by proving `T : X`. Operator overloading is another part of the same structural-obligation world. Shape dispatch requires fast filtering on concrete shapes, lazy candidate resolution, and caching of resolved results.

## 8. Generics

### 8.1 总体方向

为了兼顾编译速度，level-1 的 generics 更接近“typed structural templates”，而不是 Rust 风格的重型约束系统。

它不是老式 C++ template 的完全未类型化模式，但它也不是全局 trait solver。

### 8.2 定义期

generic body 在定义期仍然必须经过基本类型检查。

定义期至少要完成：

- 普通 HM 推断
- row / shape 约束生成
- method / operator obligation 生成
- `reset` / `shift` 的 answer type 检查
- 基本 well-formedness 检查

### 8.3 实例化期

具体实例化发生时，再去完成：

- concrete shape 下的方法解析
- concrete shape 下的 operator resolution
- shaped dispatch 的最终选择
- structural obligation 的兑现

### 8.4 设计原则

level-1 generics 的目标是：

- 不走 Rust 式全局求解
- 不退化成完全晚绑定的旧式模板系统
- 只为真正发生的实例化付费
- 让缓存 key 尽量由 normalized shape 与 concrete type 构成

## 8.5 Level-2 Interface 约束的进入方式

当 level-2 引入：

```chiba
[T: Show]
```

时，约束不应直接翻译成 `T` 的值 row。

正确方向是把它 elaboration 为局部的 named bundle obligation，例如：

```text
Show@T
Show@T via pretty.debug
```

该 obligation 在局部环境中提供 receiver-oriented method assumptions，但仍保留：

- interface identity
- receiver type
- implementation bundle source

这种做法的目标是同时满足：

- local HM 仍保持局部
- `via` 语义不丢失
- monomorphization 可以把 bundle source 放入实例 key
- specialization 后可直接 inline 具体实现

## 8.6 Structural 与 Interface 的优先级

当 level-2 interface 进入系统后，默认调用优先级应为：

1. 显式 `via ns.path`
2. 显式 `Interface.method(x)`
3. 普通 `x.m()` 时的 structural method
4. 其余 interface-derived method candidates

## 8. Generics

To stay fast, level-1 generics should behave more like typed structural templates than like Rust-style heavy constraint systems or completely unchecked old C++ templates.

At definition time, generic bodies must still pass basic type checking: HM inference, row and shape constraint generation, method and operator obligations, answer-type checking for `reset` and `shift`, and basic well-formedness. At instantiation time, the compiler then completes method resolution, operator resolution, shaped dispatch, and structural-obligation discharge under concrete shapes. If level-2 later introduces interface constraints such as `[T: Show]`, they should elaborate into local named bundle obligations like `Show@T` or `Show@T via pretty.debug`, keeping interface identity, receiver type, and implementation-bundle source intact. The default priority when interfaces exist should remain: explicit `via ns.path`, explicit `Interface.method(x)`, structural `x.m()`, and only then other interface-derived candidates.

也就是说，在没有显式 qualify 的情况下，structural method 优先于 interface-derived method。

## 9. Continuation 与 Answer Type

### 9.1 为什么必须进入 level-1

因为 level-1 已经支持 `reset` / `shift`，所以 answer type checking 不能被推迟到 level-2。

### 9.2 Level-1 的最小要求

level-1 至少需要：

- `reset` / `shift` 的 typing rule
- 当前 `reset` 的 answer type
- continuation 捕获与恢复时的 answer type 一致性

### 9.3 明确不做什么

level-1 只做 answer type checking，不做 answer type polymorphism。

原因不是 continuation 不重要，而是 continuation 已经会和下面这些机制发生高耦合：

- structural generics
- method / operator resolution
- shape dispatch
- arena / escape
- 值 / 引用区分

如果再把 answer type 本身做成 polymorphic，类型检查的局部性会明显变差。

## 9. Continuations and Answer Types

Because level-1 already supports `reset` and `shift`, answer type checking must already live in level-1.

At minimum, level-1 needs typing rules for `reset` and `shift`, a notion of the current `reset` answer type, and answer-type consistency across continuation capture and resume. What it deliberately does not do is answer type polymorphism, because continuations are already strongly coupled with structural generics, method and operator resolution, shape dispatch, arena and escape rules, and the value-versus-reference split. Making answer types polymorphic at the same time would seriously weaken locality.

## 10. Generic × Continuation

这是 level-1 的高风险区。

原则上需要单独规则，而不能把 continuation 当成普通值一样自由泛化。

当前方向：

- 含 continuation 的表达式泛化要保守
- generic 中允许出现 continuation，但其推断与实例化规则要更严格
- continuation 默认与当前 `reset` / arena 边界强绑定

## 10. Generic × Continuation

This is a high-risk area in level-1 and needs its own rules. Continuations should not be generalized as freely as ordinary values.

The current direction is conservative: expressions containing continuations should generalize carefully, generics may mention continuations but must use stricter inference and instantiation rules, and continuations stay tightly bound to the current `reset` and arena boundary by default.

## 11. 内存、隐式 Reset 与逃逸

level-1 的类型系统不只是 shape 与 generics，还必须对隐式 `reset` 的内存边界负责。

至少要明确：

- 普通函数调用蕴含隐式 `reset`
- closure 调用蕴含隐式 `reset`
- `return` 是 escape 点
- closure capture 是 escape 点
- `send` 是 escape 点
- continuation capture 与 arena 边界的关系

这套规则与 `Ref[T]`、`Ptr[T]`、`UnsafeRef[T]` 的合法性直接相关。

## 11. Memory, Implicit Reset, and Escape

The level-1 type system is not only about shapes and generics. It must also be responsible for the memory boundaries implied by implicit `reset`.

At minimum it must make clear that ordinary function calls imply implicit `reset`, closure calls imply implicit `reset`, `return` is an escape point, closure capture is an escape point, `send` is an escape point, and continuation capture interacts directly with arena boundaries. These rules are tightly coupled to the legality of `Ref[T]`, `Ptr[T]`, and `UnsafeRef[T]`.

## 12. 实现约束

为了保证编译速度，level-1 的实现需要遵守下面几条约束：

- row / shape 表示必须 canonical
- method / operator / dispatch 需要懒解析与缓存
- generic obligation 只在实际实例化点兑现
- 不引入 level-2 的 interface solver
- 不引入 answer type polymorphism

## 12. Implementation Constraints

To preserve compile speed, the implementation must keep row and shape representations canonical, make method and operator and dispatch resolution lazy and cacheable, discharge generic obligations only at actual instantiation points, avoid any level-2 interface solver, and avoid answer type polymorphism.

## 13. 暂定非目标

下列内容不属于当前 level-1 首批目标：

- interface
- witness / dictionary passing 的正式化
- coherence 的完整规则
- answer type polymorphism
- continuation 的高度自由泛化
- Rust 风格的重型全局约束求解

## 13. Provisional Non-Goals

The first generation of level-1 is not trying to include interfaces, formally specify witness or dictionary passing, complete coherence rules, answer type polymorphism, highly free continuation generalization, or Rust-style heavy global constraint solving.

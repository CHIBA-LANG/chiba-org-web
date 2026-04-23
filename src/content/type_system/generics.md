# Chiba Level 1 Generics Spec

## 0. 范围

本文规定 Chiba level-1 generics 的检查边界、实例化策略与编译速度约束。

本文只讨论 level-1。

level-1 没有 interface，因此本文中的 generics 不依赖 `[T: X]` 之类的命名能力约束。

## 0. Scope

This document defines the checking boundary, instantiation strategy, and compile-time constraints for Chiba level-1 generics.

It only discusses level-1.

Because level-1 has no interface system, generics here do not depend on named capability constraints such as `[T: X]`.

## 1. 总体方向

为了兼顾：

- row polymorphism
- structural generics
- method
- operator overloading
- shape-based dispatch
- 编译速度

level-1 generics 更接近“typed structural templates”。

这意味着：

- 它不是完全未类型化的旧式模板系统
- 它也不是 Rust 风格的重型全局约束求解系统
- 它需要在定义期做一轮真实的类型检查
- 它需要在实例化期兑现 concrete shape 相关的 structural obligation

## 1. Overall Direction

To balance row polymorphism, structural generics, methods, operator overloading, shape-based dispatch, and compile speed, level-1 generics should behave more like typed structural templates.

That means they are neither fully untyped old-style templates nor Rust-style heavy global constraint solvers. They must be checked once at definition time and must discharge concrete shape obligations during instantiation.

## 2. Level-1 Generic 的边界

level-1 generic 可以依赖：

- 普通 HM 推断
- row / shape 约束
- structural method obligation
- operator obligation
- shaped dispatch obligation
- answer type checking

level-1 generic 不能依赖：

- interface
- witness search
- named capability solver
- coherence 的完整规则

但 level-2 若引入 interface constraints，则应继续沿用 local HM 路线：

- 不做全局 trait solver
- 不把 interface constraint 直接压平成 plain row
- 而是将其 elaboration 为局部 named bundle obligation

## 2. Boundaries of Level-1 Generics

Level-1 generics may depend on ordinary HM inference, row and shape constraints, structural method obligations, operator obligations, shaped dispatch obligations, and answer type checking.

They may not depend on interfaces, witness search, named capability solvers, or full coherence rules. If level-2 later introduces interface constraints, the correct direction is still local HM: no global trait solver, no flattening of interface constraints into plain rows, and instead elaboration into local named bundle obligations.

## 3. 定义期检查

generic body 在定义期不是黑盒。

定义期至少需要完成：

- 为参数与局部表达式分配 type variable
- 普通 HM unify
- row / shape 约束生成
- method / operator obligation 生成
- `reset` / `shift` 的 answer type 检查
- 基本 well-formedness 检查

也就是说，generic body 必须先在当前抽象参数下可类型化。

## 3. Definition-Time Checking

The generic body is not a black box at definition time. The compiler must still allocate type variables, run ordinary HM unification, generate row and shape constraints, produce method and operator obligations, check `reset` and `shift`, and validate basic well-formedness.

In short, a generic body must already be typeable under abstract parameters before any concrete instantiation exists.

## 4. 实例化期检查

当 generic 被具体实例化时，再兑现定义期积累的 structural obligation。

实例化期至少要完成：

- concrete shape 下的字段约束校验
- concrete shape 下的方法解析
- concrete shape 下的 operator resolution
- shaped dispatch 的候选筛选与最终选择

如果某个 obligation 无法在当前实例上成立，则必须在实例化点报错。

## 4. Instantiation-Time Checking

When a generic is instantiated with concrete arguments, the compiler must discharge the structural obligations accumulated at definition time.

This includes field constraints, method resolution, operator resolution, and the final selection for shaped dispatch under the concrete shape. If any obligation fails, the error must be reported at the instantiation site.

## 5. Structural Obligations

level-1 generic 的核心不是 interface obligation，而是 structural obligation。

这类 obligation 可以来自：

- `v.x`
- `v.m(...)`
- `a + b`
- shape-based dispatch

例如：

```chiba
def get_x(v) = v.x
```

定义期产生的不是 “`typeof(v) : HasX`”，而是类似：

```text
typeof(v) unifies with {r | x: a}
```

再例如：

```chiba
def call_len(v) = v.len()
```

其约束不是 interface witness，而是：

- 当前 receiver shape 上必须可 resolve `len`
- 该 resolve 在具体实例化点必须成功且不歧义

这也意味着：

- level-1 中的 structural obligation 与 level-2 中的 named interface obligation 不是同一种东西
- 二者可以在实例化期汇合，但不应在定义期被抹平成同一类 row 事实

## 5. Structural Obligations

The core of a level-1 generic is not an interface obligation but a structural obligation. These obligations arise from field access, method calls, operators, and shape-based dispatch.

For example, `v.x` should produce a row-style constraint such as `typeof(v) unifies with {r | x: a}`, and `v.len()` should require that `len` resolves on the receiver shape at the concrete instantiation point. Structural obligations in level-1 and named interface obligations in level-2 are related, but they are not the same thing and should not be flattened into identical row facts during definition-time checking.

## 6. 与 Method / Operator / Dispatch 的关系

由于 level-1 明确有 method、operator overloading、shape-based dispatch，generic 本体会天然积累 shape-dependent obligation。

因此，generic 的设计必须接受下面事实：

- 并非所有决议都能在定义期完成
- 实例化期必须参与最终确认
- 缓存必须足够强，否则编译速度会被实例化点拖垮

## 6. Relation to Methods, Operators, and Dispatch

Because level-1 explicitly supports methods, operator overloading, and shape-based dispatch, generic bodies naturally accumulate shape-dependent obligations.

That means not every decision can be completed at definition time. Instantiation must participate in the final confirmation, and caching has to be strong enough to keep compile time under control.

## 7. 与 Row Polymorphism 的关系

row 是 generic structural checking 的底层表示。

定义期的很多 generic 约束，最后会归结为：

- open row unify
- field existence constraint
- normalized shape compare

因此，generic 的实现必须建立在 canonical row / shape 表示之上。

## 7. Relation to Row Polymorphism

Row and shape representations are the substrate of structural generic checking. Many generic constraints reduce to open-row unification, field-existence checks, and normalized shape comparison.

For that reason, the implementation of generics must be built on canonical row and shape representations.

## 8. 与 Continuation 的关系

generic 与 continuation 的组合属于 level-1 的高风险区。

当前建议：

- 含 continuation 的表达式泛化要保守
- continuation 默认不应被当作可任意自由泛化的普通值
- continuation 相关 generic 规则要比普通 shape generic 更严格

原因不是 continuation 不重要，而是它会同时耦合：

- answer type
- arena / escape
- 值 / 引用边界
- shaped dispatch

## 8. Relation to Continuations

The combination of generics and continuations is a high-risk area in level-1.

The current direction is conservative: expressions involving continuations should generalize more carefully, continuations should not be treated like ordinary freely polymorphic values, and continuation-related generic rules should be stricter than ordinary shape-generic rules because they couple answer types, arena and escape legality, value versus reference boundaries, and shaped dispatch.

## 9. 编译速度约束

为了保证编译速度，level-1 generics 的实现需要满足：

- 只为真正发生的实例化付费
- 尽量复用 normalized shape 作为实例化 key 的一部分
- 结构性 obligation 尽量局部兑现
- 不引入重型全局 solver

因此本文采用：

- 轻量定义期检查
- 懒实例化
- 缓存 concrete shape 上的解析结果

## 9. Compile-Time Constraints

To preserve compile speed, level-1 generics must only pay for real instantiations, should reuse normalized shapes as part of instantiation keys, should discharge structural obligations locally whenever possible, and must avoid heavy global solvers.

The practical consequence is light definition-time checking, lazy instantiation, and caching of resolution results on concrete shapes.

## 10. 实例化模型

本文采用如下模型：

- generic 本体先被类型化
- obligation 被挂在 generic body 上
- 实例化时收集 concrete type / concrete shape
- method/operator/dispatch 在具体实例下最终确认
- specialization 结果可缓存

若 level-2 引入 named interface constraint，则实例化模型进一步扩展为：

- local named bundle obligation 在实例化点绑定到具体 implementation bundle
- `via ns.path` 可直接固定 bundle source
- bundle source 可进入 monomorphization key
- specialization 后允许直接 inline 对应实现

这里是否最终走 monomorphization、部分共享代码、或混合策略，可在后续单独细化。

## 10. Instantiation Model

The model assumed here is: first type the generic body, then attach obligations to that body, then collect concrete types and shapes at instantiation time, and finally confirm method, operator, and dispatch behavior under those concrete arguments.

If level-2 later introduces named interface constraints, the model extends by binding local named bundle obligations to concrete implementation bundles. `via ns.path` can fix the bundle source directly, that source can enter the monomorphization key, and specialization may inline the resolved implementation.

## 11. 非目标

下列内容不是当前 level-1 generics 的首批目标：

- interface constraints
- witness passing formalization
- Rust 风格 trait solver
- C++ 老模板式的“定义期几乎不检查”
- continuation 的高度自由多态

## 11. Non-Goals

The first generation of level-1 generics is not trying to support interface constraints, witness passing formalization, Rust-style trait solving, the old C++ template model where definition-time checking is nearly absent, or highly free continuation polymorphism.

## 12. 开放问题

- 实例化 key 是否直接使用 normalized shape + concrete type tuple
- named bundle source 是否总是进入实例化 key，还是仅在多 bundle 可见时进入
- 方法解析缓存与 generic specialization 缓存是否合并
- 某些完全结构相同但名义类型不同的实例是否共享生成代码
- generic × continuation 最终采用多严格的泛化限制

## 12. Open Questions

- Should the instantiation key directly use `normalized shape + concrete type tuple`?
- Should the named bundle source always enter the instantiation key, or only when multiple bundles are visible?
- Should method-resolution caches and generic-specialization caches be unified?
- Can two instances with the same structure but different nominal identities share generated code?
- How strict should the final generalization limits be for `generic × continuation`?

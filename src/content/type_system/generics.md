# Chiba Level 1 Generics Spec

## 0. 范围

本文规定 Chiba level-1 generics 的检查边界、实例化策略与编译速度约束。

本文只讨论 level-1。

level-1 没有传统 interface / trait solver。

本文中的 generics 采用统一约束形式：

- N 个 namespace-scoped named constraints
- 最多 1 个 row constraint

## 0. Scope

This document defines the checking boundary, instantiation strategy, and compile-time constraints for Chiba level-1 generics.

It only discusses level-1.

Because level-1 has no traditional interface system, generics here use a unified constrained-template form: N namespace-scoped named constraints plus at most one row constraint.

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
- namespace-scoped named constraints
- structural method obligation
- operator obligation
- shaped dispatch obligation
- answer type checking

level-1 generic 不能依赖：

- 传统 interface witness search
- 全局 named capability solver
- coherence 的完整规则

named constraint 只负责命名与复用，不引入全局 evidence search。

当 generic 参数或返回值进入 `dyn` 世界时，所需 adapter 必须在实例化点被构造并打包，而不是留给运行时再做 impl 搜索。

## 2. Boundaries of Level-1 Generics

Level-1 generics may depend on ordinary HM inference, row and shape constraints, namespace-scoped named constraints, structural method obligations, operator obligations, shaped dispatch obligations, and answer type checking.

They may not depend on a traditional interface solver, witness search, a global named-capability solver, or full coherence rules. Named constraints are for naming and reuse only; they do not introduce global evidence search. When generic values cross into the `dyn` world, the required adapters must be constructed at the instantiation site rather than searched for at runtime.

## 2.1 约束形式

Chiba 不使用 `where` 子句。

generic constraint 统一写在：

```chiba
[T: X + Y + {r | name: String}]
```

规则固定为：

- N 个 named constraints
- 最多 1 个 row constraint

named constraint 负责复用与错误信息；row constraint 负责直接表达 shape obligation。

## 2.1 Constraint Form

Chiba does not use `where` clauses.

Generic constraints are written in one place:

```chiba
[T: X + Y + {r | name: String}]
```

The rule is fixed as: N named constraints plus at most one row constraint. Named constraints serve reuse and diagnostics; the row constraint carries the direct shape obligation.

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

普通非 `extern` 函数也可以由省略参数类型触发隐式 generic。

```chiba
def f(a, b, c) = expr
```

检查器为未标注参数与未标注返回值建立 fresh inference variable，并用函数体的使用点收集约束。具体类型需求直接 unify；字段访问、method call、operator、shape dispatch 等需求生成 structural obligation。如果函数边界仍有未具体化的自由变量，这些变量与其 obligation 会被自动提升为隐式 generic 参数。

显式 generic header 仍然优先；源码写出的 `[T: ...]` 是稳定的用户可见类型参数。隐式参数是检查器生成的 synthetic 参数，主要用于解释与后端 specialization。编译器不能因为函数实际是 generic 就要求用户给普通参数补类型标注；只有 inference 与 obligation 收集失败时才需要标注。

`extern` 声明是例外：ABI 边界上的参数与返回值必须有显式 ABI 类型，不能靠隐式泛化推断。

参数上的 row 约束可以直接写成 row-bound shorthand：

```chiba
def f(a: {r | name: Str}) = a.name
```

它等价于：

```chiba
def f[T: {r | name: Str}](a: T) = a.name
```

这个简写引入 fresh synthetic generic 参数。row 约束只描述 shape obligation，不抹掉 concrete nominal identity。

## 3. Definition-Time Checking

The generic body is not a black box at definition time. The compiler must still allocate type variables, run ordinary HM unification, generate row and shape constraints, produce method and operator obligations, check `reset` and `shift`, and validate basic well-formedness.

In short, a generic body must already be typeable under abstract parameters before any concrete instantiation exists.

Ordinary non-`extern` functions may also become implicitly generic by omitting parameter annotations. For `def f(a, b, c) = expr`, the checker creates fresh inference variables for unannotated parameters and the unannotated return, then collects constraints from the body. Concrete requirements unify directly; field access, method calls, operators, and shape dispatch produce structural obligations. Free variables that remain at the function boundary are promoted, together with their obligations, into implicit generic parameters.

Explicit generic headers still take precedence and remain stable user-visible type parameters. Implicit parameters are synthetic checker-generated parameters used for explanation and backend specialization. The compiler must not require ordinary parameter annotations merely because the inferred function is generic; annotations are only required when inference or obligation collection cannot determine the intended boundary.

`extern` declarations are the exception: ABI parameters and returns must use explicit ABI types and cannot rely on implicit generalization.

A row constraint on a parameter may be written as row-bound shorthand. For example, `def f(a: {r | name: Str}) = a.name` is equivalent to `def f[T: {r | name: Str}](a: T) = a.name`. The shorthand introduces a fresh synthetic generic parameter; the row bound describes a shape obligation without erasing concrete nominal identity.

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

level-1 generic 的核心不是 interface obligation，而是 structural obligation 加 named shape contract。

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

The core of a level-1 generic is not an interface obligation but a structural obligation plus named shape contracts. These obligations arise from field access, method calls, operators, and shape-based dispatch.

For example, `v.x` should produce a row-style constraint such as `typeof(v) unifies with {r | x: a}`, and `v.len()` should require that `len` resolves on the receiver shape at the concrete instantiation point. Named constraints may package these requirements under stable names, but they are still discharged locally rather than by global witness search.

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

若 level-2 引入 `via namespace`，则实例化模型进一步扩展为：

- 行为来源在调用点显式给出
- 该来源可进入 monomorphization key
- specialization 后允许直接 inline 对应实现

这里是否最终走 monomorphization、部分共享代码、或混合策略，可在后续单独细化。

## 10. Instantiation Model

The model assumed here is: first type the generic body, then attach obligations to that body, then collect concrete types and shapes at instantiation time, and finally confirm method, operator, and dispatch behavior under those concrete arguments.

If level-2 later introduces `via namespace`, the model extends by treating the explicit behavior source as part of the instantiation context. That source may enter the monomorphization key, and specialization may inline the resolved implementation.

## 11. 非目标

下列内容不是当前 level-1 generics 的首批目标：

- traditional interface constraints
- witness passing formalization
- Rust 风格 trait solver
- C++ 老模板式的“定义期几乎不检查”
- continuation 的高度自由多态

## 11. Non-Goals

The first generation of level-1 generics is not trying to support a traditional interface solver, witness passing formalization, Rust-style trait solving, the old C++ template model where definition-time checking is nearly absent, or highly free continuation polymorphism.

## 12. 开放问题

- 实例化 key 是否直接使用 normalized shape + concrete type tuple
- `via` 来源是否总是进入实例化 key，还是仅在显式使用时进入
- 方法解析缓存与 generic specialization 缓存是否合并
- 某些完全结构相同但名义类型不同的实例是否共享生成代码
- generic × continuation 最终采用多严格的泛化限制

## 12. Open Questions

- Should the instantiation key directly use `normalized shape + concrete type tuple`?
- Should an explicit `via` source always enter the instantiation key, or only when used at the call site?
- Should method-resolution caches and generic-specialization caches be unified?
- Can two instances with the same structure but different nominal identities share generated code?
- How strict should the final generalization limits be for `generic × continuation`?

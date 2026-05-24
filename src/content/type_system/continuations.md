# Chiba Level 1 Continuations Spec

## 0. 范围

本文规定 Chiba level-1 中 `reset` / `shift`、continuation、answer type checking 的最小语义边界。

本文只讨论 level-1。

本文明确：

- level-1 必须进行 answer type checking
- level-1 不引入 answer type polymorphism
- continuation 在类型与运行时语义上都不等同于普通 closure

## 0. Scope

This document defines the minimum semantic boundary for `reset`, `shift`, continuations, and answer type checking in Chiba level-1.

It only discusses level-1. In particular, level-1 must perform answer type checking, must not introduce answer type polymorphism, and must not treat continuations as ordinary closures at either the type or runtime level.

## 1. 基本规则

因为 level-1 已经包含 `reset` / `shift`，所以 continuation 相关检查必须在 level-1 解决，而不是推迟到 level-2。

level-1 至少要求：

- `reset` / `shift` 的 typing rule
- continuation 捕获时的上下文约束
- answer type checking
- continuation 与 arena / escape 边界的关系

此外，continuation 默认属于受限控制能力，而不是可自由发送的普通值。它可以参与 callable 泛化与显式存储规则，但必须保留 continuation kind、answer type、usage 与边界信息，不能被洗成普通 closure。

## 1. Basic Rules

Because level-1 already contains `reset` and `shift`, continuation-related checking must also be solved at level-1 rather than postponed to level-2.

At minimum, level-1 needs typing rules for `reset` and `shift`, context constraints for capturing continuations, answer type checking, and rules describing how continuations interact with arena and escape boundaries. Continuations should be treated as restricted control capabilities, not as ordinary closures. They may participate in callable generalization and explicit storage rules, but their continuation kind, answer type, usage, and boundary information must remain visible to the checker and lowering pipeline.

## 2. Answer Type

在普通表达式检查中，只问“这个表达式的值类型是什么”是不够的。

对于 `reset` / `shift`，还必须问：

- 当前控制片段最终回答成什么类型

本文把这个类型称为 answer type。

每个 `reset` 都引入自己的局部 answer type，并要求与之相关的 `shift`、continuation 恢复、离开路径在同一 answer type 下成立。

## 2. Answer Types

For ordinary expressions it is not enough to ask only for the value type. With `reset` and `shift`, the checker must also ask what type the current control fragment ultimately answers with.

This is the answer type. Every `reset` introduces its own local answer type, and all related `shift` bodies, continuation resumes, and exit paths must agree on that same answer type.

## 3. `reset` 的角色

`reset` 建立一个控制边界。

在类型层面，它至少引入：

- 一个局部 answer type
- 一个可被 `shift` 捕获的 continuation 边界

在内存层面，它也天然对应一个 arena / region 边界。

因此，`reset` 同时是：

- 控制边界
- answer type 边界
- arena / region 边界

## 3. The Role of `reset`

`reset` establishes a control boundary. On the type side it introduces at least a local answer type and a continuation boundary that `shift` may capture. On the memory side it also corresponds naturally to an arena or region boundary.

So a `reset` is simultaneously a control boundary, an answer-type boundary, and an arena or region boundary.

## 4. `shift` 的角色

`shift` 从最近的 `reset` 中捕获 continuation。

这里的 continuation 不是一个普通函数值的平凡别名，因为它天然携带：

- 当前 answer type
- 当前控制边界
- 与当前 `reset` 相关的上下文信息

因此 continuation 只能在与其来源边界兼容的上下文中恢复。

## 4. The Role of `shift`

`shift` captures a continuation from the nearest surrounding `reset`.

That continuation is not a trivial alias for an ordinary function value because it carries the current answer type, the current control boundary, and context tied to its source `reset`. As a result, a continuation may only be resumed in contexts compatible with its origin boundary.

## 5. 最小 Typing 要求

本文暂不写完整形式化推导规则，但 level-1 至少要满足下面的 typing 直觉：

- 若某个洞位期望值类型 `A`
- 当前 `reset` 的 answer type 为 `R`
- 则被捕获 continuation 的直觉类型接近 `(A) => R`

同时，`shift` 的 body 也必须在同一个 `R` 下被检查。

这里的 `(A) => R` 只表达最小直觉，不表示 continuation 与普通 closure 在实现或合法性上完全同构。

## 5. Minimal Typing Requirements

The document does not yet spell out a complete formal typing derivation, but the level-1 intuition is clear: if a hole expects a value of type `A` and the current `reset` has answer type `R`, then the captured continuation behaves roughly like `(A) => R`.

The body of `shift` must also be checked under that same `R`. This notation expresses the minimum intuition only; it does not mean continuations are identical to ordinary closures in implementation or legality.

## 6. Answer Type Checking

level-1 必须保证：

- 同一个 `reset` 内的 continuation 恢复与离开遵守同一 answer type
- `shift` body 与 surrounding `reset` 的 answer type 一致
- 不能在 answer type 不一致的上下文中恢复 continuation

这些都是 level-1 的硬规则，而不是优化建议。

## 6. Answer Type Checking

Level-1 must guarantee that continuation resumes and exits inside the same `reset` obey a single answer type, that the body of `shift` is consistent with the surrounding `reset`, and that continuations are never resumed in contexts with mismatched answer types.

These are hard semantic rules for level-1, not optional optimizations.

## 7. Answer Type Polymorphism 不进入 Level-1

level-1 不做 answer type polymorphism。

原因包括：

- continuation 已经与 generics 强耦合
- continuation 已经与 method / operator / shape dispatch 间接耦合
- continuation 已经与 arena / escape / `Ref` 边界耦合
- 若再引入 answer-type poly，局部类型检查会明显退化

因此，当前方向是：

- 每个 `reset` 在单一 answer type 下检查
- continuation 恢复要求 answer type 一致
- 同一个 continuation 不在 level-1 中被设计成可跨不同 answer type 自由复用

## 7. Why Answer Type Polymorphism Stays Out of Level-1

Level-1 deliberately excludes answer type polymorphism.

The reason is not that continuations are unimportant, but that continuations are already strongly coupled with generics, method and operator resolution, shape dispatch, arena and escape rules, and the value-versus-reference distinction. If answer types also become polymorphic, the locality of type checking degrades too much. The intended direction is one answer type per `reset`, with resumptions that must remain consistent under that answer type.

## 8. 与值 / 引用区分的关系

level-1 需要区分值类型与引用类型。

continuation 不应被简单地看作“又一个普通值类型”。

更准确地说，continuation 应被视为一种特殊 callable kind：

- 它在签名层可表现为箭头类型
- 但在恢复语义、answer type、arena legality 上不同于普通 closure

至少在规则上，它需要被单独看待，因为它会影响：

- escape legality
- `send`
- arena 边界
- generic 泛化限制

## 8. Relation to Value and Reference Distinctions

Level-1 has to distinguish value types from reference types, and continuations should not be treated as just another ordinary value type.

It is more accurate to view a continuation as a special callable kind: it can look like an arrow type at the signature layer, but its resume behavior, answer-type discipline, and arena legality differ from those of normal closures. This distinction matters for escape legality, `send`, arena boundaries, and generic generalization limits.

## 9. 与隐式 `reset` 的关系

普通函数调用与 closure 调用都蕴含隐式 `reset`。

因此 continuation 不只出现在显式控制原语附近，它还和默认的调用边界发生关系。

这意味着至少需要回答：

- continuation 是否允许跨越 callee 局部 arena
- continuation 是否允许被返回
- continuation 是否允许被 closure capture
- continuation 是否允许跨 world 发送

当前方向应保持保守。

因此，普通函数与 closure 的隐式 `reset` 语义会直接影响 continuation 的合法捕获与恢复范围。

## 9. Relation to Implicit `reset`

Ordinary function calls and closure calls both imply an implicit `reset`, which means continuations are not only a concern near explicit control operators but also at default call boundaries.

The checker therefore needs to answer whether a continuation may cross a callee-local arena, be returned, be captured by a closure, or be sent across worlds. The current direction should stay conservative, and the implicit-`reset` semantics of functions and closures directly determine the legal capture and resume range of continuations.

## 10. Generic × Continuation

generic 与 continuation 的组合属于高风险区。

level-1 当前规则方向是：

- 含 continuation 的表达式泛化应比普通表达式更保守
- generic continuation 不应默认享有普通值那样的自由多态
- continuation 相关 obligation 不能只看 shape，还要看 control context

这意味着 continuation 相关 generic 规则不应仅被视为普通 shape-based generic 的特例。

## 10. Generic × Continuation

The interaction between generics and continuations is a high-risk area.

The intended level-1 rule is to be more conservative than ordinary expressions: continuation-bearing expressions should generalize less freely, generic continuations should not inherit the full polymorphic freedom of ordinary values, and continuation obligations should be checked against control context rather than shape alone.

## 11. `send` 与 world 边界

延续当前整体路线，continuation 默认应视为高度受限的控制能力。

因此本文倾向于：

- continuation 默认 `!send`
- continuation 不应跨不合法 world 边界传递
- continuation 不应在 level-1 中被设计成任意可移动的普通值

未来若出现例外，也应当以显式规则引入，而不是作为默认语义。

## 11. `send` and World Boundaries

Continuations should be treated as highly restricted control capabilities under the current design.

That is why this document leans toward making continuations `!send` by default, forbidding them from crossing illegal world boundaries, and refusing to model them as ordinary freely movable values in level-1. Any exception should be introduced by explicit rules rather than by default behavior.

## 12. 编译速度约束

为了避免 continuation 规则把 level-1 拖成重型求解器，实现上应坚持：

- answer type 检查保持局部
- 不引入 answer type polymorphism
- generic × continuation 的规则保持保守
- 不要求全局 continuation capability solver

此外，continuation 的 specialization 或 callable lowering 不应破坏上面的局部检查性质。

## 12. Compile-Time Constraints

To keep continuation rules from turning level-1 into a heavy global solver, answer-type checking must remain local, answer type polymorphism must stay out, generic × continuation rules must stay conservative, and no global continuation-capability solver should be required.

Specialization or callable lowering for continuations must not destroy this locality.

## 13. Surface Continuation Types

level-1 使用两个显式 continuation capability type：

```chiba
Cont1[A, B]
ContN[A, B]
cont1 (A) -> B
contN (A) -> B
```

其中 `A` 是 resume input type，`B` 是当前 `reset` 的 answer type。

- `Cont1[A, B]` 表示 one-shot continuation。它最多恢复一次。
- `ContN[A, B]` 表示 multi-shot continuation。它可以重复恢复。
- `cont1 (A) -> B` 是 `Cont1[A, B]` 的 surface type sugar。
- `contN (A) -> B` 是 `ContN[A, B]` 的 surface type sugar。

`Cont1` 与 `ContN` 都不是普通 closure。它们携带 answer type、来源 `reset` 边界、arena/world legality 与 usage 信息。它们默认都是 `!send`。

非逃逸、静态 exactly-once 的 `Cont1` 必须由 backend 编译成 direct resume、tail jump 或 inline continuation，不得分配 continuation package。逃逸的 `Cont1` 不得被提升成 multi-shot；它必须 lower 成 boxed one-shot state machine。boxed `Cont1` 第一次 resume 会 consume state，后续 resume 必须产生运行时错误或 trap。

`cont1 (A) -> B` 与 `contN (A) -> B` 可以出现在参数、局部绑定、record/tuple/ADT member 等类型位置。若 `cont1 (A) -> B` 出现在可别名存储位置，lowering 是 boxed one-shot state machine，而不是 erased callable ADT；若 `contN (A) -> B` 出现在存储位置，lowering 是可重复恢复的 continuation package。

`ContN` 的 control frame/spine 必须可重复恢复。`ContN` 可以进入 erased callable storage，但仍然保持 `!send`，并且不得因此丢失 answer type 与 reset boundary 检查。

## 13. Surface Continuation Types

Level-1 exposes two continuation capability types:

```chiba
Cont1[A, B]
ContN[A, B]
cont1 (A) -> B
contN (A) -> B
```

`A` is the resume input type and `B` is the answer type of the surrounding `reset`. `Cont1[A, B]` is a one-shot continuation that may be resumed at most once. `ContN[A, B]` is a multi-shot continuation that may be resumed multiple times.

`cont1 (A) -> B` is surface type sugar for `Cont1[A, B]`. `contN (A) -> B` is surface type sugar for `ContN[A, B]`.

Neither type is an ordinary closure. Both carry answer type, source reset boundary, arena/world legality, and usage information, and both default to `!send`.

A non-escaping, statically exactly-once `Cont1` must compile to a direct resume, tail jump, or inlined continuation without allocating a continuation package. An escaping `Cont1` must not be promoted into a multi-shot continuation; it must lower to a boxed one-shot state machine. The first resume consumes the state, and later resumes must raise a runtime error or trap.

`cont1 (A) -> B` and `contN (A) -> B` may appear in parameter, local binding, record, tuple, and ADT member type positions. When `cont1 (A) -> B` appears in an aliasable storage position, it lowers to a boxed one-shot state machine rather than to an erased callable ADT. When `contN (A) -> B` appears in storage, it lowers to a repeatable continuation package.

The control frame or spine of a `ContN` must be repeatable. `ContN` may enter erased callable storage, but it remains `!send` and must retain answer-type and reset-boundary checks.

## 14. `Ref[T]` Capture and Shared-Reference Semantics

`Ref[T]` 是 level-1 的 safe mutation surface。continuation 捕获 `Ref[T]` 时采用 shared-reference 语义：continuation frame/control spine 可以被恢复一次或多次，但捕获到的 `Ref[T]` cell 不会被 snapshot、copy 或 rollback。

因此，若 `ContN` 的恢复路径读写同一个 `Ref[T]`，多次 resume 会按普通共享 cell 语义累积副作用。`UnsafeRef[T]` 与其他 unsafe handle 的并发和别名安全由 unsafe 协议承担；continuation 本身仍默认 `!send`。

## 14. `Ref[T]` Capture and Shared-Reference Semantics

`Ref[T]` is the safe mutation surface in level-1. When a continuation captures a `Ref[T]`, it uses shared-reference semantics: the continuation frame or control spine may be resumed once or multiple times, but the captured `Ref[T]` cell is not snapshotted, copied, or rolled back.

Therefore, if a `ContN` resume path reads or writes the same `Ref[T]`, multiple resumes accumulate effects through the ordinary shared cell. Concurrency and aliasing safety for `UnsafeRef[T]` and other unsafe handles belong to the unsafe protocol; the continuation itself still defaults to `!send`.

## 15. Callable Arrow Positions

`(A) -> B` 在不同语义位置有不同 lowering contract。

在参数位置，`(A) -> B` 表示 callable shape obligation，并按 `def id(x) = x` 同类的 flexible inference / checked-template 路线处理。定义期记录调用次数、是否存储、是否要求 `send`、是否跨 boundary 等 obligation；实例化期可以兑现为 top-level function、no-capture closure、capturing closure、`Cont1[A, B]` 或 `ContN[A, B]`。

在存储位置，`(A) -> B` lower 成 erased callable ADT。该 ADT 至少包含 function、closure、boxed `Cont1[A, B]` 与 `ContN[A, B]` variants。调用该存储值时必须按 variant dispatch；如果 variant 是 boxed `Cont1`，调用会 consume 它，重复调用是运行时错误。

若用户写的是 `cont1 (A) -> B` 或 `contN (A) -> B`，则不是 erased callable storage：前者是 one-shot continuation storage，后者是 multi-shot continuation storage。它们分别 lower 成 boxed `Cont1` state machine 与 `ContN` package。

`((A) -> B) send` 是 sendable callable storage。它的 variant set 必须排除 `Cont1`、boxed `Cont1`、`ContN` 以及任何 `!send` closure。因此，把 continuation 传给 `spawn` 或写入要求 `send` 的 callable storage 必须报错，除非未来显式引入 sendable continuation capability。

## 15. Callable Arrow Positions

`(A) -> B` has different lowering contracts in different semantic positions.

In parameter position, `(A) -> B` is a callable-shape obligation and follows the same flexible-inference / checked-template route as `def id(x) = x`. Definition-time checking records obligations such as call count, storage, `send` requirement, and boundary crossing. Instantiation may discharge the parameter as a top-level function, no-capture closure, capturing closure, `Cont1[A, B]`, or `ContN[A, B]`.

In storage position, `(A) -> B` lowers to an erased callable ADT. That ADT must at least include function, closure, boxed `Cont1[A, B]`, and `ContN[A, B]` variants. Calling such a stored value dispatches by variant. If the variant is boxed `Cont1`, the call consumes it and repeated calls are runtime errors.

When the user writes `cont1 (A) -> B` or `contN (A) -> B`, the type is not erased callable storage. The former is one-shot continuation storage and the latter is multi-shot continuation storage. They lower to a boxed `Cont1` state machine and a `ContN` package respectively.

`((A) -> B) send` is sendable callable storage. Its variant set must exclude `Cont1`, boxed `Cont1`, `ContN`, and any `!send` closure. Passing a continuation to `spawn` or writing one into a `send`-requiring callable storage position must therefore be rejected unless a future layer introduces an explicit sendable continuation capability.

## 16. Required Backend Optimizations

level-1b backend 不能把 continuation / closure 的核心优化留成可选项：

- `UseZero` continuation 必须删除。
- 非逃逸 `UseOne` / `Cont1` continuation 必须 direct/inline/tail-resume，不得分配 continuation package。
- 逃逸 `Cont1` 必须 boxed 成 one-shot consumed-state machine，不得当作 `ContN`。
- `UseMany` / `ContN` 才 materialize multi-shot continuation package。
- 无 capture closure 必须 direct function / funcref / inline，不得分配 closure env。
- capture closure 只有在确实需要 env 时才分配 env；若静态已知 erased callable ADT 的 variant，dispatch 应被优化掉。

## 16. Required Backend Optimizations

The level-1b backend must not treat the core continuation and closure optimizations as optional:

- `UseZero` continuations must be deleted.
- Non-escaping `UseOne` / `Cont1` continuations must lower to direct, inlined, or tail-resume paths without allocating a continuation package.
- Escaping `Cont1` continuations must lower to boxed one-shot consumed-state machines, not to `ContN`.
- Only `UseMany` / `ContN` continuations materialize multi-shot continuation packages.
- Capture-free closures must lower to direct functions, funcrefs, or inlined code without allocating closure environments.
- Capturing closures allocate environments only when an environment is actually needed; statically known erased-callable variants should have dispatch optimized away.

## 17. 非目标

下列内容不是本文当前目标：

- answer type polymorphism
- continuation 的自由泛化
- interface-aware continuation constraints
- 高阶 effect system
- 全面的 continuation subtyping
- sendable continuation capability
- snapshot / rollback semantics for captured `Ref[T]`

## 17. Non-Goals

This document is not currently trying to provide answer type polymorphism, free continuation generalization, interface-aware continuation constraints, a high-order effect system, full continuation subtyping, sendable continuation capabilities, or snapshot / rollback semantics for captured `Ref[T]`.

## 18. 开放问题

- generic continuation 的泛化限制最终采用多严格的规则
- continuation 与 method / shaped dispatch 交互的缓存 key 如何建模
- boxed `Cont1` 的重复 resume 诊断应固定为 panic、trap 还是可捕获 runtime error
- erased callable ADT 的具体 ABI 与优化 manifest 如何展示

## 18. Open Questions

- How strict should the final generalization restriction be for generic continuations?
- How should caching keys be modeled for interactions between continuations and method or shaped dispatch?
- Should repeated resume of boxed `Cont1` be specified as panic, trap, or catchable runtime error?
- How should the concrete ABI and optimization manifest for erased callable ADTs be displayed?

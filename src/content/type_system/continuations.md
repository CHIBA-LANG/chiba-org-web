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

此外，continuation 默认属于受限控制能力，而不是可自由泛化、可自由发送、可自由存储的普通值。

## 1. Basic Rules

Because level-1 already contains `reset` and `shift`, continuation-related checking must also be solved at level-1 rather than postponed to level-2.

At minimum, level-1 needs typing rules for `reset` and `shift`, context constraints for capturing continuations, answer type checking, and rules describing how continuations interact with arena and escape boundaries. Continuations should be treated as restricted control capabilities, not as ordinary values that can be generalized, sent, or stored without limits.

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
- 则被捕获 continuation 的直觉类型接近 `A -> R`

同时，`shift` 的 body 也必须在同一个 `R` 下被检查。

这里的 `A -> R` 只表达最小直觉，不表示 continuation 与普通 closure 在实现或合法性上完全同构。

## 5. Minimal Typing Requirements

The document does not yet spell out a complete formal typing derivation, but the level-1 intuition is clear: if a hole expects a value of type `A` and the current `reset` has answer type `R`, then the captured continuation behaves roughly like `A -> R`.

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

## 13. 非目标

下列内容不是本文当前目标：

- answer type polymorphism
- continuation 的自由泛化
- interface-aware continuation constraints
- 高阶 effect system
- 全面的 continuation subtyping

## 13. Non-Goals

This document is not currently trying to provide answer type polymorphism, free continuation generalization, interface-aware continuation constraints, a high-order effect system, or full continuation subtyping.

## 14. 开放问题

- continuation 是否需要 surface-level type syntax
- continuation 是否允许被显式存入普通数据结构
- generic continuation 的泛化限制最终采用多严格的规则
- continuation 与 method / shaped dispatch 交互的缓存 key 如何建模

## 14. Open Questions

- Does continuation need a surface-level type syntax?
- May a continuation be explicitly stored inside ordinary data structures?
- How strict should the final generalization restriction be for generic continuations?
- How should caching keys be modeled for interactions between continuations and method or shaped dispatch?

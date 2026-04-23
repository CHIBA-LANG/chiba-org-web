# Chiba Level 1 Method Resolution Spec

## 0. 范围

本文规定 Chiba level-1 的 method resolution、operator overloading、以及 shape-based dispatch 的最小规则。

本文只讨论 level-1。

level-1 没有 interface，因此本文讨论的是 structural method system，而不是 interface-based witness resolution。

## 0. Scope

This document defines the minimum rules for method resolution, operator overloading, and shape-based dispatch in Chiba level-1.

It only discusses level-1. Since level-1 has no interface system, the topic here is a structural method system rather than interface-based witness resolution.

## 1. 设计要求

level-1 的方法系统需要同时满足：

- 支持 method surface syntax
- 支持 `def Type.method(...)`
- 支持 operator overloading
- 支持 shape-based dispatch
- 与 structural generics 协作
- 保持较快的候选筛选与缓存

## 1. Design Requirements

The level-1 method system must support method surface syntax, `def Type.method(...)`, operator overloading, shape-based dispatch, and cooperation with structural generics while still keeping candidate filtering and caching fast.

## 2. 基本规则

level-1 的方法解析不以“证明 `T : X`”为核心。

它的核心是：

- receiver 的 normalized shape 是什么
- 当前 call site 需要哪个名字或 operator
- 在当前 concrete instantiation 下有哪些候选
- 哪个候选最具体且不歧义

在 level-2 引入 interface 后，method resolution 仍应保持分层：

- level-1 structural methods
- level-2 named interface bundles

## 2. Basic Rule

Method resolution in level-1 is not centered on proving `T : X`.

Instead, it is centered on the receiver's normalized shape, the requested name or operator at the call site, the candidates available under the current concrete instantiation, and the choice of the most specific non-ambiguous candidate. If level-2 later adds interfaces, the layering should remain explicit: structural methods in level-1 and named interface bundles in level-2.

## 3. `def Type.method(...)`

level-1 允许 method-style 定义：

```chiba
def Type.method(self, ...)
```

这里的 `Type` 在 level-1 中可以是：

- 名义类型
- 结构性 shape 描述
- 后续需要继续细化的 receiver pattern

本文采用保守规则：

- receiver 约束最终必须能落到 normalized shape 上
- 不依赖 interface witness

## 3. `def Type.method(...)`

Level-1 allows method-style definitions such as `def Type.method(self, ...)`.

Here `Type` may be a nominal type, a structural shape description, or a receiver pattern that still needs refinement later. The conservative rule is that the receiver constraint must ultimately reduce to a normalized shape and may not depend on interface witnesses.

## 4. Method Call

调用：

```chiba
v.m(a, b)
```

至少产生下面几类检查：

- `v` 的 receiver shape
- 名称 `m`
- 参数形状与返回类型约束
- 当前实例化下的候选集合

最终结果不是通过 interface satisfaction 决定，而是通过 structural obligation + concrete shape 决定。

## 4. Method Calls

A call like `v.m(a, b)` must at least inspect the receiver shape of `v`, the name `m`, the argument and return-type constraints, and the candidate set available under the current instantiation.

The result is not decided by interface satisfaction. It is decided by structural obligations plus the concrete shape.

## 5. Operator Overloading

operator overloading 在 level-1 中属于方法系统的一部分。

它和普通 method resolution 的差别主要在 surface syntax，而不是 obligation 的本质。

例如：

- infix operator
- prefix operator
- postfix operator
- `.*`

它们都应被统一到：

- 一个可索引的 operator 名称空间
- 一套基于 receiver / operand shape 的候选筛选规则

## 5. Operator Overloading

Operator overloading is part of the level-1 method system. The difference from ordinary method resolution is mostly surface syntax, not the underlying obligation model.

Infix, prefix, postfix, and forms such as `.*` should all be unified under an indexable operator namespace and one candidate-selection discipline driven by receiver and operand shapes.

## 6. Shape-Based Dispatch

shape-based dispatch 是 level-1 的既定目标。

因此 method resolution 的实现必须直接接受：

- receiver shape 可能是结构性的
- generic 形参的具体 shape 可能要等实例化时才知道
- 某些决议只能在 concrete shape 上完成

## 6. Shape-Based Dispatch

Shape-based dispatch is a built-in target of level-1, so method resolution must accept structural receiver shapes, generic parameters whose concrete shape is only known at instantiation time, and decisions that can be completed only on concrete shapes.

## 7. 候选筛选

为了兼顾编译速度，候选筛选必须分层：

- 先按名称或 operator 查候选集
- 再按 receiver 的 normalized shape 做快速过滤
- 再做精确的 structural match
- 最后选最具体且不冲突的候选

实现层可结合：

- canonical row / shape key
- field mask
- popcount 或类似分桶
- 方法解析缓存

## 7. Candidate Filtering

To keep compile time under control, candidate filtering must be layered: first filter by name or operator, then quickly filter by normalized receiver shape, then run precise structural matching, and finally choose the most specific non-conflicting candidate.

The implementation may rely on canonical row or shape keys, field masks, popcount-like bucketing, and method-resolution caches.

## 8. 与 Generics 的关系

generic body 中的 method call 常常不能在定义期完全决议。

因此本文采用：

- 定义期生成 method obligation
- 实例化期在 concrete shape 上完成最终解析

这也是 level-1 保持编译速度的关键手段之一。

## 8. Relation to Generics

Method calls inside generic bodies often cannot be fully resolved at definition time.

The correct model is to generate method obligations during definition-time checking and finish the final resolution over concrete shapes during instantiation. That is one of the main reasons level-1 can stay fast.

## 9. 与 Row 的关系

row / shape 是 method resolution 的表示层。

row 负责：

- 表示 receiver 至少有哪些字段/结构约束
- 提供 canonical receiver shape
- 为缓存与快速过滤提供稳定 key

method resolution 则负责：

- 选候选
- 判冲突
- 给出最终目标实现

## 9. Relation to Rows

Rows and shapes are the representation layer for method resolution. They describe which fields or structural constraints are present on the receiver, provide a canonical receiver shape, and contribute stable keys for caching and quick filtering.

Method resolution itself is still responsible for choosing candidates, detecting conflicts, and identifying the final implementation target.

## 10. 与 Interface 的边界

level-1 没有 interface。

因此本文明确不做：

- witness search
- `T : X` 风格的 satisfaction
- interface coherence 规则

这些都属于 level-2。

但为了与 level-2 保持兼容，本文先固定两个前向规则：

1. named interface method 不应被压平成普通 structural row 事实
2. 没有显式 qualify 时，structural method 优先于 interface-derived method

当 level-2 引入：

- `Interface.method(x)`
- `x.m() via ns.path`

时，这两类写法都应显式进入 named bundle 路径，而不是与默认 structural method lookup 混为一谈

## 10. Boundary with Interfaces

Level-1 has no interface system, so it does not perform witness search, `T : X`-style satisfaction, or interface coherence rules. Those all belong to level-2.

To stay compatible with that future layer, two forward rules should already be fixed: named interface methods must not be flattened into ordinary structural row facts, and structural methods should win over interface-derived methods when there is no explicit qualification. Forms such as `Interface.method(x)` and `x.m() via ns.path` should enter a named-bundle path explicitly instead of being merged into default structural lookup.

## 11. 歧义与冲突

level-1 虽然没有完整 interface 系统，但 method resolution 仍必须回答：

- 若两个候选都匹配怎么办
- 若没有唯一最具体候选怎么办
- 若 operator 和 method surface 映射到同一底层名义空间怎么办

本文采用保守规则：

- 不存在唯一最具体候选时，直接报错
- 不在 level-1 引入复杂全局 overlap 规则

若未来同时存在：

- structural candidate
- interface-derived candidate

则默认规则应为：

- 显式 `via ns.path` 优先
- 显式 `Interface.method(x)` 优先走 interface bundle
- 普通 `x.m()` 默认 structural 优先

## 11. Ambiguity and Conflict

Even without a full interface system, level-1 method resolution must answer what happens when two candidates match, when no uniquely most-specific candidate exists, or when operator and method syntax map into the same underlying namespace.

The conservative rule is to error out whenever there is no unique most-specific candidate. If level-2 later introduces interface-derived candidates, explicit `via ns.path` and explicit `Interface.method(x)` should take priority, while ordinary `x.m()` should remain structural-first.

## 12. 编译速度约束

为了兼顾编译速度，实现必须坚持：

- 候选解析懒执行
- 结果缓存到 concrete shape
- 不做 eager 全局扩散
- 不要求 level-1 提前构造完整的 interface-like method table

## 12. Compile-Time Constraints

To preserve compile speed, candidate resolution must remain lazy, cached on concrete shapes, free of eager global propagation, and free of any requirement that level-1 build a full interface-like method table in advance.

## 13. 非目标

下列内容不是当前 level-1 首批目标：

- interface-based dispatch
- witness / dictionary passing
- 完整 coherence 形式化
- 全局 eager method propagation
- 依赖命名能力系统的 overload solver

## 13. Non-Goals

The first generation of level-1 method resolution is not trying to provide interface-based dispatch, witness or dictionary passing, a full formalization of coherence, eager global propagation of methods, or an overload solver built on top of a named capability system.

## 14. 开放问题

- `Type` 在 `def Type.method(...)` 中允许到什么程度的 structural receiver syntax
- operator 名称编码最终采用什么方案
- shape dispatch 缓存与 generic 实例化缓存是否共享
- method ambiguity 的错误信息如何尽量保持清晰

## 14. Open Questions

- How much structural receiver syntax should `Type` be allowed to express inside `def Type.method(...)`?
- What final encoding should operator names use?
- Should shape-dispatch caches and generic-instantiation caches be shared?
- How can ambiguity diagnostics stay clear when method resolution fails?

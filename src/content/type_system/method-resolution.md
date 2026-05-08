# Chiba Level 1 Method Resolution Spec

## 0. 范围

本文规定 Chiba level-1 的 method resolution、operator overloading、以及 shape-based dispatch 的最小规则。

本文只讨论 level-1。

level-1 没有传统 interface / trait solver，因此本文讨论的是 nominal method system，而不是 interface-based witness resolution。

## 0. Scope

This document defines the minimum rules for method resolution, operator overloading, and shape-based dispatch in Chiba level-1.

It only discusses level-1. Since level-1 has no traditional interface system, the topic here is a nominal method system rather than interface-based witness resolution.

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

- receiver 的 nominal identity 是什么
- 当前 call site 需要哪个名字或 operator
- 在当前 concrete instantiation 下有哪些候选
- 哪个候选最具体且不歧义

在 level-2 引入 named constraint 与 `via` 后，method resolution 仍应保持分层：

- level-1 nominal methods
- level-2 `via namespace` 路径

## 2. Basic Rule

Method resolution in level-1 is not centered on proving `T : X`.

Instead, it is centered on the receiver's nominal identity, the requested name or operator at the call site, the candidates available under the current concrete instantiation, and the choice of the most specific non-ambiguous candidate. If level-2 later adds named constraints and `via`, the layering should remain explicit: nominal methods in level-1 and explicit `via namespace` paths in level-2.

## 3. `def Type.method(...)`

level-1 允许 method-style 定义：

```chiba
def Type.method(self, ...)
```

这里的 `Type` 在 level-1 中可以是：

- 名义类型

本文采用保守规则：

- receiver 约束最终必须落到 nominal identity 上
- 不依赖 interface witness

## 3. `def Type.method(...)`

Level-1 allows method-style definitions such as `def Type.method(self, ...)`.

Here `Type` must be a nominal type in level-1. The conservative rule is that receiver constraints for methods reduce to nominal identity only and may not depend on interface witnesses.

## 4. Method Call

调用：

```chiba
v.m(a, b)
```

至少产生下面几类检查：

- `v` 的 receiver nominal type
- 名称 `m`
- 参数形状与返回类型约束
- 当前实例化下的候选集合

最终结果不是通过 interface satisfaction 决定，而是通过 nominal identity 与 concrete instantiation 共同决定。

`a.b(c)` 的 callee 解析分三层：

1. 若 `a` 是值表达式，且其值类型有字段 `b`，则选择 field callable，形成 `(a.b)(c)`。
2. 否则，若 `typeof(a)` 的 nominal method set 中有方法 `b`，则选择 receiver method，形成 `TypeOf(a).b(a, c)`。
3. 否则，若 `a` 是 type / namespace path，且 `a.b` 作为整体能解析到可调用项，则选择 qualified callee，形成 `(a.b)(c)`。

第 3 层不做 receiver 注入；`a.b` 是整体名字。

## 4. Method Calls

A call like `v.m(a, b)` must at least inspect the receiver's nominal type, the name `m`, the argument and return-type constraints, and the candidate set available under the current instantiation.

The result is not decided by interface satisfaction. It is decided by nominal identity and the concrete instantiation.

For `a.b(c)`, callee resolution is layered: if `a` is a value expression with field `b`, the call is `(a.b)(c)`; otherwise, if `typeof(a)` has nominal method `b`, the call lowers to `TypeOf(a).b(a, c)`; otherwise, if `a` is a type or namespace path and `a.b` resolves as a callable item, the call is `(a.b)(c)`. The qualified-callee case does not evaluate `a` and does not inject a receiver.

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

shape-based dispatch 仍然是 level-1 的既定目标，但它不再等同于 method resolution。

method resolution 只负责 nominal 方法；shape-based dispatch 属于独立的 structural obligation / codegen 路径。

## 6. Shape-Based Dispatch

Shape-based dispatch remains a built-in target of level-1, but it is no longer identified with method resolution. Method resolution is only for nominal methods; shape-based dispatch belongs to a separate structural-obligation and codegen path.

## 7. 候选筛选

为了兼顾编译速度，候选筛选必须分层：

- 先按名称或 operator 查候选集
- 再按 receiver 的 nominal identity 做快速过滤
- 再做精确的 nominal match
- 最后选最具体且不冲突的候选

实现层可结合：

- canonical row / shape key
- field mask
- popcount 或类似分桶
- 方法解析缓存

## 7. Candidate Filtering

To keep compile time under control, candidate filtering must be layered: first filter by name or operator, then quickly filter by nominal identity and normalized receiver shape, then run precise structural matching, and finally choose the most specific non-conflicting candidate.

The implementation may rely on nominal method indexes, fast nominal-type filters, and method-resolution caches.

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

method resolution 只建立在名义类型之上。

method resolution 负责：

- 选候选
- 判冲突
- 给出最终目标实现

名义类型负责：

- 保留 receiver 的稳定语义身份
- 避免同 shape 不同 type 的方法世界被混成一个

row / shape 仍服务于字段访问、generic obligation 与 shape-based dispatch，但不参与默认方法查找。

因此 field callable 是 method resolution 之前的表达式解析结果；qualified callee 是 type / namespace path 解析结果。二者都不属于 receiver method candidate filtering。

## 9. Relation to Rows

Method resolution is built on nominal types. It chooses candidates, detects conflicts, and identifies the final implementation target, while rows and shapes remain available for field access, generic obligations, and shape-based dispatch outside the default method lookup.

Therefore field-callable resolution happens before method resolution, and qualified-callee resolution happens through type or namespace path lookup. Neither is part of receiver-method candidate filtering.

## 10. 与 Named Constraint / `via` 的边界

level-1 没有传统 interface 系统。

因此本文明确不做：

- witness search
- `T : X` 风格的 satisfaction
- interface / trait coherence 规则

这些都属于 level-2。

但为了与 level-2 保持兼容，本文先固定下面规则：

1. namespace-scoped named constraint 不做全局传染
2. `via namespace` 是显式行为来源选择
3. 没有显式 `via` 时，普通 `x.m()` 不进入全局 evidence search

这意味着：

- `x.m() via ns.path` 进入显式 namespace 路径
- 默认 `x.m()` 只看默认可见世界中的 nominal 候选

## 10. Boundary with Named Constraints and `via`

Level-1 has no traditional interface system, so it does not perform witness search, `T : X`-style satisfaction, or interface/trait coherence rules. Those all belong to level-2.

To stay compatible with that future layer, three forward rules should already be fixed: namespace-scoped named constraints must not become global evidence, `via namespace` is an explicit behavior-source path, and ordinary `x.m()` without `via` must not fall into a global evidence search.

## 11. 歧义与冲突

level-1 虽然没有完整 interface 系统，但 method resolution 仍必须回答：

- 若两个候选都匹配怎么办
- 若没有唯一最具体候选怎么办
- 若 operator 和 method surface 映射到同一底层名义空间怎么办

本文采用保守规则：

- 不存在唯一最具体候选时，直接报错
- 不在 level-1 引入复杂全局 overlap 规则

若未来同时存在默认候选与显式 `via` 路径，则默认规则应为：

- 显式 `via namespace` 优先于默认路径
- 普通 `x.m()` 不自动吸入 namespace 外的命名约束
- 同层没有唯一候选时直接报错

## 11. Ambiguity and Conflict

Even without a full interface system, level-1 method resolution must answer what happens when two candidates match, when no uniquely most-specific candidate exists, or when operator and method syntax map into the same underlying namespace.

The conservative rule is to error out whenever there is no unique most-specific candidate. If level-2 later introduces explicit `via namespace` paths, those paths should take priority over the default lookup, while ordinary `x.m()` should remain inside the default nominal world.

## 12. 编译速度约束

为了兼顾编译速度，实现必须坚持：

- 候选解析懒执行
- 结果缓存到 concrete nominal instantiation
- 不做 eager 全局扩散
- 不要求 level-1 提前构造完整的 interface-like method table
- 不让同 shape 不同 nominal type 在解析阶段被合并

## 12. Compile-Time Constraints

To preserve compile speed, candidate resolution must remain lazy, cached on concrete nominal instantiations, free of eager global propagation, free of any requirement that level-1 build a full interface-like method table in advance, and careful not to collapse different nominal types merely because their shapes match.

## 13. 非目标

下列内容不是当前 level-1 首批目标：

- traditional interface-based dispatch
- witness / dictionary passing
- 完整 coherence 形式化
- 全局 eager method propagation
- 依赖命名能力系统的 overload solver

## 13. Non-Goals

The first generation of level-1 method resolution is not trying to provide traditional interface-based dispatch, witness or dictionary passing, a full formalization of coherence, eager global propagation of methods, or an overload solver built on top of a named capability system.

## 14. 开放问题

- operator 名称编码最终采用什么方案
- shape dispatch 缓存与 generic 实例化缓存是否共享
- method ambiguity 的错误信息如何尽量保持清晰

## 14. Open Questions

- What final encoding should operator names use?
- Should shape-dispatch caches and generic-instantiation caches be shared?
- How can ambiguity diagnostics stay clear when method resolution fails?

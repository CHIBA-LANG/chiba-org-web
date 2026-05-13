# Chiba Level 1 Rows Spec

## 0. 范围

本文规定 Chiba level-1 的 row polymorphism、shape 表示与 record 相关类型检查边界。

本文只讨论 level-1。

本文不引入传统 interface / trait 系统，不把 row 系统设计成一套全局 structural subtyping lattice，也不让 row 抹掉名义类型的身份。

## 0. Scope

This document defines the type-checking boundary for row polymorphism, shape representation, and record-related typing in Chiba level-1.

It only discusses level-1. It does not introduce a traditional interface or trait solver, does not build a global structural-subtyping lattice out of rows, and does not let rows erase nominal identity.

## 1. 设计要求

level-1 的 row 系统需要满足下面要求：

- 支持 record field access
- 支持 record update
- 支持 open row / closed row
- 为 structural generics 提供 shape 表示
- 为 field access、operator contract 与 shaped dispatch 提供 canonical shape
- 保持较快的比较、缓存与实例化检查

## 1. Design Requirements

The level-1 row system must support record field access, record update, open and closed rows, shape representations for structural generics, canonical shapes for field access, operator contracts, and shaped dispatch, and fast comparison, caching, and instantiation checking.

## 2. 基本规则

row 在 level-1 中是 shape 的表示层，不是另一套独立的 interface 系统。

因此本文采用下面规则：

- row 主要通过 unify 起作用
- row 需要 canonical representation
- row 不负责引入任意位置的自动 subsumption
- nominal method resolution 不从 row fact 取证；operator contract 与 shaped dispatch 可以使用 row 提供的 normalized shape

特别地，future level-2 的 named constraint 不应被压成全局 witness，也不应直接压平到 row 本体中。

row 表示 value shape；future named constraint 只是 namespace-scoped names over shape contracts。

## 2. Basic Rules

Rows are the representation layer for shapes in level-1, not a second interface system.

They operate mainly through unification, require canonical representations, and do not provide arbitrary implicit subsumption at every position. Nominal method resolution does not take evidence from row facts; operator contracts and shaped dispatch may use normalized row shapes. Future level-2 named constraints must not become global evidence and must not be flattened directly into the row itself. A row represents value shape; named constraints are only namespace-scoped names over shape contracts.

## 3. 语法方向

### 3.1 value 层

level-1 已有 record update：

```chiba
{base | x: value}
```

该语法表示从 `base` 派生出一个新 record value，并覆写或添加字段。

### 3.2 type 层

type 层应沿用相同方向的心智模型。

本文暂用下列记法描述 open row：

```text
{base | x: Tx, y: Ty}
```

其含义不是运行时更新，而是“在某个已有 row base 之上附加字段约束”。

这里的 `base` 可以是：

- 一个 closed row 的空基
- 一个 row variable
- 另一个已规范化的 row base

本文当前不把 type 层具体 surface syntax 最终定死，但要求其方向与 value 层一致。

## 3. Syntax Direction

At the value level, level-1 already has record update syntax such as `{base | x: value}`. At the type level, the same mental model should be preserved.

This document temporarily writes open rows as `{base | x: Tx, y: Ty}` to express added field constraints over an existing row base. The exact surface syntax for type-level rows is not fixed yet, but it should stay aligned with the value-level form.

## 4. Row 的抽象结构

一个 row 可以抽象成：

- 一个 base
- 一组字段约束
- 一个 closed/open 标记

实现上，row 应规范化为：

```text
Row = (base, sorted[(field_id, field_type)], openness)
```

其中：

- `field_id` 来源于稳定的字段 symbol identity
- 字段按稳定顺序排序
- `openness` 表示这是 closed row，还是带 tail 的 open row

tuple 使用同一套 row-backed 思路，但字段名由位置生成：第一个元素是 `_1`，第二个元素是 `_2`，依此类推。tuple 的位置字段是编译器生成的稳定字段 identity，不受用户 record 字段顺序规则影响。

## 4. Abstract Row Structure

A row can be modeled as a base, a set of field constraints, and a closed-or-open marker.

Implementation-wise, the normalized representation should look like `Row = (base, sorted[(field_id, field_type)], openness)`, where field identities are stable, fields are sorted in a stable order, and openness records whether the row is closed or has an open tail.

## 5. Canonical Representation

为了保证：

- 比较稳定
- hash 稳定
- shaped dispatch cache 可复用
- generics 实例化 key 可复用

row 必须 canonical。

这至少意味着：

- 字段顺序与源码书写顺序无关
- `{x: A, y: B}` 与 `{y: B, x: A}` 规范化后相同
- 同一字段名必须映射到稳定的 `field_id`
- 规范化不依赖编译顺序

## 5. Canonical Representation

Rows must be canonical so that equality checks, hashing, shaped-dispatch caches, and generic instantiation keys remain stable.

That means field order must be independent of source order, `{x: A, y: B}` and `{y: B, x: A}` must normalize to the same row, field names must map to stable field identifiers, and normalization must not depend on compilation order.

## 6. Closed Row 与 Open Row

### 6.1 Closed Row

closed row 表示字段集合已封闭。

例如：

```text
{ | x: i64, y: bool }
```

含义是：

- 至少包含 `x` 和 `y`
- 不再允许额外未知字段

### 6.2 Open Row

open row 表示在已知字段之外，仍允许其他字段存在。

例如：

```text
{r | x: i64}
```

含义是：

- 至少包含 `x: i64`
- 其余字段由 row variable `r` 决定

level-1 的 field access、structural generic 参数、operator contract、shaped dispatch，以及 `dyn {r | ...}` 的静态 shape contract，通常都依赖 open row。

## 6. Closed and Open Rows

A closed row represents a field set that is sealed: it has the listed fields and forbids unknown extra fields. An open row represents a field set that has known fields but still allows additional ones through a row variable.

Field access, structural generic parameters, operator contracts, shaped dispatch, and the static contract carried by `dyn {r | ...}` in level-1 usually depend on open rows.

## 7. 基本检查规则

### 7.1 Field Access

表达式：

```chiba
v.x
```

要求 `v` 的类型可统一到：

```text
{r | x: a}
```

并推出：

```text
v.x : a
```

这不是通过“`typeof(v)` 是某个父类型的子类型”来完成，而是通过 row unify 来完成。

### 7.2 Record Update

表达式：

```chiba
{base | x: value}
```

至少要求：

- `base` 是 record-like value
- 更新后的字段类型与写入值一致
- 更新结果的 row shape 可由 `base` 的 row 与新字段约束合成

### 7.3 Record Literal

record literal 产生 closed row shape，除非某处显式引入 open row 变量。

### 7.4 重复字段

最终 surface syntax 是否允许重复字段，仍需单独定。

但 type 层 canonical form 中，同一字段不能以两个互相冲突的类型同时存在。

## 7. Basic Checking Rules

Field access like `v.x` requires the type of `v` to unify with something like `{r | x: a}`, which then yields `v.x : a`. This is done through row unification rather than subtype search.

Record updates require a record-like base, consistent field types after the update, and a synthesized result row derived from the base row plus new constraints. Record literals normally produce closed rows unless an open-row variable is introduced explicitly. Duplicate fields may still be a surface-syntax question, but in the canonical type form a single field cannot carry two conflicting types.

## 8. Row Unification

level-1 的 row 推断核心是 unify，而不是全局 structural subtype search。

最小要求包括：

- row variable 与 closed row 的 unify
- row variable 与 open row 的 unify
- 字段存在性检查
- 字段类型一致性检查
- closed row 上的额外字段拒绝

本文暂不在这里写完整算法，但实现必须能把常见 record/field/update 场景归约为局部 unify。

## 8. Row Unification

The core of level-1 row inference is unification rather than a global structural-subtyping search.

At minimum the implementation must support unifying row variables with closed rows and open rows, checking field existence and field-type consistency, and rejecting extra fields on closed rows. The full algorithm is left unspecified here, but common record, field-access, and update cases must reduce to local unification steps.

## 9. 与 Structural Generics 的关系

level-1 generics 不依赖 interface，因此 row/shape 是 structural generics 的主要约束来源之一。

例如：

```chiba
def get_x(v) = v.x
```

定义期应推出类似：

```text
get_x : {r | x: a} -> a
```

后续实例化时，再用 concrete shape 去兑现这个约束。

函数参数可以直接写 row-bound shorthand：

```chiba
def get_name(v: {r | name: Str}) = v.name
```

它等价于：

```chiba
def get_name[T: {r | name: Str}](v: T) = v.name
```

这里的 `{r | name: Str}` 是 open-row obligation，表示参数 concrete shape 必须至少提供 `name: Str`。它不是 closed record type，也不是把 nominal type 擦成匿名 record。除非源码显式复用同一个命名类型变量，多个 row shorthand 参数各自引入不同的 fresh synthetic generic。

未标注参数的字段访问也会自动生成同类 row obligation：

```chiba
def get_name(v) = v.name
```

检查后应得到与上面相同的 shape 约束，只是字段类型可以继续由使用点推断。

## 9. Relation to Structural Generics

Because level-1 generics do not depend on interfaces, rows and shapes are one of their primary sources of structural constraints.

For example, `def get_x(v) = v.x` should infer something like `get_x : {r | x: a} -> a`, and the concrete shape should discharge that constraint at instantiation time.

Function parameters may use row-bound shorthand. For example, `def get_name(v: {r | name: Str}) = v.name` is equivalent to `def get_name[T: {r | name: Str}](v: T) = v.name`. The row is an open-row obligation: the concrete shape must provide at least `name: Str`. It is not a closed record type and does not erase nominal identity into an anonymous record. Unless the source explicitly reuses a named type variable, several row-shorthand parameters introduce separate fresh synthetic generics.

Field access on an unannotated parameter generates the same kind of row obligation automatically. `def get_name(v) = v.name` should therefore infer the same shape constraint, with the field type still inferred from use.

## 10. 与 Method / Operator / Dispatch 的关系

row 本身不负责选方法，也不负责做 operator overload 决议，更不负责证明行为来源。

row 提供的是：

- value 的 normalized shape
- 字段集合与字段类型信息
- shaped dispatch 的 cache key 组成部分
- operator contract 的 shape 部分

nominal method 的候选不由 row 选择；operator 具体实现由 operator resolution 在 concrete nominal type、显式 cast / checked conversion 或显式 behavior source 下决定。

## 10. Relation to Methods, Operators, and Dispatch

Rows do not choose methods or resolve operator overloads on their own, and they do not prove behavior sources. They provide the normalized value shape, field information, the shape part of operator contracts, and part of the cache key used by shaped dispatch and dynamic-row checking.

Nominal method candidates are not selected by rows. Concrete operator implementations are selected by operator-resolution rules under concrete nominal types, explicit casts or checked conversions, or explicit behavior sources.

## 11. 编译速度约束

为了兼顾编译速度，row 系统需要满足：

- 规范化后比较尽量接近结构相等比较
- hash / mask / shape key 可缓存
- 不做全程序 structural lattice 求解
- 常见字段较少的 shape 需要有快路径

## 11. Compile-Time Constraints

To preserve compile speed, normalized rows should compare almost like structural equality, hash and mask data should be cacheable, there should be no whole-program structural-lattice solving, and shapes with only a few fields should have fast paths.

## 12. 非目标

下列内容不是本文当前目标：

- 传统 interface-driven row constraints
- 把 namespace-scoped named constraint 直接翻成全局 witness
- structural subtyping 的完整形式化
- row effect system
- answer type polymorphism
- 把 row 直接扩展成命名能力系统

## 12. Non-Goals

This document is not trying to support traditional interface-driven row constraints, flatten namespace-scoped named constraints into a global witness world, fully formalize structural subtyping, build a row effect system, add answer type polymorphism, or turn rows directly into a named capability system.

## 13. 开放问题

- type 层最终 surface syntax 是否完全暴露 `{base | field: Ty}`
- duplicate field 的 surface 规则如何处理
- closed row 的空基写法是否需要单独语法
- row canonicalization 的内部表示是否直接暴露给 shaped dispatch cache

## 13. Open Questions

- Should the type-level surface syntax fully expose `{base | field: Ty}`?
- How should duplicate fields be handled in surface syntax?
- Does the empty base of a closed row need a dedicated syntax?
- Should the internal representation of row canonicalization be exposed directly to the shaped-dispatch cache?

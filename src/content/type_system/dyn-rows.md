# Chiba Dynamic Packages Spec

## 0. 范围

本文规定 Chiba 中 `dyn {r | ...}` 与 `dyn Constraint` 的语义位置、类型检查边界，以及它们与静态 row 系统、named constraint 的关系。

本文只规定语言层语义，不规定 hidden class、inline cache、shape transition 等运行时优化细节。

## 0. Scope

This document defines the semantic position, typing boundary, and relation to the static row system and named constraints for `dyn {r | ...}` and `dyn Constraint` in Chiba.

It specifies language-level semantics only. It does not commit to runtime optimization details such as hidden classes, inline caches, or shape transitions.

## 1. 总体方向

Chiba 的 `dyn` 总是表示一个带 adapter 的动态包。

表面语法上，它可以写成：

- `dyn {r | ...}`
- `dyn Constraint`

它的目标是：

- 保留运行时动态性
- 复用 row poly 与 named constraint 的 contract 语言
- 允许把名义类型上的能力桥接进动态世界
- 不把底层 runtime representation 直接暴露给表面语法
- 不做运行时的全局 impl / witness 搜索

## 1. Overall Direction

Chiba's `dyn` always denotes a dynamic package carrying adapters.

At the surface level it may be written as:

- `dyn {r | ...}`
- `dyn Constraint`

Its goal is to preserve runtime dynamism, reuse the contract language of row polymorphism and named constraints, allow nominal capabilities to be bridged into the dynamic world, avoid exposing low-level runtime representation directly in the surface language, and avoid any runtime global impl or witness search.

## 2. 基本规则

`dyn` 值表示：

- 这是一个运行时值
- 类型系统知道它满足某个 row contract 或 named constraint
- 该值总是伴随一组 adapter / bridge entry 被打包进入动态世界
- 对该值的字段/成员使用按 contract 规则做静态检查
- 实际执行通过打包时选定的 adapter 完成

例如：

```chiba
def get_name(v: dyn {r | name: String}) = v.name
```

这里 `v.name` 的类型检查沿用 row 规则，但不是静态 offset 读取。

再例如：

```chiba
def render(v: dyn ToString) = v.toString()
```

这里 `v.toString()` 不是全局 impl 搜索，而是调用该 dynamic package 中已经打包好的 `ToString` adapter。

## 2. Basic Rules

A `dyn` value means:

- the value exists at runtime,
- the type system knows it satisfies a row contract or a named constraint,
- the value is always packaged together with adapter / bridge entries when it enters the dynamic world,
- field and member use is checked statically against that contract,
- and execution proceeds through the adapters selected at packaging time.

For example, in `def get_name(v: dyn {r | name: String}) = v.name`, the typing of `v.name` follows the row rules, but the execution is not a static offset load.

Likewise, in `def render(v: dyn ToString) = v.toString()`, the call is not resolved by any global impl search. It uses the `ToString` adapter already packaged inside the dynamic value.

## 3. `dyn {r | ...}` 与 `dyn Constraint`

`dyn {r | ...}` 与 `dyn Constraint` 不应被理解成两种完全不同的 runtime representation。

它们都表示 dynamic package。

区别只在于：

- `dyn {r | ...}` 直接写出 contract
- `dyn Constraint` 先将 named constraint 展开，再打包对应 adapter

因此，`dyn ToString` 不等于“裸的 `dyn row alias`”。

它表示：

- 一个运行时值
- 一份已选定的 `ToString` adapter

## 3. `dyn {r | ...}` and `dyn Constraint`

`dyn {r | ...}` and `dyn Constraint` should not be understood as two completely different runtime representations.

They are both dynamic packages.

The only difference is that:

- `dyn {r | ...}` writes the contract directly
- `dyn Constraint` first expands the named constraint and then packages the corresponding adapter

Therefore `dyn ToString` is not merely a bare `dyn row alias`.

It denotes:

- a runtime value
- a chosen `ToString` adapter

## 4. 与静态约束的关系

静态 row constraint：

```chiba
[T: {r | name: String}]
```

表示 concrete `T` 在实例化时必须满足 shape contract。

静态 named constraint：

```chiba
[T: ToString]
```

表示 concrete `T` 在实例化时必须满足 `ToString`。

动态 `dyn`：

```chiba
dyn {r | name: String}
dyn ToString
```

表示该值在运行时以动态方式满足对应 contract，并带有服务该 contract 的 adapter。

## 4. Relation to Static Constraints

A static row constraint such as `[T: {r | name: String}]` means a concrete `T` must satisfy a shape contract during instantiation.

A static named constraint such as `[T: ToString]` means a concrete `T` must satisfy `ToString` during instantiation.

A dynamic `dyn` value such as `dyn {r | name: String}` or `dyn ToString` means the runtime value satisfies the corresponding contract and carries the adapters needed to serve it.

## 5. 自动注入

当上下文期望某个 `dyn` 类型时，若某个静态值能静态满足该 contract，则允许自动注入到动态世界。

注入时，编译器不仅传入值本身，还必须同时构造并打包对应 adapter。

也就是说：

```text
T converts to dyn C
```

在 expected type 已经是某个 `dyn C` 时可以自动发生。

但反方向：

```text
dyn C converts to T
```

不能自动发生，必须显式检查。

## 5. Automatic Injection

When the expected type is some `dyn` type, a static value may be injected automatically into the dynamic world if it statically satisfies the required contract.

At injection time, the compiler packages not only the value itself but also the corresponding adapter.

In other words, conversion from `T` to `dyn C` may happen automatically only when the expected type is already some `dyn C`.

The reverse direction, from `dyn C` back to `T`, may not happen automatically and must be checked explicitly.

## 5.1 Adapter 构造

`dyn {r | ...}` 的 adapter 在值进入 dynamic package 时构造。构造不是运行时全局搜索，而是 expected type 已知时的编译器注入：

```chiba
def use(v: dyn {r | x: i64, y: (i64) -> i64}): i64 = v.y(v.x)
```

若传入 concrete value `p: P`，编译器必须在注入点证明 `P` 能服务 contract 中的每个 entry。

每个 entry 的解析顺序是：

1. 先查 concrete value 的字段面。若 `P` 有字段 `x`，则 adapter entry `x` 是 field adapter。
2. 若没有字段，再查 concrete nominal receiver method。若存在 `def P.y(self, ...)`，则 adapter entry `y` 是 bound receiver method adapter。
3. 若字段与 method 都不存在，或签名不匹配，注入失败并在 typed / instantiation 边界报错。

字段优先规则与普通 `a.b(c)` 的解析顺序一致：同名字段存在时，不能偷偷选择同名 receiver method。

receiver method adapter 在打包时固定 method identity、runtime target、receiver type specialization 与参数/返回类型。对于泛型 receiver，例如 `Box[T]` 的 `def Box[T].update(self: Self, value: T): Self`，把 `Box[i64]` 注入 `dyn {r | update: ...}` 时必须先把 `Self` 和 `T` 专门化为 `Box[i64]` 与 `i64`，adapter 不得保留未兑现的字符串形状猜测。

## 5.1 Adapter Construction

The adapter for `dyn {r | ...}` is built at the injection site. It is not runtime global search; it is compiler packaging under a known expected type.

For each contract entry, resolution is layered:

1. Try the concrete value's field surface first. If the payload has a field `x`, the adapter entry is a field adapter.
2. If no field exists, try a concrete nominal receiver method. If `def P.y(self, ...)` exists, the adapter entry is a bound receiver-method adapter.
3. If neither path exists, or the selected entry's signature does not match the contract, injection fails at the typed or instantiation boundary.

The field-first rule is the same rule used by ordinary `a.b(c)`: a same-named field prevents silently choosing a same-named receiver method.

A receiver-method adapter records the chosen method identity, runtime target, receiver-type specialization, parameter types, and result type at packaging time. For a generic receiver such as `Box[T]` with `def Box[T].update(self: Self, value: T): Self`, injecting `Box[i64]` into `dyn {r | update: ...}` must specialize `Self` and `T` to `Box[i64]` and `i64` before constructing the adapter. Later passes may consume these typed facts, but they must not infer the target from string shape.

## 5.2 Dynamic row polymorphism

静态 row polymorphism 与 dynamic row package 共用 contract 语言，但不是同一个值表示。

```chiba
def get_x[T: {r | x: i64}](v: T): i64 = v.x
def get_dyn_x(v: dyn {r | x: i64}): i64 = v.x
```

`get_x` 的参数位置接受 concrete nominal / record，也可以在实例化规则允许时把 `dyn {r | x: i64}` 作为一个 concrete dynamic package instance。此时 `v.x` 走 dynamic adapter access，而不是重新静态拆开 payload。

`get_dyn_x` 明确要求 boxed dynamic storage；若传入 concrete value，则 expected type 触发 `T -> dyn {r | x: i64}` 注入。

因此：

- 静态 row poly 不要求到处隐式 box。
- `dyn {r | ...}` 表示已经动态化的 package。
- 反向从 `dyn` 回 concrete nominal type 不自动发生。
- Core / CIR 应能区分 `StaticRowAccess` 与 `DynRowAdapterAccess`。

## 5.2 Dynamic Row Polymorphism

Static row polymorphism and dynamic row packages share a contract language, but they are not the same value representation.

For a static template such as `def get_x[T: {r | x: i64}](v: T): i64 = v.x`, `T` may instantiate to a concrete nominal or record type, and may also instantiate to `dyn {r | x: i64}` when the instantiation rules accept a dynamic package as a concrete instance. In the dynamic case, `v.x` uses dynamic adapter access instead of statically opening the payload.

For a function that explicitly takes `dyn {r | x: i64}`, concrete arguments are injected into boxed dynamic storage only because the expected type is already dynamic.

Therefore static row polymorphism does not imply implicit boxing everywhere. `dyn {r | ...}` is an already-dynamic package, reverse conversion from `dyn` to concrete nominal type is never automatic, and Core / CIR must distinguish `StaticRowAccess` from `DynRowAdapterAccess`.

## 6. 与名义类型的关系

`dyn` 不抹掉“同 shape 不同 nominal type”这个事实。

因此，从 dynamic 值回到某个具体名义类型时，默认不能只按 shape 猜测。

若需要回到具体名义类型，应通过显式 checked conversion 完成。

名义类型信息仍然可以被打包进 dynamic package，但它不是为了运行时全局找 impl，而是为了 cast、诊断与优化。

## 6. Relation to Nominal Types

`dyn` does not erase the fact that different nominal types may share the same shape.

Therefore, converting a dynamic value back to a concrete nominal type must not default to shape-based guessing alone. Returning to a concrete nominal type should happen through an explicit checked conversion.

Nominal type information may still be packaged into the dynamic package, but it is there for casts, diagnostics, and optimization rather than for runtime global impl lookup.

## 7. 非目标

下列内容不是本文当前目标：

- 规定具体 hidden class 结构
- 规定 inline cache 形式
- 规定 JIT / tracing 优化策略
- 用 `dyn` 取代静态 generic
- 把 `dyn` 解释成带运行时全局 impl 搜索的传统 interface object

## 7. Non-Goals

This document is not trying to specify a concrete hidden-class structure, a concrete inline-cache strategy, JIT or tracing policy, replace static generics with `dyn`, or reinterpret `dyn` as a traditional interface object with runtime global impl search.

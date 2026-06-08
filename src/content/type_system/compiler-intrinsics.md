# Compiler Intrinsics

## 目标

level-1 区分 compiler intrinsic、`std` helper 与普通用户函数。

intrinsic 必须拥有独立 namespace。`std` / `prelude` 只是 import layer，不拥有 intrinsic 语义。

## 语义

compiler intrinsic 是由编译器、类型检查与 lowering 共同承认的 operation。

它可以有用户可见 surface，但其语义来源不是普通库函数 body。

level-1 至少固定这些 intrinsic family：

- `unsafe_cast[T, F](self: T): F`
- `tuple_to_adt[Tuple, T](tuple): T`
- `adt_to_tuple[T, Tuple](value): Tuple`
- compiler-owned tuple type construction
- compiler-owned continuation/callable storage marker

## Namespace

intrinsic identity 形如：

```text
compiler_intrinsic::<name>#symbol_id
```

导入到 `std` 或 `prelude` 时，不改变 owner namespace。

错误消息可以显示用户友好的名字，但 typed/Core facts 必须保留 intrinsic owner。

## `unsafe_cast`

`unsafe_cast` 是 internal / compiler-only unsafe boundary。

它不应暴露成普通安全 `std` API，也不能被普通 overload 或 method lookup 替换。

即使有 surface spelling，typechecker 也必须把它识别为 intrinsic operation，并要求对应 unsafe context。

## ADT Tuple Bridge

`tuple_to_adt` / `adt_to_tuple` 是 bridge intrinsic。

它们必须参与：

- constructor identity checking
- tuple arity checking
- payload type checking
- exhaustiveness lowering
- bridge roundtrip validation

它们不是普通 helper；不能仅靠库层泛型模拟。

## Tuple Type

`Tuple[T1, T2, ...]` 的类型本体由编译器打洞和 lowering 承认。

用户层 `std` 可以提供方法或别名 surface，但不能伪装出真正的 tuple type system。

## 禁止事项

后续 pass 不得通过 intrinsic 名字字符串形状重新判断 intrinsic 语义。

合法做法是消费 parser/resolver 产生的 intrinsic symbol id、typed intrinsic kind 与 Core/CIR intrinsic facts。

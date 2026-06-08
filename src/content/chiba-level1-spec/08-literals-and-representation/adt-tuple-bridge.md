# ADT Tuple Bridge

## 目标

level-1 固定 ADT constructor 与 tuple representation 之间的语言级 bridge。

该 bridge 不是普通库函数模拟，而是 compiler intrinsic contract。

## 语义

对 constructor：

```chiba
data Error = {
	HttpError(i64, String)
}
```

构造值与 canonical tuple form 之间存在稳定对应：

```text
HttpError(400, "bad") <-> (:http_error, 400, "bad")
```

tuple form 的第一个字段是 constructor tag，后续字段按 constructor payload 顺序排列。tag 使用编译器确认的 constructor identity；debug dump 可以显示 atom-like tag，但 typed/core facts 必须保留 ADT constructor identity，而不是靠字符串重新解析。

## Intrinsic Surface

bridge 通过 compiler intrinsic 暴露：

```chiba
tuple_to_adt[Tuple, T](tuple): T
adt_to_tuple[T, Tuple](value): Tuple
```

它们可以拥有用户可见 surface，但语义来源是 compiler intrinsic namespace，不是普通 `std` helper。

typed 层必须保留：

- 这是 ADT bridge intrinsic。
- 来源 ADT type / constructor set。
- tuple arity 与 payload type。
- constructor tag identity。
- 双向 roundtrip obligation。

## Roundtrip

合法 bridge 必须满足：

```text
tuple_to_adt[Tup, T](adt_to_tuple[T, Tup](v)) == v
adt_to_tuple[T, Tup](tuple_to_adt[Tup, T](t)) == normalized(t)
```

`normalized(t)` 指 constructor tag 与 payload shape 通过 typecheck 后的 canonical tuple。

## 错误

下列情况必须拒绝：

- tuple tag 不对应目标 ADT 的 constructor。
- tuple arity 与 constructor payload arity 不一致。
- payload type 与 constructor field type 不一致。
- bridge 被当作普通函数绕过 exhaustiveness/typecheck。

## Lowering

Core/CIR 可以使用 ADT ctor fact 与 tuple fact 做 unify，但不得提前泄漏 Wasm-GC struct、WAT opcode 或 Binaryen layout。具体 layout 由 BIR/LIR/backend 消费 bridge facts 后决定。

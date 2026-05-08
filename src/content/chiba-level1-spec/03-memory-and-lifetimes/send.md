# `send` 标注

## 语法

`send` 表示某个值或类型可能跨 world 边界传递。

## 语义

`send` 不是普通类型别名，而是与并发安全和内存边界直接相关的能力判定。

level-1 中：

- `Ref[T]` 不 `send`
- `Array[T]` 没有 safe internal mutability，若 `T: send` 则 `Array[T]: send`
- `Ref[Array[T]]` 不 `send`
- `Array[Ref[T]]` 不 `send`
- Atomic capability 一律 `send`，但只能通过带 ordering 参数的 atomic API 读写
- `UnsafeRef[T]` 一律 `send`

`#[sync]` 暂不进入 level-1 首发；但 level-1 必须固定足够支撑并行编译的 `send` / world / Atomic 根规则。

## Usage

```chiba
def pass_ref(x: Ref[i32]): () = {
	return ()
}

def pass_unsafe_ref(x: UnsafeRef[i32]): () = {
	return ()
}
```

注释：`Ref` 与 `UnsafeRef` 在 level-1 中承载不同 world/transfer 能力，`send` 规则直接依附于这种区分。

```chiba
let xs: Array[i64] = [1, 2, 3]
// xs may cross a world boundary if i64 is send

let cells: Array[Ref[i64]] = ...
// cells may not cross a world boundary because Ref[i64] is !send
```

注释：`Array[T]` 的可发送性来自元素类型，而不是来自可变容器协议。

# `Ref[T]`

## 语法

`Ref[T]` 表示受控可变引用单元。

## 语义

`Ref[T]` 是显式可变性能力，不是普通字段或普通数据结构的默认表示。

它天然与 world / `send` 规则相关。

`Ref[T]` 是独立 capability 类型。

在 level-1 中，`Ref[T]` 天然 `!send`。

顶层 `Ref[T]` 允许存在，但必须显式写成 `#[world_local] def x: Ref[T] = expr`。这表示每个 world 一份 cell，不是 shared global mutable state。需要跨 world 共享的可变状态请使用 Atomic，或在 unsafe 边界中使用 `UnsafeRef[T]`。

`Ref[T]` 是 level-1 唯一 safe mutation 入口。`Ref` 标记的是 cell 可变性，而不是让 `T` 内部变成 mutable container。

因此：

- `Ref[T]` 支持 `expr := value`
- `Ref[Array[T]]` 支持替换整个 array value
- `Ref[Array[T]]` 不支持 `expr[idx] := value`
- `Array[Ref[T]]` 支持 `expr[idx] := value`，因为 index 结果本身是 `Ref[T]`
- `Ref[row]` 支持 `a.b := c`，其语义是 `a := { a.* | b: c }`

## Usage

```chiba
#[world_local]
def current_file: Ref[File] = Ref.new(open("/tmp/log", "rw"))

def inc(x: Ref[i32]): () = {
	x := x.* + 1
	return ()
}
```

注释：`Ref[T]` 表示受控可变单元；即使作为顶层 world-local binding，它也不自动获得跨 world 传递能力。

## 边界

创建、读、写的具体 surface API 可单独展开，但 `!send`、`:=` 作为 safe mutation 入口、以及 `Array[T]` 无 internal mutability 已是本层硬规则。

# `data`

## 语法

`data` 用于定义代数数据类型与构造子。

`data` 声明统一使用 `=`，与 `type` 的 surface 形状保持一致。

```chiba
data Option[T] = {
	Some(T)
	None
}
```

record-style `data` 也使用 `=`：

```chiba
data User = {
	id: UserId,
	name: String,
}
```

## 语义

`data` 引入：

- 一个类型名。
- 一组构造子或 record-style constructor。
- 对应的 pattern matching 入口。

在 level-1 中，普通 `data` 默认按 managed value 处理，而不是要求用户普遍书写 uniqueness 注解。

constructor 默认随 `data` 一起公开；若需要收窄，则通过 `private` 处理。

constructor 冲突默认允许通过裸名使用；发生冲突时，使用 `Type.Ctor` 消歧。

`data` 的 aggregate shape 必须能携带 usage color：

- 默认根据 payload / field / capability 与 escape 规则推导。
- `Cont1` payload 或 affine member 会影响 aggregate 的 `1` / `N` legality。
- `ContN`、function 与需要多路径共享的 closure/package 必须保留 `N` 信息。
- Rust reference lowering 中的 `Rc[T]` 是可视化审计证据；Chiba source 不必写 `Rc`，但 typed/lowered AST 必须能把对应 aggregate 显示为 `N T`。

## Usage

```chiba
data Option[T] = {
	Some(T)
	None
}

let x = Some(1)
let y = Option.None
```

注释：无冲突时允许裸 constructor；冲突时回到 `Type.Ctor` 路径。

## 边界

record-style `data` 与普通 constructor 风格都属于同一 `data` 体系；`let` 仍不接纳 refutable constructor destruct。

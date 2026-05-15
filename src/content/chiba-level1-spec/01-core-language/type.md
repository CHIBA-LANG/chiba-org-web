# `type`

## 语法

`type` 用于引入类型级名字，例如别名、名义 row 类型或将来更复杂的类型声明形式。

`type` 声明不使用 `=`。

```chiba
type UserId i64

type User {
	id: UserId,
	name: String,
}
```

field 位置的 `_ : T` 不是字段名，而是 phantom field。

## 语义

`type` 的核心作用是把某个类型表达式或类型定义绑定到一个稳定名称。

level-1 的 `type` 用于引入类型级名字；它不自动引入 constructor，也不承担 `data` 的模式匹配语义。

row-style `type` 是 nominal name over row shape：它有稳定的类型身份，但字段布局来自 row。两个 `type` 即使字段集合相同，也不是同一个 nominal type。

在 row-style `type` 中，`_ : T` 表示 phantom type/member marker：

- 不进入 ordinary field set
- 不参与 field access、record destruct、duplicate-field 检查或 row layout key
- 可以在同一个 `type` 中出现多次
- 只为类型检查、generic marker、ABI/representation witness 等编译期语义保留类型信息

如果需要在 C FFI 中表达真实 ABI 字段名为 `_` 的字段，不使用 `_ : T`。应使用普通 Chiba 字段名，并用 ABI 属性指定 C 字段名，例如：

```chiba
#![Metal]

#[repr("C")]
type CField {
	#[cname(field="_")]
	field: i32,
}
```

也就是说，surface name `field` 仍是 Chiba 侧可访问字段；`cname(field="_")` 只影响 C ABI 名字映射。

## Usage

```chiba
type UserId i64
type Name String

type User {
	id: UserId,
	name: Name,
	_: PhantomTag,
	_: OtherMarker,
}
```

注释：`type` 只绑定类型名；若需要构造子与 pattern matching，使用 `data` 而不是 `type`。

## 边界

更复杂的名义类型或别名细则可继续扩展，但 `type` 与 `data` 的职责分工在 level-1 中保持明确。

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

## 语义

`type` 的核心作用是把某个类型表达式或类型定义绑定到一个稳定名称。

level-1 的 `type` 用于引入类型级名字；它不自动引入 constructor，也不承担 `data` 的模式匹配语义。

row-style `type` 是 nominal name over row shape：它有稳定的类型身份，但字段布局来自 row。两个 `type` 即使字段集合相同，也不是同一个 nominal type。

## Usage

```chiba
type UserId i64
type Name String

type User {
	id: UserId,
	name: Name,
}
```

注释：`type` 只绑定类型名；若需要构造子与 pattern matching，使用 `data` 而不是 `type`。

## 边界

更复杂的名义类型或别名细则可继续扩展，但 `type` 与 `data` 的职责分工在 level-1 中保持明确。

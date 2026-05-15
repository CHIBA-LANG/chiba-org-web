# `union`

## 语法

`union` 用于声明联合类型或低级数据布局相关类型。

## 语义

其语义和 `data` 不同，通常更靠近显式布局、低级表示或 ABI 边界。

level-1 中，`union` 不作为普通业务建模工具，只保留给 `#![Metal]` 的低级表示与布局敏感场景。

普通 FFI surface 只承诺 struct。`union` 只有在 `#![Metal]` 中可用；普通非 `#![Metal]` 代码不能通过 `unsafe` 直接启用 `union`。

其布局方向与目标低级 ABI 保持一致，而不是走普通 `data` 的 managed value 路线。

## Usage

```chiba
#![Metal]

union Bits {
	u32v: u32,
	f32v: f32,
	_: LayoutMarker,
}
```

注释：`union` 是低级布局工具，不参与 `data` 的构造子与模式匹配语义。

`union` field 位置的 `_ : T` 与 `type` 中相同，是 phantom field，不是实际 union member 名：

- 不进入 ordinary union member set
- 不参与 duplicate-field 检查
- 可以重复出现
- 不代表 C ABI 中名为 `_` 的 union member

若 C union 真的有名为 `_` 的 member，使用普通 Chiba 字段名并通过 ABI 属性指定 C 名：

```chiba
#![Metal]

union CBits {
	#[cname(field="_")]
	field: u32,
}
```

## 边界

普通 level-1 代码应使用 `data`；普通 FFI 使用 `#[repr("C")] type` 表达 struct layout。只有 `#![Metal]` 模式拥有 `union`。

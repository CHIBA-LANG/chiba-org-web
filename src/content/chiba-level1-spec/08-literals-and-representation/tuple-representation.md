# Tuple Value Representation

## 语法

该条目不新增 surface syntax，描述 tuple 的值表示。

## 语义

tuple 是固定元数、固定顺序的聚合值；其运行时表示可与 record、ADT 或 asm 多输出语义关联。

tuple representation 必须保留元素顺序与固定元数信息；这使它既能支撑普通 tuple literal，也能支撑 asm 多输出与多返回值风格的值承载。

在类型与布局语义上，tuple 可视为 positional row-backed value。字段名固定为 `_1`、`_2`、`_3` ...，从 1 开始编号。

因此：

```text
(A, B, C) ~= { _1: A, _2: B, _3: C }
```

这里的 `~=` 表示布局与字段语义对应，不表示 tuple surface 语法等同于 record literal。tuple 的字段名由位置生成，用户不能重排，也不能用普通 record 字段顺序规则改变其元数和顺序。

一元 tuple `(a,)` 的唯一字段是 `_1`。空 tuple `()` 是 unit，不是带字段的 tuple。

## Usage

```chiba
let p = (1, 2)
let (a, b) = p
let first = p._1
let second = p._2
```

注释：tuple representation 首先服务普通 tuple 值；asm 或多返回值只是在语言层复用同一 tuple 语义。`p._1` / `p._2` 是位置字段访问，不是用户声明的 record 字段。

## 边界

小 tuple 的布局优化可由实现决定；但与 multi-return 的关系在语言层已固定为“复用同一 tuple 值语义”。优化不得改变 `_1`、`_2` ... 的位置字段语义。

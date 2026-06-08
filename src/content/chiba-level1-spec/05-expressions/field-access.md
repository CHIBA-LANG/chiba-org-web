# Field Access

## 语法

field access 使用点号语法。

## 语义

`v.x` 要求 `v` 的类型能统一到带有 `x` 字段的 open row。

field access 先于 method 名字解析生效；若同名字段与方法同时存在，字段优先。

这条优先级也适用于 `a.b(c)`：如果 `a` 是值表达式，且 `a` 的值类型拥有字段 `b`，则 `a.b(c)` 先解释为 `(a.b)(c)`。此时 `b` 的字段值必须是可调用值。

这条规则适用于 record 风格值，也适用于暴露字段面的名义类型。

## Usage

```chiba
let p = { x: 1, y: 2 }
let a = p.x
let r = p.f(1) // 若 p 有字段 f，则等价于 (p.f)(1)
```

注释：`v.x` 先尝试字段访问；只有字段不成立时，后续相关语法才会进入 method 路线。

## 边界

field access 与 method call 的冲突按“字段优先”处理；具体类型是 record 还是名义类型，不改变这一解析顺序。

row 约束在表达式层形成 member obligation，而不是立即选择某个 receiver method。

若推断得到 `{r | y: ty}`：

- `x.y` 在定义期记录成员 `y` 的访问 obligation。
- `x.y(args...)` 在 `ty` 可调用时记录 callable member obligation。
- 实例化到 record 或 nominal field 时，该 obligation 由字段兑现。
- 实例化到没有同名字段的 concrete nominal type 时，该 obligation 可由 receiver method adapter 兑现。

字段仍然优先。若 concrete nominal type 同时有字段 `y` 与 method `y`，则 `x.y(args...)` 先检查字段是否 callable 且签名匹配；字段不满足时直接报错，不能偷偷回退到同名 method。

这条规则不允许编译器在定义期靠 row fact 或 shape 猜 nominal identity。method adapter 只能在 concrete nominal receiver 已知，或 expected `dyn {r | ...}` package injection 需要构造 adapter 时选择。

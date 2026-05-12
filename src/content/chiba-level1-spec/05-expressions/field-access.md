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

row 约束只证明字段存在，不证明 nominal method 存在。若推断得到 `{r | y: ty}`，那么 `x.y` 是字段访问；`x.y(args...)` 只有在 `ty` 可调用时才走 field-callable 路线。这个 row fact 不能让编译器选择 `def X.y(self, ...)`。receiver method 仍必须依赖 concrete nominal receiver，或者在 generic body 中记录 method obligation，等实例化出 concrete nominal type 后再兑现。

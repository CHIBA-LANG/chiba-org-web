# Method Call

## 语法

method call 使用 `receiver.method(...)`。

## 语义

在 level-1 中，method call 基于 receiver 的 nominal type 解析，而不是基于 receiver shape，也不是基于 interface witness。

`a.b(c)` 同时可能表示 field callable、receiver method call 或 type-qualified callable。level-1 固定下面的解析顺序：

1. 若 `a` 是值表达式，且 `a` 的值类型拥有字段 `b`，则解释为 `(a.b)(c)`。
2. 否则，若 `typeof(a)` 的 nominal method set 中有方法 `b`，则解释为 `TypeOf(a).b(a, c)`。
3. 否则，若 `a` 是 type / namespace path，且 `a.b` 作为整体能解析到可调用项，则解释为 `(a.b)(c)`。

第 2 条是 receiver method lowering，会把 `a` 作为 self/receiver 传入。第 3 条不是 receiver method lowering；`a.b` 是一个整体 callee 名字，不先求值 `a`，也不自动插入 self。

## Usage

```chiba
let n = vec.len()
let f = vec.len
let x = f()
let y = Vec2.origin()
```

注释：若 `len` 同时可解释为 field 与 method，则 field callable 优先，即 `vec.len()` 先按 `(vec.len)()` 检查；只有字段不成立时才进入 receiver method lookup。`Vec2.origin()` 则是 type-qualified callee 调用，不把 `Vec2` 当成运行时 receiver。

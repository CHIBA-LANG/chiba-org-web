# Method Call Surface Syntax

## 语法

method call 使用 `receiver.method(args...)` 风格。

## 语义

在 level-1 中，它最终落到 nominal method resolution，而不是 structural method resolution，也不是 interface witness。

method call surface 等价于“先解析 receiver / member 名字，再形成标准 call”。

`a.b(c)` 的解析顺序固定为：

1. 若 `a` 是值表达式，且值类型有字段 `b`，则解释为 `(a.b)(c)`。
2. 否则，若 `typeof(a)` 的 nominal method set 中有方法 `b`，则解释为 `TypeOf(a).b(a, c)`。
3. 否则，若 `a` 是 type / namespace path，且 `a.b` 作为整体能解析到可调用项，则解释为 `(a.b)(c)`。

第 3 条与第 1 条不同：`a.b` 是一个整体名字，不先求值 `a`，也不注入 receiver。

receiver 不允许自动借用或自动解引用；因此 method resolution 只在显式 receiver type 上工作。若后续出现 `dyn` receiver，则调用依赖该 `dyn` 包中已经携带的 adapter，而不是回退到普通 nominal lookup。

## Usage

```chiba
let n = text.len()
let q = vec.push(1)
let x = row.handler(arg) // field callable: (row.handler)(arg)
let y = Vec2.origin()    // type-qualified callable: (Vec2.origin)()
```

注释：`receiver.method(args...)` 是标准 surface；但不会偷偷做 auto-borrow / auto-deref，也不会因为 shape 相同就跨 nominal type 借用方法。

## 边界

field 名冲突按既定规则优先于 method 名字解析。若左侧可同时作为值名与 type / namespace path 解析，表达式位置优先尝试值路径；需要类型路径时应通过 namespace / type path 解析规则消除歧义。

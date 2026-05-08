# Method Resolution

## 语法

该条目描述 method lookup 规则，不新增 surface syntax。

## 语义

解析需要结合：

- 方法名
- receiver nominal type
- concrete instantiation
- overload 候选

level-1 采用 nominal world 内的最佳候选规则。

Method resolution 只在 field callable 路线失败后进入。对 `a.b(c)` 而言：

- `a` 是值且有字段 `b`：选择 field callable，形成 `(a.b)(c)`
- `a` 是值且没有字段 `b`，但 `typeof(a)` 有 nominal method `b`：选择 receiver method，形成 `TypeOf(a).b(a, c)`
- `a` 是 type / namespace path，且 `a.b` 是可调用项：选择 qualified callee，形成 `(a.b)(c)`

Qualified callee 不属于 receiver method resolution；它解析的是 `a.b` 这个整体名字。

若多个候选都可用，但不存在唯一的最具体候选，则应报歧义错误，而不是按“后定义覆盖前定义”之类的顺序规则偷偷吞掉冲突。

这是一条 level-1 规则：方法解析必须保持局部、可缓存、且不依赖导入顺序或文件内书写顺序。

## Usage

```chiba
def Vec2.show(self): String = format_vec2(self)

let s = v.show()
let f = Vec2.show
```

注释：`v.show()` 依赖 `v` 的 nominal receiver type 与当前 concrete instantiation，并 lower 成 `Vec2.show(v)` 一类调用。`Vec2.show` 本身则是 qualified callee 名字，可作为函数值被引用；它不求值一个名为 `Vec2` 的 receiver。

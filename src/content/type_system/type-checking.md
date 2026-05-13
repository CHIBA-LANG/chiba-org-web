# Chiba Type Checking Notes

本文记录 level-1 与 level-2 type checking 的分界。这里的规则补充 `typesystem.md`、`generics.md`、`rows.md` 与 method/operator 文档。

## Level-1: rigid explicit generic + flexible inference

level-1 中，源码显式写出的 `[T]` 是 rigid generic binder。函数体检查时不能把它当作可以随意解开的 inference hole。

省略类型标注时，checker 使用 flexible inference variable：

```chiba
def id(x) = x
```

这里的 `x` 先获得 flexible variable。若函数边界处它仍然可合法泛化，则变成 synthetic generic binder。

但 flexible variable 不是 `Any`。如果某个变量落在必须具体化的位置，或落在不能自由泛化的位置，则需要显式标注。

例如：

```chiba
let r = Ref.new(None)
```

`None` 的类型是 `Option[T]`，所以该表达式形状是 `Ref[Option[T]]`。如果没有标注或上下文固定 `T`，这里必须报错，而不是泛化成 polymorphic mutable `Ref`。

## Level-2: explicit flexible generic

level-2 可以加入显式 flexible generic binder：

```chiba
def f[?T](value: ?T) = ...
```

`?T` 表示源码显式要求该变量按 flexible inference variable 参与定义期推断。它不同于 `[T]`：`[T]` 是 rigid abstract type，`[?T]` 是 level-2 的显式 flexible binder。

level-1 不要求实现 `[?T]`，但 type checker 设计应给它保留位置。

## Row fact 与 method

row fact 只证明字段存在，不证明 nominal method 存在。

```text
{r | y: ty}
```

只能支持 `x.y` 的字段访问。如果 `ty` 是函数类型，也可以支持 `x.y(args...)` 的 field-callable 路线。但它不能支持 `def X.y(self, ...)` 的 receiver method 选择。

若要从 row-shaped value 进入 nominal method world，必须先通过显式 cast / checked conversion 得到 concrete nominal type。

## Operator obligation

抽象 operator 不应默认成数值类型。

```chiba
def add(a, b) = a + b
```

在没有 concrete numeric 约束时，应泛化为 operator contract，形状类似：

```chiba
def add[T: {t | op_add: (Self, Self) => Self}](a: T, b: T): T =
    a.op_add(b)
```

这里的 `op_add` 是 operator protocol obligation 的名字，不是普通 row fact 直接调用 nominal method。具体实现仍必须在实例化时通过 concrete nominal type、显式 cast、或显式 behavior source 兑现。

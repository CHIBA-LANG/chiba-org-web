# `:=` 与 Ref 相关语义

## 语法

`:=` 预留给引用单元或位置更新类语义。

## 语义

它是对 `Ref[T]` 可写 cell 的赋值，而不是普通绑定，也不是让普通 container 获得 internal mutability。

核心规则是：

```text
lhs : Ref[T]
rhs : T
----------------
lhs := rhs : T
```

若左侧不是 `Ref[T]`，则 `:=` 不合法。

level-1 规定 `:=` 的结果值是右侧表达式的值。

因此：

```chiba
x := y
```

在更新左侧位置之后，整个表达式求值为 `y` 的结果值。

这使 `:=` 可以参与链式表达：

```chiba
a := b := c
```

level-1 当前方向把 `:=` 置于倒数第二弱优先级。

也就是说：

- `:=` 比 `|>` 更弱
- `:=` 只强于最外层的 `=` 绑定/定义语法

`=` 本身不作为普通 operator 进入表达式运算符体系。

`:=` 的链式写法按右结合理解：

```chiba
a := (b := c)
```

### Field assignment

`a.b := c` 只有两类合法来源：

1. `a : Ref[row]`，此时它是 whole-value update + writeback 的语法糖：

```chiba
a := { a.* | b: c }
```

2. `a.b : Ref[T]`，此时它只是普通 `Ref[T]` assignment。

若 `a` 是普通 row value 且 `a.b` 不是 `Ref[T]`，则 `a.b := c` 不合法。

### Index assignment

`expr[idx] := value` 不表示 array element mutation。它只在 `expr[idx] : Ref[T]` 时合法。

因此：

- `Array[T]` 的 `xs[idx] := value` 不合法
- `Ref[Array[T]]` 的 `xs[idx] := value` 不合法
- `Array[Ref[T]]` 的 `xs[idx] := value` 合法
- `Ref[Array[Ref[T]]]` 需要显式 `xs.*[idx] := value`

## Usage

```chiba
cell := 1

let x = a := b := c

row_ref.name := "new"

cells[0] := 42
```

注释：第一行展示 `:=` 用于更新位置，第二行展示它返回右值，因此可以参与链式表达。

## 边界

需要后续继续明确左值求值与右结合更新的精确求值顺序。推荐方向是先求左侧可写 cell，再求右侧值，再写入，并返回右侧值。

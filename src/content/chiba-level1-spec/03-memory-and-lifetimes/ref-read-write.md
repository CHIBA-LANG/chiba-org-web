# `Ref[T]` 的读写与受控可变性

## 语法

该条目描述 `Ref[T]` 的 surface 读写操作与方法面。

## 语义

`Ref[T]` 应明确区分：

- 读取当前值
- 覆写当前值
- 可变性是否需要线性或单线程约束

level-1 中，`Ref[T]` 的读写属于受控可变性操作；它不是普通值解构，也不是裸指针写内存。

`Ref[T]` 的 surface 可通过既定方法面或赋值协议暴露，但其核心语义始终是“在单 world 内读/写一个受控 cell”。

level-1 采用赋值协议作为核心规则：

```text
lhs : Ref[T]
rhs : T
----------------
lhs := rhs : T
```

`:=` 更新左侧 cell 后返回右侧值，因此允许右结合 chain。

字段更新不是普通 record 的 internal mutability。若 `a : Ref[row]`，则：

```chiba
a.b := c
```

语义等价于：

```chiba
a := { a.* | b: c }
```

实现可以在 uniqueness / escape 允许时把它 lower 成 inplace update，但规范语义是 whole-value replacement。

下标更新也不让 `Array[T]` 获得 internal mutability。`expr[idx] := value` 只有在 `expr[idx] : Ref[T]` 时合法。

因此：

```chiba
let xs: Ref[Array[i64]] = cell
// xs[0] := 1    // error
xs := array_set(xs.*, 0, 1)

let cells: Array[Ref[i64]] = ...
cells[0] := 1    // ok
```

## Usage

```chiba
let r: Ref[i32] = cell
let x = r.*
r := x + 1
```

注释：这里的 `get` / `set` 只是说明读写是显式受控操作；具体 surface 可继续细化，但不能把 `Ref` 降格成普通值或裸地址。

## 边界

读写表面可以继续补充方法形式，但不改变 `Ref[T]` 的单 world 受控可变性定位，也不改变 `Array[T]` 无 safe internal mutability 的规则。

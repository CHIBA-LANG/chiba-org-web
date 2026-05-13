# 算术运算

## 语法

当前至少包括：

- `+`
- `-`
- `*`
- `/`
- `%`

## 语义

算术运算作用于数值类型，并可参与 operator overloading。

当操作数已经是 concrete numeric type 时，`+`、`-`、`*`、`/`、`%` 按数值运算检查。

当操作数仍是抽象类型时，type checker 不应直接默认成 `i64`。例如：

```chiba
def add(a, b) = a + b
```

应生成 `op_add` obligation，并在同类型参数场景下泛化为类似：

```chiba
def add[T: {t | op_add: fn(Self, Self): Self}](a: T, b: T): T
```

具体 `op_add` 实现只在 concrete instantiation / explicit behavior source / checked nominal conversion 后确定。

## Usage

```chiba
let x = 1 + 2 * 3
let y = x % 4
```

注释：这个例子覆盖了加、乘、取模的最基本表面，强调它们首先是数值运算，再谈 overload 扩展。

## 边界

需要单独明确：

- 整数与未来浮点的统一规则
- operator overload 的候选筛选

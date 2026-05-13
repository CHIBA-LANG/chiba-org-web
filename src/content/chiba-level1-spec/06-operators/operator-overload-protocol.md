# Operator Overload Protocol

## 语法

level-1 当前方向需要覆盖：

- infix
- prefix
- postfix
- `.*`

## 语义

operator overloading 属于 level-1 的 method / obligation 系统一部分。它不依赖 interface witness，也不依赖运行时 impl 搜索；候选解析仍然应在 nominal world、explicit behavior source 与 concrete instantiation 上完成。

抽象 operator 不应默认到数值类型。例如：

```chiba
def add(a, b) = a + b
```

如果 `a`、`b` 没有被 concrete numeric 上下文约束，那么定义期应生成 operator obligation，并泛化成类似：

```chiba
def add[T: {t | op_add: (Self, Self) => Self}](a: T, b: T): T =
    a.op_add(b)
```

这里的 `op_add` 是 operator protocol entry，不是普通 row fact 直接调用 nominal method。row fact 不证明 `def X.op_add` 存在；具体实现必须在实例化时由 concrete nominal type、显式 cast / checked conversion，或显式 behavior source 兑现。

## Usage

```chiba
let c = a + b
let d = value.*.field
```

注释：这个例子同时提示 infix 和 postfix operator surface 都需要落到统一 overload protocol，而不是各自走完全不同的分派故事。

## 边界

需要单独明确：

- 运算符名如何编码到方法命名空间
- 候选冲突如何报错
- `op_*` contract 如何进入 specialization key

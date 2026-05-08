# Operator Overload Protocol

## 语法

level-1 当前方向需要覆盖：

- infix
- prefix
- postfix
- `.*`

## 语义

operator overloading 属于 level-1 的 method / obligation 系统一部分。它不依赖 interface witness，也不依赖运行时 impl 搜索；候选解析仍然应在 nominal world 与 concrete instantiation 上完成。

## Usage

```chiba
let c = a + b
let d = value.*field
```

注释：这个例子同时提示 infix 和 postfix operator surface 都需要落到统一 overload protocol，而不是各自走完全不同的分派故事。

## 边界

需要单独明确：

- 运算符名如何编码到方法命名空间
- 候选冲突如何报错

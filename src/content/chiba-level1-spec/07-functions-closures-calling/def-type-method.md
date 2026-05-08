# `def Type.method(...)`

## 语法

该条目描述 method-style 定义在函数系统中的位置。

## 语义

它把顶层定义和 receiver 的 nominal type 绑定起来，最终进入该 nominal type 参与的方法解析表。

## 边界

需要单独明确：

- `Type` 是否永远保持 nominal-only receiver
- 与普通同名顶层函数的冲突

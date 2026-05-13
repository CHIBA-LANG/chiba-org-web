# Operator Overload 与 Method 的关系

## 语法

该条目描述运算符重载与方法系统的统一模型。

## 语义

当前方向是把 operator overload 看作 method / obligation 系统的一部分，只是 surface syntax 不同。

因此，运算符协议与普通方法共享 nominal implementation world、namespace / behavior source 与 specialization 基础设施；差别在 surface token、operator protocol entry 和调用糖上。

对抽象参数，operator 先表现为 structural operator obligation，而不是直接默认到某个 concrete numeric type。例如 `a + b` 可以生成 `op_add` obligation；当 `a`、`b` 是同一抽象类型时，默认 contract 类似 `T: {t | op_add: (Self, Self) => Self}`。

这不是普通 row fact 直接进入 receiver method resolution。`op_add` 的具体实现仍由 concrete nominal type、显式 cast / checked conversion，或显式 behavior source 在实例化时决定。

## Usage

```chiba
def Vec2.add(self: Vec2, rhs: Vec2): Vec2 = {
	...
}
```

注释：运算符重载不是另一套独立系统；它只是方法协议在运算符表面上的投影。

## 边界

运算符协议与普通方法共享同一 nominal implementation world，但 operator obligation 不是 field access，也不是 row fact 证明 nominal method。更细的命名冲突、`op_*` 编码和 specialization key 细则可在 operator 文档继续补充。

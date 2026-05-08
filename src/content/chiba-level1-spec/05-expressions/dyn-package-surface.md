# Dynamic Package Surface

## 语法

level-1 预留并逐步收敛下面两种 `dyn` surface：

```chiba
dyn Constraint
dyn {r | ...}
```

二者都表示 dynamic package，而不是两套完全不同的动态类型机制。

## 语义

`dyn` 的核心规则是：进入动态世界的值，总是和 adapter 一起打包。

这意味着：

- `dyn Constraint` 表示值满足某个 named constraint，并携带服务该 constraint 的 adapter
- `dyn {r | ...}` 表示值满足某个 row contract，并携带服务该 contract 的 adapter
- level-1 不做运行时全局 impl 搜索
- `dyn` 调用不回退到普通 nominal method lookup

当上下文已经期望某个 `dyn` 类型时，静态值若能在当前检查点证明满足对应 contract，则允许自动注入为 dynamic package。

这条自动注入只在 expected-type 已经是某个 `dyn` contract 时触发；它不是任意位置的隐式提升。

自动注入发生时，编译器必须同时构造：

- 运行时值
- 对应 contract 的 adapter
- 必要的 nominal identity / cast metadata

反过来，从 `dyn` 回到具体 nominal type 不能自动发生，必须显式 checked conversion。

该 checked conversion 不应和普通 `as` 混用。`as` 负责显式 conversion / reinterpret boundary；`dyn` 回到具体 nominal type 的失败路径则应拥有单独 surface。

## Usage

```chiba
def render(v: dyn ToString): String = v.toString()

def get_name(v: dyn {r | name: String}): String = v.name
```

注释：`v.toString()` 依赖的是打包进 `dyn ToString` 的 adapter，而不是运行时全局查找一个 `ToString` 实现；`v.name` 则依赖 `dyn {r | name: String}` 携带的 contract 与 adapter。

同样地，把某个 `user_dyn` 还原成 `User` 时，应该使用显式 checked conversion，而不是写成普通 `as` 并把失败语义藏起来。

## 边界

需要单独明确：

- `dyn Constraint` 与 named constraint 展开的精确对应关系
- `dyn {r | ...}` 允许哪些 field / method surface
- `T -> dyn C` 的自动注入发生在什么 expected-type 边界
- `dyn C -> T` 的 checked conversion surface 如何写
- checked conversion 失败时返回什么结果形态
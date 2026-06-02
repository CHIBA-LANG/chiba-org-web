# Delimited Continuation 的正式语义

## 语法

该条目讨论 `reset` / `resetn` / `shift` 的正式类型与 continuation 语义。

## 语义

level-1 首发至少需要 answer type checking 与 usage color checking。

本层只保留 delimited continuation 的最小正式语义：

- `reset` / `resetn` / `shift` 的 answer type checking。
- `reset` 下 `shift` 捕获 `Cont1`，usage color 为 `1`。
- `resetn` 下 `shift` 捕获 `ContN`，usage color 为 `N`。
- continuation 捕获与恢复的基本合法性。
- `ContN` replay-safety。
- 与 arena / world / escape 规则的交叉约束。

## Usage

```chiba
let result = reset {
	1 + shift k {
		k(41)
	}
}
```

注释：这里 `shift` 捕获的是“把结果再加上 1”的 single-shot 剩余控制上下文，因此 continuation 是 `Cont1`，不是普通闭包语法糖。

```chiba
let retry = resetn {
	shift k {
		k(1)
		k(2)
	}
}
```

注释：这里 `resetn` 让同一个 `shift` 捕获 multi-shot continuation，因此 `k` 是 `ContN`。

## 边界

level-1 不引入单独的 effect system；`reset` / `resetn` / `shift` 的约束全部直接写在 continuation、answer type、usage color 与 memory legality 规则里。

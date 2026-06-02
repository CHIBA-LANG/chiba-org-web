# `reset` / `resetn` / `shift` 的 Answer Type Checking

## 语法

该条目描述 `reset` / `resetn` / `shift` 的类型检查规则，而不是新增语法。

## 语义

level-1 至少需要保证：

- 每个 `reset` / `resetn` 在确定的 answer type 下检查。
- `shift` body 与 surrounding delimiter 的 answer type 一致。
- continuation 恢复要求 answer type 一致。
- `reset` 捕获出的 `Cont1` 最多恢复一次。
- `resetn` 捕获出的 `ContN` 可以重复恢复，但必须满足 replay-safety。

## Usage

```chiba
let x = reset {
	shift k {
		k(1)
	}
}
```

注释：这个例子要求整个 `reset` 以整数 answer type 检查，因为 `k(1)` 恢复后得到的结果就是整个 `reset` 的结果。`k` 是 `Cont1`。

```chiba
let retry = resetn {
	shift k {
		let a = k(1)
		k(a)
	}
}
```

注释：这个例子要求整个 `resetn` 以同一个 answer type 检查。`k` 是 `ContN`，因此可以重复恢复，但捕获内容必须通过 replay-safety 检查。

```chiba
let bad = reset {
	shift k {
		k(1)
		return "oops"
	}
}
```

注释：这个例子展示 answer type 不一致的情况。若 continuation 恢复路径产出整数，而 `shift` body 另一条路径产出字符串，则应在类型检查阶段拒绝。

## 边界

需要单独明确：

- continuation type surface syntax。
- checked template × continuation 的交叉限制。
- `resetn` replay-safety 与 `Ref[T]` shared-reference capture 规则。

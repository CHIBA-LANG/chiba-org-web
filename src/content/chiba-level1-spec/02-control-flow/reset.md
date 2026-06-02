# `reset` / `resetn`

## 语法

`reset` 与 `resetn` 都建立 delimited continuation 边界。

```chiba
reset {
	...
}

resetn {
	...
}
```

二者都允许带 atom tag：

```chiba
reset :tag {
	...
}

resetn :tag {
	...
}
```

与之配套的 `shift` surface 采用 block 形式，而不是箭头 lambda 形式：

```chiba
shift k {
	...
}

shift :tag k {
	...
}
```

## 语义

在 level-1 中，`reset` / `resetn` 同时具有：

- 控制边界语义。
- answer type 边界。
- arena / region 边界。
- continuation usage color 边界。

区别是：

- `reset` 是 single-shot / affine delimiter；其中的 `shift` 捕获 `Cont1`，usage color 为 `1`。
- `resetn` 是 multi-shot / repeatable delimiter；其中的 `shift` 捕获 `ContN`，usage color 为 `N`。

tagged delimiter 为后续需要显式指向某个控制边界的控制操作保留稳定命名入口。`shift :tag k { ... }` 会查找匹配 tag 的 `reset` 或 `resetn`，并继承该 delimiter 的 continuation kind。

## Usage

```chiba
let value = reset {
	1 + 2
}
```

注释：最简单的 `reset` 只是显式建立一个 single-shot 控制边界，整个 block 的结果就是 `reset` 表达式的结果。

```chiba
let value = reset {
	1 + shift k {
		k(41)
	}
}
```

注释：这个例子展示 `reset` 为 `shift` 提供最近的 single-shot 捕获边界，`k` 的类型是 `Cont1`。

```chiba
let retry = resetn :parse {
	shift :parse k {
		k(1)
		k(2)
	}
}
```

注释：`resetn` 建立 multi-shot 捕获边界，`k` 的类型是 `ContN`，因此可以重复恢复。

## 边界

需要单独明确：

- `resetn` 的 replay-safety 检查。
- 与普通函数调用隐式 `reset` 的关系。
- `reset` / `resetn` 与 arena promotion / escape legality 的交叉规则。

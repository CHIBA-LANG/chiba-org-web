# `shift`

## 语法

`shift` 从最近的 `reset` 捕获 continuation。

当前 one-shot surface syntax 为：

```chiba
shift k {
	...
}
```

若需要显式指定目标 `reset` tag，则写成：

```chiba
shift :tag k {
	...
}
```

multi-shot continuation 使用 `shiftn`：

```chiba
shiftn k {
	...
}
```

带 tag 时写成：

```chiba
shiftn :tag k {
	...
}
```

## 语义

捕获出的 continuation 不是普通函数的平凡别名；它携带 answer type 与控制上下文信息。

`shift` / `shiftn` 捕获出的 continuation 在类型层区分：

- `Cont1[A, B]`：one-shot continuation，最多恢复一次。
- `ContN[A, B]`：multi-shot continuation，可以重复恢复。
- `cont1 (A) -> B`：`Cont1[A, B]` 的类型糖。
- `contN (A) -> B`：`ContN[A, B]` 的类型糖。

其中 `A` 是 resume input type，`B` 是当前 `reset` 的 answer type。

`shift` 总是捕获 `Cont1[A, B]`。它不会因为 escape 或 storage 自动升级成 `ContN[A, B]`。若用户需要 multi-shot continuation，必须写 `shiftn`。

`shiftn` 总是捕获 `ContN[A, B]`。它要求 lowering 构造可重复恢复的 control frame/spine。

非逃逸且静态 exactly-once 的 `Cont1` 必须由 backend 优化成 direct resume、tail jump 或 inline continuation，不得分配 continuation package。若 `Cont1` 逃逸到 `(A) -> B` storage、closure env、record/tuple/ADT member 等可别名位置，则必须 boxed 成 one-shot state machine；第一次调用 consume，重复调用是运行时错误。

`ContN` 可以重复恢复。若捕获 `Ref[T]`，采用 shared-reference 语义：捕获的是同一个 cell 引用，不做 snapshot、copy 或 rollback。

## Usage

```chiba
let value = reset {
	1 + shift k {
		k(41)
	}
}
```

注释：这里 `shift` 捕获的是“加 1 之后返回”的 continuation，所以恢复 `k(41)` 后整个 `reset` 结果为 `42`。

```chiba
let value = reset {
	shift k {
		0
	}
}
```

注释：第二个例子展示 `shift` body 也可以选择不恢复 continuation，而是直接给出整个 `reset` 的结果。

```chiba
let retry = reset {
	shiftn k {
		k(1)
		k(2)
	}
}
```

注释：这里 `shiftn` 明确捕获 multi-shot continuation，因此 `k` 的类型是 `contN (i64) -> Answer` 的形态。

## 边界

`shift` / `shiftn` body 必须在 surrounding `reset` 的 answer type 下检查。continuation 默认 `!send`，不得跨非法 world boundary。若 continuation 进入参数位置的 `(A) -> B`，按 callable shape / checked-template obligation 实例化；若进入存储位置的 `(A) -> B`，则 lower 成 erased callable ADT variant。若存储类型显式写成 `cont1 (A) -> B` 或 `contN (A) -> B`，则分别 lower 成 boxed one-shot state machine 或 multi-shot continuation package。

# `shift`

## 语法

`shift` 从最近的 `reset` 捕获 continuation。

当前 surface syntax 为：

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

## 语义

捕获出的 continuation 不是普通函数的平凡别名；它携带 answer type 与控制上下文信息。

`shift` 捕获出的 continuation 在类型层至少区分：

- `Cont1[A, B]`：one-shot continuation，最多恢复一次。
- `ContN[A, B]`：multi-shot continuation，可以重复恢复。

其中 `A` 是 resume input type，`B` 是当前 `reset` 的 answer type。

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

## 边界

`shift` body 必须在 surrounding `reset` 的 answer type 下检查。continuation 默认 `!send`，不得跨非法 world boundary。若 continuation 进入参数位置的 `(A) -> B`，按 callable shape / checked-template obligation 实例化；若进入存储位置的 `(A) -> B`，则 lower 成 erased callable ADT variant。

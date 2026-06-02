# `shift`

## 语法

`shift` 从最近的 `reset` 或 `resetn` 捕获 continuation。

surface syntax 为：

```chiba
shift k {
	...
}
```

若需要显式指定目标 delimiter tag，则写成：

```chiba
shift :tag k {
	...
}
```

`shift` 本身不区分 one-shot / multi-shot。continuation kind 由目标 delimiter 决定：

- 最近匹配边界是 `reset` 时，`shift` 捕获 `Cont1[A, B]`。
- 最近匹配边界是 `resetn` 时，`shift` 捕获 `ContN[A, B]`。

旧方向中的 `shiftn` 不再是 primary surface。需要 multi-shot continuation 时，用户应使用 `resetn { shift k { ... } }`。

## 语义

捕获出的 continuation 不是普通函数的平凡别名；它携带 answer type、控制上下文、来源 delimiter 与 usage color。

类型层区分：

- `Cont1[A, B]`：one-shot continuation，最多恢复一次，usage color 为 `1`。
- `ContN[A, B]`：multi-shot continuation，可以重复恢复，usage color 为 `N`。
- `cont1 (A) -> B`：`Cont1[A, B]` 的类型糖。
- `contN (A) -> B`：`ContN[A, B]` 的类型糖。

其中 `A` 是 resume input type，`B` 是当前 delimiter 的 answer type。

`shift` 不会因为 escape 或 storage 自动把 `Cont1[A, B]` 升级成 `ContN[A, B]`。若用户需要 multi-shot continuation，必须把捕获放在 `resetn` 边界内。

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

注释：这里 `shift` 捕获的是 `Cont1`，也就是“加 1 之后返回”的 single-shot continuation，所以恢复 `k(41)` 后整个 `reset` 结果为 `42`。

```chiba
let value = reset {
	shift k {
		0
	}
}
```

注释：`shift` body 也可以选择不恢复 continuation，而是直接给出整个 `reset` 的结果。

```chiba
let retry = resetn {
	shift k {
		k(1)
		k(2)
	}
}
```

注释：这里 `resetn` 明确建立 multi-shot delimiter，因此 `shift` 捕获的 `k` 类型是 `contN (i64) -> Answer` 的形态。

## 边界

`shift` body 必须在 surrounding `reset` / `resetn` 的 answer type 下检查。continuation 默认 `!send`，不得跨非法 world boundary。若 continuation 进入参数位置的 `(A) -> B`，按 callable shape / checked-template obligation 实例化；若进入存储位置的 `(A) -> B`，则 lower 成 erased callable ADT variant。若存储类型显式写成 `cont1 (A) -> B` 或 `contN (A) -> B`，则分别 lower 成 boxed one-shot state machine 或 multi-shot continuation package。

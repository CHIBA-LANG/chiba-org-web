# Atomic capability

## 语法

Atomic 首发可以使用统一形式：

```chiba
Atomic[T]
```

但 type checker 只接受有限的 `T`。

## 语义

Atomic 是 level-1 为 world 并行模型保留的最小 shared mutation capability。

普通值没有 safe internal mutability，`Array[T]` 也没有 safe internal mutability；`Ref[T]` 是 safe local mutation 入口，但默认 `!send`。

Atomic 的定位不同：

- Atomic 默认 `send`
- Atomic 可跨 world 共享
- Atomic 内部可变性只能通过 atomic API 发生
- Atomic 不参与普通 method/interface/`via` 证明

首发支持类型建议限制为：

- `i32`
- `i64`
- `usize`
- `bool`
- `Ptr[T]`

## Ordering

首发暴露 ordering，集合接近 Rust：

- `Relaxed`
- `Acquire`
- `Release`
- `AcqRel`
- `SeqCst`

Ordering 是每个 atomic 操作的显式参数。

基本合法性：

- `load` 不能使用 `Release` / `AcqRel`
- `store` 不能使用 `Acquire` / `AcqRel`
- read-modify-write 操作可使用所有 ordering
- `compare_exchange` / `compare_exchange_weak` 使用 success ordering 与 failure ordering
- failure ordering 只能是 `Relaxed` / `Acquire` / `SeqCst`
- failure ordering 不能强于 success ordering

## Usage

```chiba
let counter = Atomic.new(0usize)
let old = Atomic.fetch_add(counter, 1usize, SeqCst)
let now = Atomic.load(counter, Acquire)
```

注释：Atomic 可以作为并行 work queue、intern table、specialization registry 等运行时/编译器内部结构的最小同步基础。

## API shape

Atomic 接口参考 Rust：

```chiba
Atomic.new(v)
Atomic.load(a, order)
Atomic.store(a, v, order)
Atomic.swap(a, v, order)
Atomic.compare_exchange(a, current, new, success_order, failure_order)
Atomic.compare_exchange_weak(a, current, new, success_order, failure_order)
Atomic.fetch_add(a, v, order)
Atomic.fetch_sub(a, v, order)
Atomic.fetch_and(a, v, order)
Atomic.fetch_or(a, v, order)
Atomic.fetch_xor(a, v, order)
Atomic.fetch_min(a, v, order)
Atomic.fetch_max(a, v, order)
```

其中 `fetch_add/sub/min/max` 只对整数与 `usize` 开放；`Atomic[bool]` 支持 `fetch_and/or/xor`；`Atomic[Ptr[T]]` 首发只要求 load/store/swap/compare_exchange。

## 边界

Atomic 不支持任意 `Atomic[Record]` / `Atomic[Array[T]]`；也不会把 `Ref[T]` 转换成可跨 world 的安全共享引用。

更完整的 lock-free 保证、shared collection 与同步抽象可以后续扩展，但不能改变 Atomic 作为显式 shared mutation capability 的根规则。
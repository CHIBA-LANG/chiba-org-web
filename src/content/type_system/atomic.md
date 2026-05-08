# Chiba Level 1 Atomic Capability Spec

## 0. 范围

本文规定 level-1 首发 Atomic 能力的最小语义。

Atomic 的目标不是一次性提供完整并发内存模型，而是确保 level-1 在明确 `send` / world 模型时有一个可用的跨 world shared mutation 原语。

## 1. 基本规则

普通值没有 safe internal mutability，`Array[T]` 也没有 safe internal mutability。

`Ref[T]` 是 safe local mutation，但默认 `!send`，不能跨 world。

Atomic capability 是 level-1 的显式 shared mutation 入口：

- Atomic 值默认 `send`
- Atomic 值可以跨 world 共享
- Atomic 内部可变性只能通过 atomic API 发生
- Atomic 不参与 method/interface/`via` witness 世界

## 2. 支持类型

首发可以限制 `Atomic[T]` 的 `T`：

- `i32`
- `i64`
- `usize`
- `bool`
- `Ptr[U]`

不支持任意 `Atomic[Record]`、`Atomic[Array[T]]` 或 `Atomic[data]`。

## 3. Ordering

Atomic API 首发就暴露 ordering。

level-1 采用接近 Rust 的 ordering 集合：

- `Relaxed`
- `Acquire`
- `Release`
- `AcqRel`
- `SeqCst`

Ordering 是 atomic 操作的显式参数，不是全局编译选项，也不是 `send` capability 的一部分。

基本合法性沿用 Rust 风格的约束：

- `load` 不能使用 `Release` / `AcqRel`
- `store` 不能使用 `Acquire` / `AcqRel`
- read-modify-write 操作可使用 `Relaxed` / `Acquire` / `Release` / `AcqRel` / `SeqCst`
- `compare_exchange` 需要 success ordering 与 failure ordering
- failure ordering 只能是 `Relaxed` / `Acquire` / `SeqCst`
- failure ordering 不能强于 success ordering

## 4. Rust-style API

Atomic 接口参考 Rust 的 atomic primitive 设计，但 level-1 首发可以只覆盖有限类型。

### 4.1 Constructors and basic access

```chiba
Atomic.new(v)
Atomic.load(a, order)
Atomic.store(a, v, order)
Atomic.swap(a, v, order)
```

### 4.2 Compare exchange

```chiba
Atomic.compare_exchange(a, current, new, success_order, failure_order)
Atomic.compare_exchange_weak(a, current, new, success_order, failure_order)
```

返回值应表达成功/失败与观察到的旧值。具体 surface 可采用 `Result[T, T]`、`Option[T]` 或专用 ADT，但语义应接近 Rust：成功返回写入前的旧值，失败返回实际观察到的值。

### 4.3 Arithmetic fetch operations

整数与 `usize` atomic 支持：

```chiba
Atomic.fetch_add(a, v, order)
Atomic.fetch_sub(a, v, order)
```

### 4.4 Bitwise fetch operations

整数、`usize`、`bool` 可支持相应 bitwise 操作：

```chiba
Atomic.fetch_and(a, v, order)
Atomic.fetch_or(a, v, order)
Atomic.fetch_xor(a, v, order)
```

### 4.5 Min/max fetch operations

整数与 `usize` 可支持：

```chiba
Atomic.fetch_min(a, v, order)
Atomic.fetch_max(a, v, order)
```

### 4.6 Pointer atomic

`Atomic[Ptr[T]]` 支持 basic access 与 compare exchange。

首发不要求 pointer arithmetic fetch 操作。

## 5. Operation support matrix

| Type | load/store/swap | compare_exchange | fetch_add/sub | fetch_and/or/xor | fetch_min/max |
|---|---:|---:|---:|---:|---:|
| `Atomic[i32]` | yes | yes | yes | yes | yes |
| `Atomic[i64]` | yes | yes | yes | yes | yes |
| `Atomic[usize]` | yes | yes | yes | yes | yes |
| `Atomic[bool]` | yes | yes | no | `and/or/xor` | no |
| `Atomic[Ptr[T]]` | yes | yes | no | no | no |

## 6. 与 `send` / world 的关系

Atomic 是显式跨 world shared capability。

因此：

- `Atomic[T]: send`，只要 `T` 是 Atomic 支持的类型
- `Array[Atomic[T]]` 可按元素递归成为 `send`
- closure 捕获 Atomic 不会因为 Atomic 本身变成 `!send`
- Atomic 不让被包装的普通 `T` 获得任意 field-level internal mutability

Atomic 只保证 atomic API 的读写协议，不保证更高层数据结构 invariant 自动安全。

## 7. 非目标

首发 Atomic 不做：

- 任意类型 atomic
- lock-free 进度保证
- 自动把 `Ref[T]` 洗成 `send`
- 替代 `UnsafeRef[T]` 或后续 shared collection 设计
- 规定所有 target 上的 lowering 细节
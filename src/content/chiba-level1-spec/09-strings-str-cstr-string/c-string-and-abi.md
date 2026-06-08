# `c"..."` 与 ABI 边界

## 语法

该条目描述 `c"..."` 与 `cstr` 在 ABI 边界中的职责。

## 语义

`c"..."` 的主要目标是为 `extern` / CBI / FFI 提供稳定字符串表示。

`c"..."` literal 的类型是 `cstr`。它表示已经为 C ABI 边界准备好的 UTF-8 byte sequence，并满足 C 字符串需要的终止与内部 NUL 规则。

level-1 固定下面规则：

- `c"..."` 不是普通 `String` literal，也不是 prefix identifier call。
- literal 内容经过对应 string literal escape 处理后，必须能形成 ABI-safe C string。
- 内部 `\0` / NUL byte 默认非法，除非未来单独引入允许 interior-NUL 的 ABI buffer 类型。
- 传给 `extern "C"` / `extern "c"` 中 `cstr` 参数时，不需要额外用户层 cast。
- 普通 `str` / `String` 传到 `cstr` 参数时，必须通过 expected-type conversion 或显式 method conversion，并执行 NUL / lifetime 检查。

## Usage

```chiba
extern "C" def puts(msg: cstr): i32

def main(): i32 = {
	puts(c"hello from c abi")
	return 0
}
```

注释：这里直接使用 `c"..."` 作为 `cstr` 传给 C ABI，表达的是“为 ABI 边界准备好的字符串值”，而不是普通 `String`。

## 边界

需要单独明确：

- `cstr` 的生命周期保证
- `Ptr[u8]` 与 `cstr` 的关系

已固定边界：

- `cstr` 可以 lower 到 backend runtime handle、static data handle 或 ABI pointer，但 CIR/Core 只记录它是 ABI text value，不记录 Wasm / C layout 细节。
- `Ptr[u8]` 是裸指针能力，不等于 `cstr`。从 `cstr` 暴露 pointer 需要 ABI/unsafe 边界。
- `String.to_cstr()` 若产生临时 ABI buffer，其 lifetime 不能越过 owning value / arena 边界；具体策略由 lowering facts 与 backend runtime 决定。

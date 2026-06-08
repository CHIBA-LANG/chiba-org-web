# `str` / `cstr` / `String` 的语法面

## 语法

该条目描述三者在类型层与字面量层的公开写法。

## 语义

三者分别服务于：

- 普通字符串视图或协议类型
- C ABI 字符串
- 拥有型字符串值

固定语义：

- `str` 是 UTF-8 字符串 view / borrow surface，不拥有底层存储。
- `String` 是拥有型 UTF-8 字符串值，可通过 builder 或 `String.from(str)` 构造。
- `cstr` 是 ABI 字符串 view，承诺可用于 C ABI 字符串参数。
- 三者都不是“字符数组”。索引 `s[i]` 按 byte 读取；Unicode scalar 读取走 `s.char_at(n): rune`。
- `rune` 表示一个 Unicode scalar，运行时表示为 `u32`，不是 length-1 `String`。

## Usage

```chiba
def print_view(s: str): () = {
	return ()
}

def print_c(s: cstr): () = {
	return ()
}

def demo(): () = {
	let owned = String.from("hello")
	let view = owned.as_str()
	let abi = c"hello"

	print_view(view)
	print_c(abi)
	return ()
}
```

注释：`str` 用作普通字符串视图，`cstr` 用作 ABI 字符串，`String` 用作拥有型值。示例故意把三种表面同时放在一起，避免它们在文档里被误读成同义词。

## 边界

需要单独明确：

- 三者之间的默认转换是否存在
- `str` 是否只是 view

已固定的转换边界：

- `String.as_str(): str` 产生 view。
- `String.from(s: str): String` 产生拥有型拷贝或等价拥有型值。
- `String.to_cstr(): cstr` / ABI-specific conversion 必须明确可能的分配、NUL 检查与生命周期。
- `c"..."` 直接产生 `cstr` literal，不是普通 `String` literal 加隐式 cast。
- `str` / `String` 到 `cstr` 不应在任意位置隐式发生；只在明确 ABI expected type 或显式 method conversion 下允许。

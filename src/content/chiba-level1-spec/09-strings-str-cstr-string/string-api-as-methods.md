# 字符串相关 API 改为 Method Surface

## 语法

字符串操作倾向于以 method surface 暴露，而不是散落 helper 函数。

## 语义

这让字符串协议与 method resolution 对齐，也更符合 level-1 的 method 方向。

## Usage

```chiba
def demo(): () = {
	let s = String.from("hello")
	let n = s.len()
	let ch: rune = s.char_at(0)
	let upper = s.to_uppercase()

	write(n)
	write(ch)
	write(upper)
	return ()
}
```

注释：例子把长度、变换都写成 method call，表达字符串 API 应优先暴露为 receiver-oriented surface，而不是散落为全局 helper。

字符串族至少保留下面的 method surface：

- `s.len()` / `s.bytes_len()` 返回 UTF-8 byte 长度
- `s.char_at(n): rune` 返回第 `n` 个 Unicode scalar
- `builder.push_rune(ch: rune)` 向 `String` builder 追加一个 rune 的 UTF-8 编码

`char_at` 的索引单位是 rune 序号；`s[i]` 的索引单位仍是 UTF-8 byte。这个差异是语言语义，不是某个 backend 的临时实现细节。

最小 surface：

```chiba
let s = String.from("éa")
let first_byte: u8 = s[0]
let first_rune: rune = s.char_at(0)
let b = s.bytes_len()

let builder = String.new()
builder.push_rune('你')
let owned = builder.finish()
```

`s[0]` 读取 UTF-8 byte，因此对 `"é"` 这类多字节 scalar 返回的是第一个 byte。`s.char_at(0)` 返回完整 Unicode scalar 的 `rune`，运行时表示为 `u32`，source-facing 类型显示为 `rune`。

`String` builder 是拥有型字符串构造 surface。`push_rune(rune)` 必须按 UTF-8 编码追加该 Unicode scalar；它不接受“一个 byte 伪装成字符”的语义。需要追加 byte 时应走 byte/buffer API，而不是 `push_rune`。

## 边界

需要单独明确：

- 哪些旧 helper 转换成哪些方法
- method resolution 在字符串族上是否仍严格保持 nominal-only receiver
- `String` builder 的完整 API surface 与分配策略

已固定的边界：

- `str` / `String` / `cstr` 的 `[i]` 与 `[i..j]` 以 byte 为单位。
- `char_at(n)` 以 Unicode scalar 序号为单位，返回 `rune`。
- `rune` 是 source-facing 类型，不应在诊断里退化显示成普通 `u32`。
- string method lowering 可使用 runtime import，但 typed / Core 层必须保留方法语义和返回类型事实。

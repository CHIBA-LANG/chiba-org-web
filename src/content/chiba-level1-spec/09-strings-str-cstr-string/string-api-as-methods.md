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

`char_at` 的索引单位是 rune 序号；`s[i]` 的索引单位仍是 UTF-8 byte。

## 边界

需要单独明确：

- 哪些旧 helper 转换成哪些方法
- method resolution 在字符串族上是否仍严格保持 nominal-only receiver
- `String` builder 的完整 API surface 与分配策略

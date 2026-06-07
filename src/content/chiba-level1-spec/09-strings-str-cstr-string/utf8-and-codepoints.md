# UTF-8 语义与 Rune 级规则

## 语法

该条目描述字符串和字符相关文本的编码假设。

## 语义

level-1 把源文本固定为 UTF-8。

`rune` 是语言内表示单个 Unicode scalar value 的值类型。其运行时表示是 `u32`，但用户语义层使用 `rune` 名称，而不是把普通整数 API 当作字符 API。

`str` / `String` 保持 UTF-8 不变量；`cstr` 作为 ABI 边界类型，单独处理。

字符串主索引与主切片语义不按 rune 计数，而按字节区间工作，并要求 slice 边界落在合法 UTF-8 rune 边界上。

rune 级操作通过显式 API 提供，例如 `char_at`、`rune_len`；它们不改变主 indexing / slicing 的语义。

## Usage

```chiba
let text = "你好a"
let bytes = text.bytes_len()
let chars = text.rune_len()
```

注释：这个例子刻意把字节长度与 rune 长度分开写，说明规范必须区分“UTF-8 编码后的字节数”和“文本层 Unicode scalar”的 API 语义。

```chiba
let first: rune = text.char_at(0)
let byte0 = text[0]
let slice = text[0..4]
```

注释：`char_at` 是显式的 rune API；它不等价于主 indexing。`text[0]` 返回第 0 个 UTF-8 byte，`text.char_at(0)` 返回第 0 个 Unicode scalar 的 `rune`。

## 边界

regex、`chibalex` 等文本工具应在“UTF-8 文本 + 显式 rune API”的前提上对齐，而不是把字符串本体退回任意字节串模型。

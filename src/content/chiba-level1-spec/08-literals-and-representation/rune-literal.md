# Rune Literal

## 语法

rune literal 使用单引号表示一个 Unicode scalar value。

```chiba
let a: rune = 'a'
let e: rune = 'é'
let nl: rune = '\n'
```

## 语义

`rune` 是语言级字符标量类型，表示一个 Unicode scalar value，运行时表示为 `u32`。

rune literal 必须在词法归一化和 escape 处理后恰好包含一个 Unicode scalar。空 rune literal、多 scalar literal、未闭合 literal 都是 frontend error。

`'a'` 的类型是 `rune`，其值等于该 Unicode scalar 的 code point 值。`rune` 可以由后端表示为 `u32` / wasm `i32`，但类型检查、方法签名和诊断应显示 `rune`。

## Usage

```chiba
def main(): rune = '你'
```

注释：这里返回的是单个 Unicode scalar 的 `rune` 值，不是长度为 1 的 `String`，也不是 UTF-8 byte。

## 边界

`'ab'` 不会被解释为两个字符的 string，也不会自动退化为整数；它是非法 rune literal。

组合字符序列是否显示为一个字形不改变 rune literal 规则。rune literal 只承诺一个 Unicode scalar，不承诺一个 grapheme cluster。

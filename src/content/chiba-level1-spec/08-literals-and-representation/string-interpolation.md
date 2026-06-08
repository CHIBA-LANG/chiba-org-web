# String Interpolation

## 语法

该条目描述字符串内部嵌入表达式的语法。

## 语义

插值应与字符串协议协同工作，而不是独立绕过 handler 路线。

level-1 支持字符串插值，并把它纳入统一 string literal protocol。

raw string 默认不做普通 interpolation；非 raw 字符串与 multiline 字符串都可启用 interpolation。

插值 literal 的结果是 `String`，不是 `str` view，也不是 `cstr`。若上下文需要 `str`，可从拥有型结果产生 view；若上下文需要 `cstr`，必须经过 ABI conversion 与 NUL 检查。

每个 `${expr}` 在普通表达式上下文中类型检查。表达式结果必须满足 string builder 追加协议：

- `String` / `str` 可以追加文本内容。
- `rune` 通过 `push_rune` 追加一个 Unicode scalar。
- numeric / bool 等 scalar 需要有明确格式化协议或 handler，不允许后端临时把值猜成文本。

lowering 语义等价于创建 `String` builder，按 source 顺序追加 literal segment 和 interpolation segment，最后 finish 成 `String`。这个顺序是可观察的，因为 interpolation 表达式可以有求值顺序约束。

```chiba
let msg = "x=${x}, ch=${'你'}"
```

大致等价于：

```chiba
let b = String.new()
b.push_str("x=")
b.push_format(x)
b.push_str(", ch=")
b.push_rune('你')
let msg = b.finish()
```

这里 `push_format` 表示语言级格式化 obligation；具体 surface 可以继续细化，但不能退化成 backend string 拼接猜测。

## Usage

```chiba
let msg = "hello ${name}"
let block = ##"
user = ${name}
id = ${id}
"##
```

注释：插值不引入另一套字符串系统；它只是字符串字面量描述中的一部分。

## 边界

插值表达式边界与转义细节可继续细化，但不改变它在协议中的统一地位。

已固定边界：

- raw string 默认不插值；若未来添加 raw-interpolation prefix，必须是显式 prefix。
- `c"..."` 不做 interpolation；需要动态 C ABI 字符串时先构造 `String`，再显式转换到 `cstr`。
- interpolation 不改变 `[i]` byte indexing 与 `char_at(n): rune` 的规则。

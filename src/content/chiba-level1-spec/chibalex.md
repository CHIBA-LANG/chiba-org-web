# ChibaLex 设计草案

> ChibaLex 是 Chiba 生态自带的词法工具。
> 安装 Chiba 时默认提供 `chibalex`。
>
> 其规则文件后缀为：`.chibalex`

---

## 1. 定位

ChibaLex 不是"只会把正则翻译成 switch-case"的传统 lexer generator。
它的目标是成为 **Chiba 生态的统一词法前端**，服务于：

- Chiba 自举编译器
- Chiba 生态中的其他语言前端
- IDE / formatter / linter / refactor 工具
- layout-sensitive 语言（如 Python / Haskell 风格）
- 未来的增量分析与错误恢复

---

## 2. 文件结构

一个 `.chibalex` 文件的结构为：

```
FileAttr                  // 必须是 #![CHIBALEX]
HeaderBlock               // namespace / use 声明块
CharClassDef*             // 字符类定义（$name = ...）
MacroDef*                 // 词法宏定义（@name = ...）
TokensDef                 // tokens :- 规则块（含内嵌 footer 块）
```

---

## 3. 文件属性标记

所有 `.chibalex` 文件必须以如下属性开头：

```chibalex
#![CHIBALEX]
```

---

## 4. 头部块（HeaderBlock）

```chibalex
{
    namespace lexer.chiba
    use frontend.token.*
}
```

- 花括号包围
- 内部是标准 Chiba 的 `namespace` 和 `use` 声明
- 这些声明会被原样插入到生成的 Chiba 源文件头部

---

## 5. 字符类（Character Class）

字符类以 `$` 开头命名，描述一组字符。

```chibalex
$digit   = [0-9]
$hexdig  = [0-9A-Fa-f]
$alpha   = [A-Za-z_]
$alnum   = [A-Za-z0-9_]
$ws      = [ \t\r\n]
$any     = [\x00-\xff]
```

### 字符类语法

```ebnf
CharClassDef  ::= "$" IDENT "=" CharSet

CharSet       ::= "[" "^"? CharItem+ "]"    (* 可选取反前缀 *)

CharItem      ::= CHAR "-" CHAR             (* 范围 a-z *)
                | "\\" EscCode              (* 转义：n t r 0 \\ xHH *)
                | CHAR                      (* 单个字符 *)
```

字符类之间**不允许循环引用**，可以在宏中引用字符类。

---

## 6. 词法宏（Macro）

词法宏以 `@` 开头命名，描述一段正则模式，可引用字符类和其他宏。

```chibalex
@ident   = $alpha $alnum*
@decint  = $digit+
@hexint  = "0" [xX] $hexdig+
@escape  = "\\" $any
@strchar = [^"\\]
@strlit  = "\"" (@strchar | @escape)* "\""
@linecom = "//" [^\n]* "\n"?
```

### 宏语法

```ebnf
MacroDef  ::= "@" IDENT "=" RegexExpr

RegexExpr ::= RegexExpr RegexExpr           (* 连接（空格分隔） *)
            | RegexExpr "|" RegexExpr       (* 选择 *)
            | RegexExpr "*"                 (* Kleene 星 *)
            | RegexExpr "+"                 (* 一次或多次 *)
            | RegexExpr "?"                 (* 零次或一次 *)
            | "(" RegexExpr ")"             (* 分组 *)
            | "[" "^"? CharItem+ "]"        (* 内联字符集 *)
            | """ [^"]+ """                 (* 字面字符串（单引号） *)
            | "\"" [^"]+ "\""                 (* 字面字符串（双引号，用于单字符） *)
            | "$" IDENT                     (* 引用字符类 *)
            | "@" IDENT                     (* 引用宏 *)
```

宏之间**不允许循环引用**（DAG 结构）。

---

## 7. Token 规则块

```chibalex
tokens :-
    RULE
    RULE
    ...
    FooterBlock
```

### 规则形式

```ebnf
Rule    ::= Pattern Action

Pattern ::= "@" IDENT                       (* 宏匹配 *)
           | STR_LIT                         (* 字面字符串，双引号 *)
           | """ CHAR """                    (* 单个字符字面量 *)
           | "[" "^"? CharItem+ "]"          (* 内联字符集 *)
           | Pattern Pattern                 (* 连接 *)
           | Pattern "?"
           | Pattern "*"
           | Pattern "+"

Action  ::= "{" LambdaBody "}"              (* 产生 Token *)
           | ";"                             (* 跳过（skip） *)
```

`LambdaBody` 是 Chiba 表达式，上下文中隐含两个绑定变量：

| 变量 | 类型 | 含义 |
|------|------|------|
| `s`  | `Str` | 匹配到的原文字符串 |
| `span` | `Span` | 源码位置（file, line, col, len） |

返回类型为 footer block 中定义的 `Token`。

### 尾部块 FooterBlock

`tokens :-` 块的末尾（最后一条规则之后）可以直接嵌入一个花括号块，
作为生成文件的尾部 Chiba 代码（通常定义 `data Token` 和 `type Span`）：

```chibalex
tokens :-
    ...规则...

    {
        data Token { ... }
        type Span { ... }
    }
```

---

## 8. 匹配语义

### 8.1 最长匹配（Maximal Munch）

ChibaLex 采用**最长匹配优先**原则：
- 同一位置所有规则并行尝试
- 选择匹配字符数最多的规则
- 若最长匹配长度相同，选择**规则文件中靠前的规则**（优先级由书写顺序决定）

> **推论**：关键字规则必须写在 `@ident` 规则之前。
> 关键字 `"def"` 在后跟非标识符字符时比 `@ident` 更长（或等长但靠前），
> 因此能被正确识别；而 `define` 匹配 `@ident` 更长，关键字规则不能匹配。

### 8.2 Atom 的无空格约束

Atom（`:ident`）规则 `":" @ident` 由连接语义保证：匹配 `:` 紧跟标识符字符。
当 `:` 后跟空格时，该规则匹配长度为 1，而单独的 `":"` 也为 1，
此时 `":"` 规则靠后但 Atom 规则靠前 → Atom 规则失败（因为只能匹配 1 字符但规则要求至少 2 字符），
回退为 `Colon`。

实现要点：`":" @ident` 必须写在单独 `":"` 之前。

### 8.3 错误处理

当无任何规则能匹配时：
1. 产出 `LexError(codepoint)` token（包含出错字符的码位）
2. 跳过该字符，从下一个字符继续扫描
3. 不中断整个词法分析（panic-mode 恢复）

---

## 9. 完整 chiba.chibalex 示例

```chibalex
#![CHIBALEX]

{
    namespace lexer.chiba
    use metalstd.str.*
}

// ── 字符类 ────────────────
$digit  = [0-9]
$hexdig = [0-9A-Fa-f]
$alpha  = [A-Za-z_]
$alnum  = [A-Za-z0-9_]
$ws     = [ \t\r\n]
$any    = [\x00-\xff]

// ── 词法宏 ─────────────────
@ws      = $ws+
@linecom = "//" [^\n]* "\n"?
@ident   = $alpha $alnum*
@decint  = $digit+
@hexint  = "0" [xX] $hexdig+
@escape  = "\\" $any
@strchar = [^"\\]
@strlit  = "\"" (@strchar | @escape)* "\""

// ── Token 规则 ─────────────
tokens :-
    // 跳过空白和行注释
    @ws       ;
    @linecom  ;

    // 关键字（必须先于 @ident）
    "namespace" { KwNamespace }
    "def"       { KwDef }
    "type"      { KwType }
    "data"      { KwData }
    "union"     { KwUnion }
    "let"       { KwLet }
    "if"        { KwIf }
    "else"      { KwElse }
    "match"     { KwMatch }
    "extern"    { KwExtern }
    "unsafe"    { KwUnsafe }
    "reset"     { KwReset }
    "shift"     { KwShift }
    "true"      { KwTrue }
    "false"     { KwFalse }
    "as"        { KwAs }
    "use"       { KwUse }
    "private"   { KwPrivate }
    "asm"       { KwAsm }

    // C 字符串字面量（c"..."），必须先于 @ident
    "c" @strlit { CStr(unescape(str_slice(s, 1, str_len(s)))) }

    // 普通标识符
    @ident      {  Ident(s) }

    // 整数字面量（十六进制先于十进制）
    @hexint     {  Int(parse_hex_lit(s)) }
    @decint     {  Int(parse_dec_lit(s)) }

    // 字符串字面量
    @strlit     {  Str(unescape(s)) }

    // Atom（:ident，无空格）——必须先于单独的 ":"
    ":" @ident  { Atom(str_slice(s, 1, str_len(s))) }

    // 文件属性 #!  和  item 属性 #[ident]
    "#!"            { HashBang }
    "#[" @ident "]" {   ItemAttr(str_slice(s, 2, str_len(s) - 1)) }

    // 双字符运算符（必须先于对应单字符）
    "=>"  { FatArrow }
    "=="  { EqEq }
    "!="  { BangEq }
    "<="  { LtEq }
    ">="  { GtEq }
    "&&"  { AmpAmp }
    "||"  { PipePipe }

    "="   { Eq }
    "+"   { Plus }
    "-"   { Minus }
    "*"   { Star }
    "/"   { Slash }
    "%"   { Percent }
    "<"   { Lt }
    ">"   { Gt }
    "!"   { Bang }
    "&"   { Amp }
    "|"   { Pipe }
    ":"   { Colon }
    ","   { Comma }
    "."   { Dot }
    "("   { LParen }
    ")"   { RParen }
    "{"   { LBrace }
    "}"   { RBrace }
    "["   { LBracket }
    "]"   { RBracket }

{
    // 会自动根据 Token 生成类型 TokenSpan
    // type Span {
    //     file : string
    //     line : i64
    //     col  : i64
    //     len  : i64
    // }
    // 
    // type TokenSpan {
    //     token: Token
    //     span: Span
    // }
    // 
    // data TokenItem {
    //     TokenSpan(TokenSpan)    
    //     ErrorSpan(Error, Span)
    // }

    data Token {
        KwNamespace,  KwDef,     KwType,    KwData,
        KwUnion,      KwLet,     KwIf,      KwElse,
        KwMatch,      KwExtern,  KwUnsafe,  KwReset,
        KwShift,      KwTrue,    KwFalse,   KwAs,
        KwUse,        KwPrivate, KwAsm,
        Ident(String),
        Int(i64),
        Str(String),
        CStr(String),
        Atom(String),
        HashBang,
        ItemAttr(String),
        FatArrow,
        EqEq,   BangEq,  LtEq,    GtEq,   AmpAmp,  PipePipe,
        Eq,     Plus,    Minus,   Star,   Slash,   Percent,
        Lt,     Gt,      Bang,    Amp,    Pipe,
        Colon,  Comma,   Dot,
        LParen, RParen,  LBrace,  RBrace, LBracket, RBracket,
        LexError(i64),
        Eof,
    }
}
```

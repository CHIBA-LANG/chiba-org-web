# ChibaCC 设计草案（重定义）

> ChibaCC 是 Chiba 生态自带的语法分析工具。
> 安装 Chiba 时默认提供 `chibacc`。
>
> 其语法文件后缀为：`.chibacc`

---

## 1. 定位

它的目标是成为 **Chiba 生态统一的 token-based parsing platform**。

一句话：

> ChibaCC = token grammar + Pratt rule + semantic predicate + continuation rollback + LL* best-effort recovery

它首先服务 Chiba 自举，其后服务：

- Chiba 生态中的其他语言前端
- IDE / formatter / linter / refactor 工具
- 未来的增量分析与错误恢复场景

---

## 2. 输入 / 输出模型

ChibaCC **不直接处理字符流，也不在 grammar 中写字符串终结符**。

它的输入是 lexer 产出的 token 项序列：

```chiba
Vec[TokenItem]
```

其中 `TokenItem` 延续前文约定：

```chiba
data TokenItem {
    TokenSpan(Token, Span)
    ErrorSpan(Error, Span)
}
```

语法文件中的所有终结符都应当是 **token 构造器名**，例如：

- `KwDef`
- `Ident`
- `LParen`
- `FatArrow`

用户在 footer 中定义自己的 AST。

推荐做法是由用户自己提供一个顶层 AST 节点，例如 `Programme(...)`，用来承载整份文件的解析结果。

ChibaCC 不要求用户为每个层级额外手写 `Item_Error` / `Stmt_Error` / `Expr_Error`。

生成器会把整次 `start` 规则的解析结果统一包成 `LabeledAST`：

```chiba
data LabeledAST {
    OK(AST, Vec[TokenItem])
    Err(Option[AST], Vec[TokenItem])
}

```

其中：

- `OK(ast, consumed)` 表示成功构造出一个 AST，并附带本次消费的 token 片段
- `Err(None, skipped)` 表示这一段无法稳定构造 AST，只保留出错 / 跳过的 token 片段
- `Err(Some(ast), skipped)` 表示 parser 在失败前得到了一个部分可信的 AST，是否使用由用户自己决定

因此，默认入口 parser 的输出模型是：

```chiba
LabeledAST
```

也就是说，若用户把整份文件建模成一个顶层 AST，例如：

```chiba
data AST {
    Programme(Vec[AST])
    // ...
}
```

那么 ChibaCC 的默认输出就是这个顶层 AST 的 `LabeledAST` 包装。

也就是说，ChibaCC 默认目标不是“出错立即停止”，而是：

> 尽量继续捕获后续 AST，并把失败片段包装成 `LabeledAST.Err(...)` 交给用户处理。

用户自己在后处理阶段决定：

- 只提取 `OK(...)`
- 保留 `Err(...)` 做 IDE / formatter / lint / 容错分析
- 或把 `Err(Some(ast), ...)` 当成降级结果继续使用

这样顶层结构是否叫 `Program`、`Programme`、`Module`，都由用户 AST 自己决定。

---

## 3. 文件结构

```chibacc
FileAttr                  // 必须是 #![CHIBACC]
HeaderBlock               // namespace / use
GrammarDef                // grammars
FooterBlock?              // 尾部 Chiba 代码（AST 类型、辅助函数等）
```

---

## 4. 文件属性标记

```chibacc
#![CHIBACC]
```

---

## 5. 头部块（HeaderBlock）

```chibacc
{
    namespace parser.chiba
    use frontend.ast.*
    use frontend.token.*
}
```

- 花括号包围
- 内部是标准 Chiba 的 `namespace` 和 `use`
- 这些声明会原样插入生成文件头部

ChibaCC 的 parser 直接接收 `Vec[TokenItem]` 作为输入。

---

## 6. 语法块

```chibacc
start RULE_NAME
RuleDef*
```

- `start RULE_NAME` 指定入口规则
- ChibaCC 对整份 token 项流调用一次 `start`，返回一个 `LabeledAST`
- 实践上，`start` 通常应指向用户自定义的顶层规则，例如 `programme`

---

## 7. 统一规则系统 (EBNF)

ChibaCC ：`rule`。
规则本身同时承担：

- 语法匹配
- AST 构造
- 语义判定
- Pratt 子规则


### 重要约束

ChibaCC grammar 中 **不出现字符串终结符**。

例如，下面这种写法不再推荐：

```chibacc
"(" expr ")"
```

应改为：

```chibacc
LParen expr RParen
```

这样 grammar 的边界就非常清晰：

- lexer 负责“字符 → token”
- 单条 `rule` 负责“token → AST”
- 顶层 `start` 驱动器负责“Vec[TokenItem] → LabeledAST”

---

## 8. `=>`：统一动作出口

ChibaCC 不再设计单独的 `callback` 语法。

统一规定：

> `=>` 后面就是一段 Chiba 表达式。

这段表达式天然就是一个 lambda / action body，可以：

- 直接构造 AST
- 调用普通 Chiba 函数
- 做局部语义判断
- 查询 parser context

简单情况：

```chibacc
rule let_stmt ::=
    KwLet p:pat Eq rhs:expr
    => Stmt_Let(p, rhs)
    ;
```

复杂情况：

```chibacc
rule pat ::=
    name:Ident
    => classify_pat(name)
    ;
```

或：

```chibacc
rule expr_tail ::=
    lhs:expr op:Ident rhs:expr
    => build_custom_infix(ctx, lhs, op, rhs)
    ;
```

### 8.1 action 上下文

在 `=>` 后的表达式中，可以访问：

- 标签绑定变量，例如 `name`, `rhs`
- 位置绑定 `$0`, `$1`, ...
- Pratt 上下文中的 `$lhs`, `$rhs`
- parser context，例如 `ctx`

---

## 9. 语义谓词

```chibacc
?predicate_name(args...)
```

语义是：

> 在当前位置调用一个返回 `bool` 的普通 Chiba 函数。若返回 `false`，当前候选支失败。

### 9.1 谓词示例：构造器 vs 变量

```chibacc
rule pat ::=
    name:Ident ?is_upper_ident(name)
    => Pat_Constructor(name, nil_list())
  | name:Ident
    => Pat_Var(name)
  ;
```

含义：

- 同样都是 `Ident`
- 若 `is_upper_ident(name)` 为真，则走构造器分支
- 否则走变量分支

### 9.2 谓词示例：依赖 parser state

```chibacc
rule shift_expr ::=
    KwShift k:Ident b:block ?next_is_block(ctx)
    => Expr_Shift(default_tag(), k, b)
    ;
```

### 9.3 建议签名

语义谓词建议是普通函数：

```chibacc
def is_upper_ident(name: TokenItem): bool = ...
def next_is_block(ctx: ParserContext): bool = ...
```

也就是说，它不是特殊机制，只是“在分支选择阶段执行的布尔函数”。

---

## 10. Continuation Rollback 模型

在候选支分叉点（`|`）上，ChibaCC 自动建立 checkpoint：

1. 保存 token stream 位置
2. 保存 parser state 快照
3. 尝试当前候选支
4. 若失败，则回滚并尝试下一候选支

因此在用户视角下：

> `|` 的语义仍然是“按顺序尝试候选支”。

但这里的 rollback 只负责 **分支选择**，不负责用户级错误恢复。

一旦某条规则已经确定无法继续，ChibaCC 进入 LL* 能做到的最佳努力恢复。

---

## 11. LL* 能做到的最佳努力错误恢复

默认策略改成：

> 某条规则失败时，parser 记录错误，基于 LL* 预测信息做有限同步，尽量推进到下一个可恢复边界，然后继续捕获后续 AST。

### 11.1 用户视角

直接写普通规则：

```chibacc
rule stmt ::=
    KwLet p:pat Eq rhs:expr
    => Stmt_Let(p, rhs)
  | e:expr
    => Stmt_Expr(e)
  ;
```

若这里出错，ChibaCC 默认：

1. 记录一条 `ParseError`
2. 终止当前候选支 / 当前规则的正常构造
3. 用 LL* 可判定的同步边界跳过损坏部分
4. 由顶层 `start` 驱动器把当前解析结果包装成 `LabeledAST.Err(...)`，必要时可附带一个部分可信的顶层 AST

### 11.2 为什么这样更合适

因为用户真正想要的是：

- 出错位置能报告
- 但整个文件不要直接停掉
- 后续 item / stmt / expr 仍然尽量继续分析

而不是：

- 让 grammar 作者手写一堆 `recover` 规则
- 让 parser 伪造很多并不可靠的 AST 节点
- 为了“看起来恢复更多”引入过度复杂的语义修补逻辑

这里的设计目标不是做成 `rustc` 那种大量手写、按语法点特化的恢复系统，而是：

> 保持 ChibaCC 的 LL* / rule 模型简洁，只做它天然擅长、而且实现成本可控的恢复。

### 11.3 恢复结果形式

ChibaCC 不再默认要求用户 AST 自己提供 `Item_Error` / `Stmt_Error` / `Expr_Error` 这类分支。

恢复后的结果主要通过外层标签表达：

例如：

```chibacc
data LabeledAST {
  OK(AST, Vec[TokenItem])
  Err(Option[AST], Vec[TokenItem])
}
```

也就是说：

- `OK(ast, consumed)` 表示正常完成的一个 AST
- `Err(None, skipped)` 表示这一段无法稳定构造 AST，只能保留出错 token 片段
- `Err(Some(ast), skipped)` 表示 parser 在失败前已经得到一个部分可信的 AST，可由实现选择性返回

这样做比“强行插入统一错误节点”更符合 LL* 的能力边界。

### 11.4 默认恢复边界

恢复边界由 parser 内建推断，不要求用户手写。优先依赖：

- 当前规则与上层规则的 FIRST / FOLLOW 风格信息
- 分隔符配对边界，例如 `RParen`、`RBracket`、`RBrace`
- 列表上下文中的分隔符，例如 `Comma`
- Pratt 表达式中的较低优先级停止点

在常见场景下，可以理解为：

- 在 item 列表里：尝试跳到下一个 item 开头
- 在 stmt 列表里：尝试跳到下一条 stmt 或 `RBrace`
- 在 match arm 列表里：尝试跳到下一条 arm 或块结束
- 在表达式里：停止于较低优先级边界、分隔符或闭合符号

### 11.5 能力边界

这一节明确限定：

- ChibaCC 做的是 **best-effort recovery**
- 不保证每次都能合成一个“看起来合理”的 AST
- 不追求像手写工业编译器那样，为每个语法点定制专门恢复函数
- 一旦恢复会显著污染后续解析，parser 可以选择直接把该段包装为 `Err(...)` 后继续到更高层边界

也就是说，错误恢复是 **parser 的默认行为**，但恢复质量以 LL* 框架天然能稳定提供的能力为上限。

---

## 12. Pratt 规则

Pratt 不再依赖一个外部 `primary` 规则作为前置入口。

它本身就是一种完整的 `rule` body。

```ebnf
PrattRule   ::= "pratt" "{" PrefixBlock InfixBlock* PostfixBlock* "}"

PrefixBlock ::= "prefix"  "(" INT ")" "{" PrefixArm+ "}"
InfixBlock  ::= "infix"   "(" INT "," INT ")" "{" InfixArm+ "}"
PostfixBlock ::= "postfix" "(" INT ")" "{" PostfixArm+ "}"

PrefixArm   ::= SeqItem* "=>" ActionExpr
InfixArm    ::= SeqItem* "=>" ActionExpr
PostfixArm  ::= SeqItem* "=>" ActionExpr
```

### 12.1 设计原则

- 只支持静态 binding power
- 复杂语义通过 `=>` 后的普通 Chiba 函数调用解决

### 12.2 Pratt 示例

```chibacc
rule expr ::= pratt {
    prefix (20) {
        n:Int
        => Expr_Int(n)

        name:Ident
        => Expr_Var(name)

        Minus e:expr
        => Expr_UnOp(Neg, e)

        LParen e:expr RParen
        => e
    }

    postfix(70) {
        LParen args:arg_list RParen
        => Expr_Call($lhs, args)

        Dot name:Ident
        => Expr_Field($lhs, name)
    }

    infix(50, 51) {
        Star rhs:expr
        => Expr_BinOp(Mul, $lhs, rhs)

        Slash rhs:expr
        => Expr_BinOp(Div, $lhs, rhs)
    }

    infix(40, 41) {
        Plus rhs:expr
        => Expr_BinOp(Add, $lhs, rhs)

        Minus rhs:expr
        => Expr_BinOp(Sub, $lhs, rhs)
    }
} ;
```

这里：

- `prefix` 负责前缀位置匹配
- `infix` 负责二元运算
- `postfix` 负责调用、字段访问等
- `$lhs` 是已解析的左侧表达式

---

## 13. 完整示例（重写风格）

下面示意一个更接近最终方向的 `chiba.chibacc` 片段。

```chibacc
#![CHIBACC]

{
    namespace parser.chiba
    use frontend.ast.*
    use frontend.token.*
}

start programme

rule programme ::=
    items:item* Eof
    => Programme(items)
    ;

rule item ::=
    attrs:item_attr* priv:KwPrivate? body:item_body
    => Item(attrs, priv != None, body)
    ;

rule expr ::= pratt {
    prefix (20) {
        Neg e:expr
        => Expr_UnOp(Neg, e)
        ;
        
        Pos e:expr
        => Expr_PosOp(Pos,e)
        ;
    }

    postfix(70) {
        Dot name:Ident
        => Expr_Field($lhs, name)
        ;
    }

    infix(50, 51) {
        Slash rhs:expr
        => Expr_BinOp(Div, $lhs, rhs)
        ;
    }

    infix(40, 41) {
        Plus rhs:expr
        => Expr_BinOp(Add, $lhs, rhs)
        ;
    }
} ;

{
    // 尾部 Chiba 代码：用户 AST / 错误节点定义等
    data AST {
        Something(Something, AST)
    }
}
```

---

## 14. 总结

新的 ChibaCC 设计收敛为：

- 只有一种 grammar 单元：`rule`
- 所有语义动作统一通过 `=>`
- 语义谓词显式写成 `?pred(...)`
- grammar 只吃 token，不出现字符串终结符
- Pratt 是 `rule` 的一种 body，不依赖外部 `primary`
- 不再暴露 `recover` DSL
- 默认错误恢复模型是：采用 LL* 可实现的 best-effort recovery，并把失败片段交给 `LabeledAST.Err(...)`
- 输入是 `Vec[TokenItem]`
- 输出是 `LabeledAST`

这使 ChibaCC 更像一个真正的 parsing platform，而不是“递归下降代码模板生成器 + 少量动作拼接”。

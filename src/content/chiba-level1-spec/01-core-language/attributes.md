# Attributes

## 语法

attribute 使用 `#[...]` 或 file-level `#![...]`。

attribute argument 至少支持：

- bare name
- string literal
- int literal
- named string：`key="value"`
- named value：`key=value`
- nested predicate call：`name(args...)`
- list/array：`[a, b, c]`
- object/record：`{key=value, other=[1,2,3]}`

例如：

```chiba
#[repr("C")]
type Header {
	#[cname(field="_")]
	field: i32,
}

#[compile_if(backend="wasm")]
def wasm_only(): i64 = 1

#[compile_if(all(backend="native", not(target="wasm-unknown-wasi")))]
def native_non_wasi(): i64 = 1
```

## `compile_if`

`#[compile_if(...)]` 是条件编译属性。

条件成立时，声明进入后续 semantic / lowering pipeline；条件不成立时，该声明对当前编译目标不可见。

首发 predicate：

- `backend="wasm"`
- `backend="native"`
- `target="..."`
- `all(a, b, ...)`
- `or(a, b, ...)`
- `not(a)`

`all` / `or` 接受一个或多个子条件；`not` 必须接受一个子条件。

`backend` 描述当前后端族，不等价于完整 target triple。
`target` 描述完整 target triple，例如 `wasm-unknown-wasi`。

## 语义

`compile_if` 的判断必须发生在当前编译单元进入正式 item collection 之前。被禁用 item 不应产生 binding、method candidate、namespace export、generic instantiation 或 backend symbol。

因此，互斥 target 下的同名 item 不构成重名冲突：

```chiba
#[compile_if(backend="native")]
def name() = {}

#[compile_if(backend="wasm")]
def name() = {}
```

当前编译目标只会看到其中一个定义，codegen 也只会为可见定义生成符号。

条件表达式只读取编译上下文，不读取普通 Chiba 值，也不运行用户代码。

unknown predicate、unknown key、参数数量错误或非 string 的 key value 都是 compile-time error。

## Attribute argument AST

attribute parser 必须输出结构化 AST，不能把 `#[...]` 内部保持为字符串。

```chiba
data AttrArg {
    AttrBare(Ident)                 // `someident`; 等价于 named bool true
    AttrString(String)
    AttrInt(i64)
    AttrBool(bool)
    AttrNamed(Ident, AttrArg)       // `key=value`
    AttrCall(Ident, Vec[AttrArg])   // `all(a, b)` / `derive(Debug)`
    AttrList(Vec[AttrArg])          // `[1, 2, "x"]`
    AttrObject(Vec[(Ident, AttrArg)])
}

data Attribute {
    Attribute(path: Vec[Ident], args: Vec[AttrArg], file_level: bool)
}
```

bare argument 语义：

```chiba
#[attribute(all(someident, a=b))]
```

中 `someident` 等价于：

```chiba
someident = true
```

但 AST 仍保留 `AttrBare(someident)`，由具体 attribute 语义层决定是否规范化为 bool。

## Grammar

```ebnf
attribute       ::= "#[" attr_path attr_args? "]"
file_attribute  ::= "#![" attr_path attr_args? "]"
attr_path       ::= ident ("::" ident)*
attr_args       ::= "(" attr_arg_list? ")"
attr_arg_list   ::= attr_arg ("," attr_arg)* ","?
attr_arg        ::= ident
                  | literal
                  | ident "=" attr_arg
                  | ident "(" attr_arg_list? ")"
                  | "[" attr_arg_list? "]"
                  | "{" attr_field_list? "}"
attr_field_list ::= attr_field ("," attr_field)* ","?
attr_field      ::= ident "=" attr_arg
literal         ::= string | int | bool
```

parser 必须正确处理 nested/list/named 组合，例如：

```chiba
#[attribute(all(someident, a=b, c=[1,2,3,4]))]
```

lexer 只负责产生 `#`、`!`、`[`、`]`、`(`、`)`、`{`、`}`、`,`、`=`、literal、ident 等普通 token；attribute 的嵌套结构由 parser/chibacc 负责。

## 边界

`compile_if` 不是 runtime branch，也不是 optimizer hint。
它不能依赖类型推导结果、常量求值、macro 展开副作用或 target runtime feature probing。

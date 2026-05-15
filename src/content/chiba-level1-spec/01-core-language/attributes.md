# Attributes

## 语法

attribute 使用 `#[...]` 或 file-level `#![...]`。

attribute argument 至少支持：

- bare name
- string literal
- named string：`key="value"`
- nested predicate call：`name(args...)`

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

条件表达式只读取编译上下文，不读取普通 Chiba 值，也不运行用户代码。

unknown predicate、unknown key、参数数量错误或非 string 的 key value 都是 compile-time error。

## 边界

`compile_if` 不是 runtime branch，也不是 optimizer hint。
它不能依赖类型推导结果、常量求值、macro 展开副作用或 target runtime feature probing。

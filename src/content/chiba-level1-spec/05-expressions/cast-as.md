# Cast `as`

## 语法

cast 使用 `expr as Ty` 形式。

## 语义

`as` 表示显式类型转换，而不是普通隐式类型统一。

`as` 只承担显式 conversion / reinterpret boundary，不参与普通推断或隐式协调。

对于可能失败的 checked conversion，`as` 不是默认承载面。

特别是 `dyn` package 回到具体 nominal type 的转换，不应被写成“失败语义不清晰的普通 `as`”；它应走单独的 checked conversion surface。

安全的数值收窄/扩宽、表示兼容的转换与底层 capability 边界转换，必须在各自规则允许时显式发生；更危险的转换应进入 `unsafe` 或专门边界 API。

## Usage

```chiba
let x = 1 as i64
let p = addr as Ptr[u8]
```

注释：`as` 是显式边界，不是“编译器替你凑类型”的普通手段。

它也不是 `dyn` downcast / checked cast 的兜底语法。

## 边界

更细的 cast 矩阵仍可继续拆文档细化；但 level-1 已固定 `as` 的角色是显式转换，而不是隐式统一补丁，也不是承载会失败的 `dyn` checked conversion 的统一入口。

# `Ptr[T]` 与 FFI / Metal / ABI 边界

## 语法

该条目不新增语法，描述 `Ptr[T]` 在边界场景中的合法使用。

## 语义

`Ptr[T]` 是语言面与外部内存模型接触的主要桥梁之一。

它主要服务于：

- FFI
- C / ABI 边界
- Metal / device / raw buffer 场景
- 其他需要显式地址语义的低级接口

`Ptr[T]` 不承担 managed value 的保活与生命周期管理承诺；调用方必须显式进入相应边界协议。

在非 `#![Metal]` 的普通 level-1 代码里，使用 `Ptr[T]` 应落在 `unsafe` 责任边界内。

## `#![Metal]` 与 `#[repr("C")] type`

普通 `type` / `data` 走 Chiba managed value 表示，不承诺 C ABI struct layout。

在 `#![Metal]` 文件中，`#[repr("C")] type` 表示 C-compatible struct layout：

```chiba
#![Metal]

#[repr("C")]
type Point {
	x: f32,
	y: f32,
}
```

这类 type 的 payload layout 按目标 C ABI 处理：字段顺序使用源码顺序，size / align / padding 使用目标 ABI 规则，不在 payload 内插入 Chiba managed object header。

`#[repr("C")] type` 只描述 struct layout。FFI struct 参数、返回值和 `Ptr[T]` 指向的内存应使用这种 repr type。普通非 repr `type` 不能被假定为 C struct；需要跨边界时必须显式转换、拷贝或通过专门 ABI wrapper。

允许字段应限于 FFI-safe 类型：固定宽度整数、`f32` / `f64`、`Ptr[T]`、以及嵌套的 `#[repr("C")] type`。普通 managed `String`、`Array[T]`、closure、`Ref[T]`、普通 `data` 不属于首发 FFI-safe struct field。

普通 FFI 只承诺 struct surface；`union` 只在 `#![Metal]` 中可用。

## Usage

```chiba
extern "c" def memcpy(dst: Ptr[u8], src: Ptr[u8], n: usize): Ptr[u8]

#![Metal]

#[repr("C")]
type Vec2 {
	x: f32,
	y: f32,
}

extern "c" def scale(v: Ptr[Vec2], n: usize): ()
```

注释：`Ptr[T]` 的目标就是把语言值系统与外部裸地址世界隔开，而不是给普通业务值提供默认引用形式。

## 边界

layout、alignment、nullability 等 ABI 细节可在更低层规范继续展开；但 level-1 已固定 `Ptr[T]` 的角色是“裸地址 capability”，不是 managed 引用。`#[repr("C")] type` 与普通 managed `type` 是不同 representation contract；不能隐式互换。

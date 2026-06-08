# 标识符与 Namespace Path

## 语法

标识符用于命名：

- 局部变量
- 顶层 item
- 类型名
- 构造子
- namespace path 的每一段

namespace path 由多个标识符段组成。

level-1 当前方向同时支持：

- 文件头 `namespace x.y.z`
- inline `namespace x.y.z { ... }`

## 语义

同一标识符在不同命名空间中的含义由上下文决定。

namespace path 用于文件级组织、导入和顶层可见性边界。

保留字不允许作为标识符

namespace 决定顶层 item 的逻辑归属与可见性边界。

文件头 namespace 为整个文件设定默认命名空间；inline namespace block 为局部 item 提供嵌套命名空间。

namespace 是 level-1 顶层可见性的生效边界；不是文件边界。

namespace 同时是 item ownership 边界。即使多个 source file 被 driver 合并进同一个编译单元，函数、类型、constructor、method、static/global value 与 intrinsic surface 仍保留原始 owner namespace。

`use` 只改变当前 namespace 的可见名称集合，不改变被导入 item 的 owner namespace。`public use` 也只是增加 re-export edge。

名字解析冲突不能依赖文件系统遍历顺序或 source merge 顺序消解；同层 duplicate 报错，跨层 shadowing 按 resolution 规则处理。

## Usage

```chiba
namespace demo.math

def add(x: i32, y: i32): i32 = {
	return x + y
}
```

```chiba
namespace demo {
	namespace extra {
		def sub(x: i32, y: i32): i32 = {
			return x - y
		}
	}
}
```

注释：文件头 namespace 与 inline namespace block 都进入同一命名空间系统；可见性按 namespace，而不是按文件，生效。

## 边界

namespace 与文件路径可以相关，但语言语义以显式 namespace 声明为准。

identifier 合法性来自 lexer 的 UTF-8/XID 规则或共享 XID 表。name resolve、typed、lowering、backend 不得通过 `is_ascii*`、大小写、前后缀、`split` / `contains` 等字符串形状推导 namespace 或 identifier 语义。

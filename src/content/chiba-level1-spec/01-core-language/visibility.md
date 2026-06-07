# Public / Private 可见性

## 语法

当前方向是：

- 默认导出
- `private` 显式收窄
- `public use path.to.item` 显式 re-export

## 语义

可见性决定：

- 哪些名字可被 `use` 导入
- 哪些名字只在本地实现细节中可见
- namespace 边界上的重导出行为

level-1 的可见性按 namespace 生效，而不是按文件生效。

在跨 namespace 使用时，除显式 `private` 外，item 默认可见。

普通 item 不需要写 `public def`；public 是默认 item visibility。`public` 关键字在 level-1 中只用于 `public use`，表示当前 namespace 公开 re-export 某个已导入 item。

`public use` 不改变被 re-export item 的 owner namespace。它在当前 namespace 的 public interface 中增加 alias / re-export edge；下游可以通过当前 namespace 看到该项，但类型身份、method owner、constructor owner、static/global owner、source span 与 symbol id 仍来自原定义 namespace。

裸 `use` 只改变本地可见名称集合，不进入当前 namespace 的 public interface。

`data` 的 field 与 constructor 也遵循同一可见性故事；默认可暴露，`private` 可单独收窄。

constructor 名字冲突不通过“文件私有化”规避，而是通过按类型限定的解析路径处理。

## Usage

```chiba
namespace demo.math

data Option[T] = {
	Some(T)
	None
}

private def hidden(): i32 = 0

def public_value(): i32 = 1
```

```chiba
namespace demo.app

use demo.math

def main(): i32 = {
	let x = Option.Some(1)
	match x {
		Option.Some(v) => return v
		Option.None => return 0
	}
}
```

注释：跨 namespace 时，`public_value` 和 `Option` 默认可见；`hidden` 因为 `private` 不可见。constructor 采用按类型限定路径参与解析，避免不同 `data` 的同名 constructor 在导入后直接冲突。

```chiba
namespace demo.prelude

public use demo.math.add
public use demo.math.Option
```

注释：`demo.prelude` re-export `demo.math.add` 与 `demo.math.Option`。下游可以 `use demo.prelude.add` 或 `use demo.prelude.Option`，但这些 item 的 owner identity 仍是 `demo.math`。

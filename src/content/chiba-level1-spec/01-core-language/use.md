# Use

## 语法

`use` 用于导入名称，当前大纲包括：

- 单项导入
- multi import
- glob import
- `public use` re-export

## 语义

`use` 改变当前文件或 block 的可见名称集合，但不改变被导入定义的原始归属。

`use` 的作用域是 block 级

名称冲突编译器报错

裸 `use` 只影响当前 namespace / block 的本地可见名称集合，不会把导入项再次导出。

`public use path.to.item` 是 re-export。它把被导入项加入当前 namespace 的 public interface，使下游可以经由当前 namespace 继续导入或解析该项；但被 re-export 的 item 仍保留原始 owner namespace、symbol id、source span 与 intrinsic owner。re-export 只增加 public alias edge，不复制定义，不改变 nominal identity，不改变 method / constructor / static/global 的原始归属。

glob import 不可以再次导出

`use` 只改变当前可见名字集合，不改变原始 item 的归属 namespace。

## Usage

```chiba
use demo.math.add
use demo.io.{print, println}
use demo.prelude.*
public use demo.math.add
public use demo.io.println
```

注释：`use` 可以单项、multi 或 glob 导入；冲突名称在导入点直接报错。`public use` 表示 re-export，允许下游通过当前 namespace 看到该导入项，但 owner identity 仍是原定义处。

## 边界

glob import 不参与再次导出；导入优先影响名字可见性，而不是 item 身份。

`public use demo.prelude.*` 非法。glob import 只能作为本地可见性工具，不能形成 re-export edge，因为它会让 public interface 依赖外部 namespace 当前展开集合，破坏 interface summary 的稳定性。

`public use` 不能 re-export `private` item；若路径最终解析到 private item，必须在 re-export 处报错。

若多个 `public use` 在当前 namespace public interface 中引入同名项，必须按普通 name resolution 冲突规则稳定报 ambiguous / duplicate，不能依赖合并顺序。

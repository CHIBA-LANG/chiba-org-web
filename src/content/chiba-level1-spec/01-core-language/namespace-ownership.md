# Namespace Ownership and Identity

## 目标

namespace 是定义所有权边界，不是 source merge 后的标签。

这一规则用于保证 name resolution、method lookup、intrinsic ownership、debug manifest 与 backend symbol lineage 都能稳定追踪到原始定义。

## 语义

每个顶层 item 都拥有稳定身份：

```text
owner namespace + item path + symbol id
```

这个身份适用于：

- function
- static/global value
- nominal type
- data constructor
- method
- operator method
- intrinsic surface
- re-export alias

把多个 source file 合并进同一编译单元时，不得丢失 item 的 owner namespace。`prelude`、`std`、`metalstd` 和用户 namespace 都只是各自的 owner；`use` 只是把名字引入当前可见集合。

## Resolution 顺序

普通未限定名字解析按下面层级：

1. local / pattern / parameter binder
2. 当前 namespace 的 item
3. 显式 `use` 导入
4. default prelude import
5. compiler intrinsic namespace

同层 duplicate 必须报错。跨层允许 shadowing；例如 local binder 可以 shadow `use` 导入名。

冲突不能靠 source merge 顺序偷偷决定。

## Re-export

`public use` 在当前 namespace 增加 re-export edge，但不改变被导出 item 的 owner namespace。

```chiba
namespace lib.core
def id(x) = x

namespace app.prelude
public use lib.core.id
```

通过 `app.prelude.id` 看到的 item，其 owner 仍然是 `lib.core`。

## Backend 与 Manifest

lowering 后的 debug name 应保留 source-facing 路径，例如：

```text
source_path::namespace::item#specialization#lowering_role#stable_id
```

final ABI symbol 可以更短，但 manifest 必须能反查：

- source path
- owner namespace
- item path
- symbol id
- specialization key
- lowering role
- pass origin
- final mangled symbol

## 禁止事项

semantic / pipeline / backend / lowering 不得通过字符串形状重新推断 namespace、static/global 名称、callable 或 identifier 合法性。

这些阶段只能消费 parser AST、symbol table、typed facts、Core/CIR facts 与 lexer 提供的 UTF-8/XID identifier 结论。

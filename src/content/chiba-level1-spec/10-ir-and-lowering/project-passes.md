# Project Passes and P0 Gates

## 目标

本文固定 level-1 P0 的前端到中端 pass 边界。

这些 pass 是语义 gate，不是仅用于 dump 的调试步骤。每个 pass 都必须声明消费事实、产出事实、可并行边界与诊断边界。

## Pass 00: Project Surface Scan

扫描 source file header、`namespace`、`use`、item header、attrs、public/private surface，不进入函数体语义。

产出：

- `ProjectSurface`
- source file header facts
- namespace graph
- entry candidate facts
- 后续 namespace/body 任务队列

验收：

- N 个 source file 产出稳定排序的 `ProjectSurface`。
- 重复 namespace、非法 source-file header、显式 entry 冲突能诊断。
- 输出不依赖文件系统遍历顺序。

文件级 parse 可并行；最终 namespace graph 合并必须 deterministic reduce。

## Pass 01: Interface Summary Build

为每个 namespace 生成接口摘要：

- exported function signature
- type/data/union layout header
- method header
- static/global header
- generic parameter header
- row bound header
- visibility / re-export edge

跨 namespace body 编译只读 summary，不读对方函数体。

验收：

- 任意 namespace 可独立加载依赖 namespace 的 `.chiba.meta` 或 in-memory summary。
- 修改非导出函数体不改变 summary hash。
- 修改导出签名会改变 summary hash。

namespace 级并行；signature 层依赖环只能形成 SCC，SCC 内做确定性合并。

## Pass 02: TopDef / Kind Check

检查顶层定义 kind：

- function
- extern
- static/global value
- type/data/union
- method-style `def Type.method`
- generic header
- row bound header
- visibility
- `#[entry]`

extern day-0 surface 是：

```chiba
def f(args): ret = extern "abi" "symbol"
```

wasm backend 至少支持 `"wasi"` 与 canonical C/env ABI；`"C"` 与 `"c"` 内部归一化。其它 ABI 在这里稳定报错。

验收：

- 重复 top-level symbol 报错。
- 重复 constructor 报错。
- 非法 generic bound 报错。
- 多个 row bound 报错。
- method receiver 非 nominal 报错。
- `private` 跨 namespace 泄漏报错。
- `#[entry]` 标到非函数上报错。

## Pass 03: Name Resolve

把 body 内所有 value/type/path 引用解析为稳定 symbol id。

处理：

- `use`
- inline namespace
- constructor
- field
- method candidate index
- intrinsic namespace

generic body 中 shape-dependent method/operator 不在这里最终决议，只生成可延迟候选引用。

验收：

- 未定义名称报错。
- import 二义性报错。
- private 不可见报错。
- namespace path 错误报错。
- constructor arity 错误报错。
- 同一输入多次编译 symbol id 稳定。

## Pass 04: Alpha Conversion

给函数体、pattern binding、lambda、continuation binder、generic local binder 分配唯一 binder id。

后续 pass 不再按裸名字判断绑定关系。

验收：

- 同名 shadowing 产生不同 binder id。
- capture 不因改名改变语义。
- alpha dump 稳定可 golden test。

## Pass 05: Pattern Elaboration

把 `let` / `if let` / `match` / function parameter pattern 规范化为 `PatternCore`。

标记：

- refutable / irrefutable
- binding set
- constructor/literal/record/tuple destruct
- pattern matrix input

`let` 只接受 irrefutable DFT 子集；`if let` / `match` 接受 refutable pattern。非穷尽 `match` 在当前 level-1 按 warning 收口。

## Pass 06: HM + Row Inference

做基础 HM 推断、unify、let-generalization、row/open-row 约束生成、field access、record update、tuple、ADT、function type 检查。

tuple positional fields 固定为 `_1`, `_2`, ...

`TypeRef` / `RowShape` / `DynRowContract` 必须预留：

- `UsageColor`
- `SendColor`
- `ShapeId`

## Pass 07: Answer / Continuation Kind Check

检查：

- `reset` / `resetn` answer type
- `shift`
- implicit reset
- continuation kind
- resume count contract
- multi-resume replay-safety

`reset` 捕获 `Cont1`；`resetn` 捕获 `ContN`。跨 world/thread capture 或 resume 永远非法。

## Pass 08: World / Send / Escape / Capability Check

检查：

- `return`
- `break` / `continue`
- loop tag
- tail position
- escape / promotion
- `send` / `!send`
- world/thread boundary
- world-local
- `UnsafeRef`
- Atomic capability

产出 `SendColor`、`EscapeColor`、arena/reset boundary、world/thread legality 与 dyn package escape facts。

## Pass 09: Usage Analysis 0

在 typed/alpha core 上统计 binder、lambda、closure、continuation 的 `0 | 1 | many` 使用情况。

产出初步 `UsageColor`：

- single-use 倾向 `1`
- multi-resume/shared storage/dynamic package aliasing 倾向 `N`

## Pass 10: Generic Definition Check

在抽象 generic 参数下检查 generic body，生成 `GenericBodyIR` 与 `ObligationIR`。

obligation 包括：

- field
- method
- operator
- shape dispatch
- answer type
- generic continuation
- static row 与 dynamic package instantiation path

generic body 必须在定义期通过基本 well-formedness 检查，不能等实例化才发现 body 本身不可类型化。

## Pass 11: Method / Operator / Dispatch Index

建立 nominal method index、operator index、shape-dispatch candidate index。

默认 lookup 分层：

1. field-callable
2. receiver method
3. qualified callee

不做运行时全局 witness search。

## Pass 12: One-Pass CPS Transformation + Beta Reduction

用 meta-continuation 做 one-pass CBV CPS lowering，并在变换过程中 beta-reduce administrative redex。

禁止先生成朴素 CPS，再靠后续 pass 清行政 redex。

`reset` / `shift` / `resetn` 是真实控制边界，必须 materialize 清晰 CPS 节点并携带 answer type、continuation kind 与 usage facts。

## Pass 13: Usage Analysis 1

在 CPS Core 上重新统计 continuation、lambda、closure、function value 的 `0 | 1 | many` 使用情况。

这一步给 continuation simplification 与 closure conversion 提供最终事实。

## Pass 14: Continuation Simplification

删除 unused continuation，inline single-use continuation，把 many-use continuation 标记为 multi-resume package lowering 输入。

single-use `Cont1` 不分配 runtime object；真正 many-use `ContN` 才付实体化成本。

## Dump 要求

source、resolved、alpha、typed、usage-colored typed、CPS、closure-converted、specialized、CoreIR、layout、final symbol map 都要可 dump。

每层 dump 至少显示：

- source span
- owner namespace
- symbol id
- type
- usage/send/escape/replay colors
- continuation kind
- callable storage kind
- dyn/static access kind
- mangled/debug name

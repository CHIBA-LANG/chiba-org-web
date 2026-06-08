# Level-1 P0 Semantic Gates

本文把 level-1 P0 的收口标准写成可验收的 compiler gate。

P0 不是“所有语法都能 parse”，也不是“某个 backend 恰好能跑一个例子”。P0 表示下面这些语言级事实已经在 frontend、typed/CIR、lowering、backend manifest 与测试中被稳定保留。

## 0. 禁止字符串形状语义推断

lexer / chibalex / regex tokenization 之外的 pass 不得通过字符串形状推导语义。

禁止的做法包括：

- 用 `is_ascii*` 判定 identifier 合法性。
- 用 `split` / prefix / suffix / contains 推断 namespace、static/global、callable、type 或 intrinsic 身份。
- 在 semantic / pipeline / backend / lowering 中重新解析 source name 字符串来决定语义。

合法来源只有：

- parser AST。
- lexer 产出的 UTF-8 / XID token fact。
- symbol table 与 owner namespace。
- typed facts。
- Core / CIR facts。
- 共享 XID 表。

## 1. Pass 00: Project Surface Scan

Project surface scan 只读取 source file header、namespace、use、item header、attrs、visibility 与 public/private surface。

它不得进入函数体语义，不得做 expression typecheck，不得依据字符串形状猜测 item kind。

验收要求：

- 多文件输入产出稳定排序的 `ProjectSurface`。
- namespace graph 不依赖文件系统遍历顺序。
- 重复 namespace、非法 source-file header、多个显式 entry 能诊断。
- disabled `compile_if` item 不进入 binding、method candidate、namespace export 或 backend symbol。

## 2. Pass 01: Interface Summary Build

Interface summary 是 namespace 并行编译边界。

summary 至少记录：

- exported function / extern / static signatures。
- type / data / union layout header。
- method header 与 receiver nominal identity。
- generic parameter header 与 row bound header。
- visibility 与 owner namespace。
- source-facing debug path 与稳定 symbol id。

验收要求：

- namespace body 编译只读依赖 namespace 的 summary。
- 修改非导出函数体不改变 summary hash。
- 修改导出签名、visibility、owner namespace、entry fact 或 method header 会改变 summary hash。
- summary 序列化不依赖合并顺序。

## 3. Pass 02: TopDef / Kind Check

TopDef / Kind Check 只检查顶层定义 header 良构性。

level-1 首发需要稳定处理：

- `def`、`extern`、`static`、`type`、`data`、`union`。
- method-style `def Type.method`。
- generic header 与 row bound header。
- `#[entry]` 只能标在可作为入口的函数定义上。
- extern ABI day-0 支持 `"wasi"`、`"C"`、`"c"`，内部归一化 canonical C/env ABI。

验收要求：

- 重复 top-level symbol、重复 constructor、非法 generic bound、多个 row bound、method receiver 非 nominal、private 跨 namespace 泄漏都报错。
- `entry` on non-function 报错。
- 多个 explicit entry 报错。

## 4. Name / Alpha / Pattern / HM+Row

P0 至少要求下面的 typed 事实稳定出现：

- 所有 value/type/path reference 都解析到稳定 symbol id。
- shadowing 后的 binder 使用 alpha/binder id 区分，不按裸名字区分。
- `let` 只接受 irrefutable destruct 子集；`if let` / `match` 可接受 refutable pattern。
- function parameter pattern 是语言特性，不能只作为手工 desugar 约定。
- row 字段 canonical 排序，tuple positional row 字段固定为 `_1`、`_2`、...
- field access 产出 `StaticRowAccess` 或等价 typed fact；dynamic package 产出 `DynRowAdapterAccess`。

## 5. Continuation / Callable Gate

P0 continuation gate 以 `reset`、`resetn`、`shift` 为核心。

验收要求：

- `reset` 下 `shift` 捕获 `Cont1[A, B]` / `cont1 (A) -> B`。
- `resetn` 下 `shift` 捕获 `ContN[A, B]` / `contN (A) -> B`。
- continuation kind 只由 delimiter 决定，不由 callable storage 猜。
- answer type mismatch 在 typed / continuation check 阶段报错。
- 静态可证明重复 resume `Cont1` 是 compiler error。
- 通过 erased callable storage 才可观察到的第二次 `Cont1` 调用必须 trap。
- `ContN` 可重复 resume，但必须通过 replay-safety。
- 捕获 `Ref[T]` / `UnsafeRef[T]` 采用 shared-reference 语义，不 snapshot、copy 或 rollback。
- `((A) -> B) send` 排除 `Cont1`、boxed `Cont1`、`ContN` 与所有 `!send` closure。

## 6. Method / Operator / Dynamic Row Gate

`a.b(c)` 的解析顺序固定为：

1. field callable：若值 `a` 有字段 `b`，按 `(a.b)(c)`。
2. receiver method：若没有字段，再查 concrete nominal receiver method。
3. qualified callee：若 `a` 是 type / namespace path，按 `(a.b)(c)`，不注入 receiver。

dynamic row package 使用同一顺序构造 adapter。若 expected type 是 `dyn {r | x: A, y: B}`，静态值进入 dyn 时必须打包 payload、field adapter、bound receiver method adapter 与 optional nominal/debug identity。

验收要求：

- 同名字段存在时，不偷偷选择同名 receiver method。
- row constraint 只能证明字段，不证明 nominal method。
- dynamic package 调用走 package 内 adapter，不做运行时全局 impl search。
- `dyn` 反向回 concrete nominal type 不自动发生，必须 explicit checked conversion。

## 7. CPS / Lowering Gate

P0 的 CPS lowering 是 one-pass CBV CPS + beta reduction。

验收要求：

- atom / variable lowering 不生成 administrative continuation。
- `f(x)` / `f(g(x), y)` 不产生 object-level administrative beta-redex 链。
- call / tuple / record / ADT ctor / operator args 按 CBV 左到右求值。
- `reset` / `shift` / `resetn` materialize 清晰 CPS 节点，并携带 answer type、continuation kind、usage/send/escape facts。
- CIR 不携带 Wasm-GC struct layout、`funcref` / `eqref`、WAT opcode、Binaryen feature 或 target ABI 细节。

## 8. Backend / Manifest Gate

backend 可以使用目标专用 layout，但只能消费 typed/CIR 语言级事实。

manifest / debug map 至少需要能从 final symbol 反查：

- source path。
- owner namespace。
- item path。
- stable symbol id。
- specialization key。
- lowering role。
- pass origin。
- layout / ownership lowering decision。

final ABI symbol 可以较短，但不能成为唯一可观察身份。

## 9. P0 完成判定

P0 完成需要同时满足：

- spec 已写清语义与 gate。
- implementation 对应 gate 有 parser / typed / CIR / backend 或 manifest 证据。
- 正例、反例、golden / dump / runtime 测试覆盖关键路径。
- wasm-gc 主 target 可运行已承诺 runtime surface。
- no-GC wasm 仍可共享 target-neutral CoreIR / BIR 语言事实，不能要求中端知道 Wasm-GC layout。

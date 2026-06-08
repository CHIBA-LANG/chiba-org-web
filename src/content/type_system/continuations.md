# Chiba Level 1 Continuations Spec

## 0. 范围

本文规定 Chiba level-1 中 `reset` / `resetn` / `shift`、continuation、answer type checking、usage color 的最小语义边界。

本文只讨论 level-1。

本文明确：

- level-1 必须进行 answer type checking。
- level-1 不引入 answer type polymorphism。
- continuation 在类型与运行时语义上都不等同于普通 closure。
- continuation kind 由 delimiter 决定：`reset` 产生 single-shot 边界，`resetn` 产生 multi-shot 边界。
- continuation 与 callable / aggregate type 必须能携带 `1` / `N` usage color。

## 0. Scope

This document defines the minimum semantic boundary for `reset`, `resetn`, `shift`, continuations, answer type checking, and usage color in Chiba level-1.

It only discusses level-1. In particular, level-1 must perform answer type checking, must not introduce answer type polymorphism, must not treat continuations as ordinary closures, and must keep continuation usage color visible to typing and lowering.

## 1. 基本规则

因为 level-1 已经包含 `reset` / `resetn` / `shift`，所以 continuation 相关检查必须在 level-1 解决，而不是推迟到 level-2。

level-1 至少要求：

- `reset` / `resetn` / `shift` 的 typing rule。
- continuation 捕获时的上下文约束。
- answer type checking。
- continuation 与 arena / escape 边界的关系。
- `Cont1` / `ContN` 与 `1` / `N` usage color 的一致性。

此外，continuation 默认属于受限控制能力，而不是可自由发送的普通值。它可以参与 callable 泛化与显式存储规则，但必须保留 continuation kind、answer type、usage color 与边界信息，不能被洗成普通 closure。

## 1. Basic Rules

Because level-1 already contains `reset`, `resetn`, and `shift`, continuation-related checking must also be solved at level-1 rather than postponed to level-2.

At minimum, level-1 needs typing rules for `reset`, `resetn`, and `shift`, context constraints for capturing continuations, answer type checking, rules describing how continuations interact with arena and escape boundaries, and consistency between `Cont1` / `ContN` and `1` / `N` usage color.

Continuations are restricted control capabilities, not ordinary closures. They may participate in callable generalization and explicit storage rules, but their continuation kind, answer type, usage color, and boundary information must remain visible to the checker and lowering pipeline.

## 2. Answer Type

在普通表达式检查中，只问“这个表达式的值类型是什么”是不够的。

对于 `reset` / `resetn` / `shift`，还必须问：

- 当前控制片段最终回答成什么类型。
- 当前 delimiter 是 single-shot 还是 multi-shot。

本文把第一个类型称为 answer type。

每个 `reset` / `resetn` 都引入自己的局部 answer type，并要求与之相关的 `shift`、continuation 恢复、离开路径在同一 answer type 下成立。

## 2. Answer Types

For ordinary expressions it is not enough to ask only for the value type. With `reset`, `resetn`, and `shift`, the checker must also ask what type the current control fragment ultimately answers with and whether the current delimiter is single-shot or multi-shot.

The first type is the answer type. Every `reset` / `resetn` introduces its own local answer type, and all related `shift` bodies, continuation resumes, and exit paths must agree on that same answer type.

## 3. `reset` / `resetn` 的角色

`reset` 与 `resetn` 都建立 delimited continuation 控制边界。

二者的区别是 usage color：

- `reset` 建立 single-shot / affine 边界；其中的 `shift` 捕获 `Cont1[A, B]`。
- `resetn` 建立 multi-shot / repeatable 边界；其中的 `shift` 捕获 `ContN[A, B]`。

在类型层面，它至少引入：

- 一个局部 answer type。
- 一个可被 `shift` 捕获的 continuation 边界。
- 一个边界 usage color：`1` 或 `N`。

在内存层面，它也天然对应一个 arena / region 边界。

因此，`reset` / `resetn` 同时是：

- 控制边界。
- answer type 边界。
- arena / region 边界。
- continuation usage color 边界。

## 3. The Role of `reset` and `resetn`

`reset` and `resetn` both establish delimited continuation control boundaries.

The difference is usage color:

- `reset` establishes a single-shot / affine boundary; `shift` inside it captures `Cont1[A, B]`.
- `resetn` establishes a multi-shot / repeatable boundary; `shift` inside it captures `ContN[A, B]`.

On the type side each delimiter introduces at least a local answer type, a continuation boundary that `shift` may capture, and a boundary usage color: `1` or `N`. On the memory side it also corresponds naturally to an arena or region boundary.

So a `reset` / `resetn` is simultaneously a control boundary, an answer-type boundary, an arena or region boundary, and a continuation usage-color boundary.

## 4. `shift` 的角色

`shift` 从最近的 `reset` 或 `resetn` 中捕获 continuation。

这里的 continuation 不是一个普通函数值的平凡别名，因为它天然携带：

- 当前 answer type。
- 当前控制边界。
- 与当前 `reset` / `resetn` 相关的上下文信息。
- 来源边界的 usage color。

因此 continuation 只能在与其来源边界兼容的上下文中恢复。

## 4. The Role of `shift`

`shift` captures a continuation from the nearest surrounding `reset` or `resetn`.

That continuation is not a trivial alias for an ordinary function value because it carries the current answer type, the current control boundary, the usage color of the delimiter, and context tied to its source `reset` / `resetn`. As a result, a continuation may only be resumed in contexts compatible with its origin boundary.

## 5. 最小 Typing 要求

本文暂不写完整形式化推导规则，但 level-1 至少要满足下面的 typing 直觉：

- 若某个洞位期望值类型 `A`。
- 当前 `reset` / `resetn` 的 answer type 为 `R`。
- 若来源边界是 `reset`，则被捕获 continuation 是 `Cont1[A, R]`。
- 若来源边界是 `resetn`，则被捕获 continuation 是 `ContN[A, R]`。

同时，`shift` 的 body 也必须在同一个 `R` 下被检查。

`cont1 (A) -> R` 与 `contN (A) -> R` 是上述 continuation 类型的 surface sugar。它们可以在 callable shape 中出现，但不表示 continuation 与普通 closure 在实现或合法性上完全同构。

## 5. Minimal Typing Requirements

The document does not yet spell out a complete formal typing derivation, but the level-1 intuition is clear:

- If a hole expects a value of type `A`.
- If the current `reset` / `resetn` has answer type `R`.
- If the source boundary is `reset`, then the captured continuation is `Cont1[A, R]`.
- If the source boundary is `resetn`, then the captured continuation is `ContN[A, R]`.

The body of `shift` must also be checked under that same `R`. `cont1 (A) -> R` and `contN (A) -> R` are surface sugar for those continuation types. They may appear in callable shapes, but this does not mean continuations are identical to ordinary closures in implementation or legality.

## 6. Answer Type Checking

level-1 必须保证：

- 同一个 `reset` / `resetn` 内的 continuation 恢复与离开遵守同一 answer type。
- `shift` body 与 surrounding `reset` / `resetn` 的 answer type 一致。
- 不能在 answer type 不一致的上下文中恢复 continuation。
- `Cont1` 最多恢复一次。
- `ContN` 可以重复恢复，但必须通过 replay-safety 检查。

这些都是 level-1 的硬规则，而不是优化建议。

## 6. Answer Type Checking

Level-1 must guarantee that continuation resumes and exits inside the same `reset` / `resetn` obey a single answer type, that the body of `shift` is consistent with the surrounding delimiter, and that continuations are never resumed in contexts with mismatched answer types.

`Cont1` may be resumed at most once. `ContN` may be resumed repeatedly only after replay-safety checking. These are hard semantic rules for level-1, not optional optimizations.

## 7. Answer Type Polymorphism 不进入 Level-1

level-1 不做 answer type polymorphism。

原因包括：

- continuation 已经与 checked template 强耦合。
- continuation 已经与 method / operator / shape dispatch 间接耦合。
- continuation 已经与 arena / escape / `Ref` 边界耦合。
- 若再引入 answer-type poly，局部类型检查会明显退化。

因此，当前方向是：

- 每个 `reset` / `resetn` 在单一 answer type 下检查。
- continuation 恢复要求 answer type 一致。
- 同一个 continuation 不在 level-1 中被设计成可跨不同 answer type 自由复用。

## 7. Why Answer Type Polymorphism Stays Out of Level-1

Level-1 deliberately excludes answer type polymorphism.

The reason is not that continuations are unimportant, but that continuations are already strongly coupled with checked templates, method and operator resolution, shape dispatch, arena and escape rules, and the value-versus-reference distinction. If answer types also become polymorphic, the locality of type checking degrades too much.

The intended direction is one answer type per `reset` / `resetn`, with resumptions that must remain consistent under that answer type.

## 8. 与值 / 引用区分的关系

level-1 需要区分值类型与引用类型。

continuation 不应被简单地看作“又一个普通值类型”。

更准确地说，continuation 应被视为一种特殊 callable kind：

- 它在签名层可表现为箭头类型。
- 但在恢复语义、answer type、arena legality、usage color 上不同于普通 closure。

至少在规则上，它需要被单独看待，因为它会影响：

- escape legality。
- `send`。
- arena 边界。
- checked-template 泛化限制。

## 8. Relation to Value and Reference Distinctions

Level-1 has to distinguish value types from reference types, and continuations should not be treated as just another ordinary value type.

It is more accurate to view a continuation as a special callable kind: it can look like an arrow type at the signature layer, but its resume behavior, answer-type discipline, arena legality, and usage color differ from those of normal closures. This distinction matters for escape legality, `send`, arena boundaries, and checked-template generalization limits.

## 9. 与隐式 `reset` 的关系

普通函数调用与 closure 调用都蕴含隐式 `reset`。

因此 continuation 不只出现在显式控制原语附近，它还和默认的调用边界发生关系。

这意味着至少需要回答：

- continuation 是否允许跨越 callee 局部 arena。
- continuation 是否允许被返回。
- continuation 是否允许被 closure capture。
- continuation 是否允许跨 world 发送。

当前方向应保持保守。

因此，普通函数与 closure 的隐式 `reset` 语义会直接影响 continuation 的合法捕获与恢复范围。

## 9. Relation to Implicit `reset`

Ordinary function calls and closure calls both imply an implicit `reset`, which means continuations are not only a concern near explicit control operators but also at default call boundaries.

The checker therefore needs to answer whether a continuation may cross a callee-local arena, be returned, be captured by a closure, or be sent across worlds. The current direction should stay conservative, and the implicit-`reset` semantics of functions and closures directly determine the legal capture and resume range of continuations.

## 10. Checked Template × Continuation

checked template 与 continuation 的组合属于高风险区。

level-1 当前规则方向是：

- 含 continuation 的表达式泛化应比普通表达式更保守。
- template continuation 不应默认享有普通值那样的自由多态。
- continuation 相关 obligation 不能只看 shape，还要看 control context。

这意味着 continuation 相关 checked-template 规则不应仅被视为普通 shape-based template 的特例。

## 10. Checked Template × Continuation

The interaction between checked templates and continuations is a high-risk area.

The intended level-1 rule is to be more conservative than ordinary expressions: continuation-bearing expressions should generalize less freely, template continuations should not inherit the full polymorphic freedom of ordinary values, and continuation obligations should be checked against control context rather than shape alone.

## 10.1 Callable storage

continuation 可以进入 callable surface，但不能因此丢失 continuation 身份。

level-1 固定下面 storage 规则：

- `cont1 (A) -> B` / `Cont1[A, B]` 表示 one-shot continuation。
- `contN (A) -> B` / `ContN[A, B]` 表示 multi-shot continuation。
- 参数位置的 `(A) -> B` 是 checked-template callable obligation，可由 function、closure、`Cont1` 或 `ContN` 实例化，但实例化后必须保留 callable storage kind。
- 存储位置的 `(A) -> B` lower 成 erased callable ADT，variant 至少包含 function、closure、boxed `Cont1`、`ContN`。
- 显式 `cont1 (A) -> B` storage lower 成 boxed one-shot consumed-state machine。第一次调用 consume；第二次调用必须是 compile-time diagnostic 或 runtime trap。
- 显式 `contN (A) -> B` storage lower 成 repeatable continuation package，可多次 resume。
- `((A) -> B) send` 排除 `Cont1`、boxed `Cont1`、`ContN` 与所有 `!send` closure。
- no-capture closure 必须优化为 direct function / funref / inline，不分配 closure env。
- storage 后调用必须保留 callable storage kind；record field、tuple field、return value、global/static storage 中取出的 callable 调用也要走同一规则。

非逃逸且静态 exactly-once 的 `Cont1` 必须 direct resume / inline / tail jump，不应分配 continuation package。逃逸或进入普通 callable storage 的 `Cont1` 才需要 boxed one-shot state machine。

## 10.1 Callable Storage

Continuations may enter callable surfaces, but that must not erase their continuation identity.

Level-1 fixes the following storage rules:

- `cont1 (A) -> B` / `Cont1[A, B]` is a one-shot continuation.
- `contN (A) -> B` / `ContN[A, B]` is a multi-shot continuation.
- A parameter-position `(A) -> B` is a checked-template callable obligation that may instantiate to a function, closure, `Cont1`, or `ContN`, while preserving callable storage kind after instantiation.
- A storage-position `(A) -> B` lowers to an erased callable ADT with at least function, closure, boxed `Cont1`, and `ContN` variants.
- Explicit `cont1 (A) -> B` storage lowers to a boxed one-shot consumed-state machine. The first call consumes it; the second call must be a compile-time diagnostic or a runtime trap.
- Explicit `contN (A) -> B` storage lowers to a repeatable continuation package.
- `((A) -> B) send` excludes `Cont1`, boxed `Cont1`, `ContN`, and all `!send` closures.

A non-escaping statically exactly-once `Cont1` must be direct-resumed, inlined, or tail-jumped rather than allocated as a continuation package. A `Cont1` needs a boxed one-shot state machine only when it escapes or enters ordinary callable storage.

No-capture closures must lower to direct function / funref / inline form rather than allocating a closure environment. Calls after storage in record fields, tuple fields, return values, globals, or ordinary callable slots must preserve callable storage kind; they are not reclassified by backend name or layout.

## 10.2 Capture semantics

continuation 捕获的是当前 delimited context 中需要重放或恢复的语言级事实，包括 local、global、parameter、closure capture 与必要的 aggregate field access。

捕获行为按值类别区分：

- 普通 immutable value 按 continuation kind 的 replay 需求记录。
- global value 按其 owner namespace / static identity 捕获引用事实，不靠 source name 字符串重查。
- parameter / local binder 按 alpha/binder id 捕获，不按裸名字捕获。
- `Ref[T]` 与 `UnsafeRef[T]` 捕获 cell identity，采用 shared-reference 语义；multi-shot continuation 不 snapshot、copy 或 rollback 这些 cell。
- 因此 `ContN` 捕获 `Ref[T]` / `UnsafeRef[T]` mutation context 默认 replay-unsafe，除非在明确 rollback region 或其它已证明 replay-safe 的边界内。

这条规则同时覆盖普通 capture 和存储后再调用：continuation 被放进 record field、tuple field、record update field、callable return 或参数后再 resume，也必须保留同一套 capture facts。

## 10.2 Capture Semantics

A continuation captures the language-level facts needed to resume or replay the current delimited context: locals, globals, parameters, closure captures, and required aggregate field-access context.

Capture is classified by value category:

- Ordinary immutable values are recorded according to the replay needs of the continuation kind.
- Global values are captured by owner namespace / static identity facts, not by re-resolving source-name strings.
- Parameters and local binders are captured by alpha / binder id, not by bare names.
- `Ref[T]` and `UnsafeRef[T]` capture cell identity with shared-reference semantics. Multi-shot continuations do not snapshot, copy, or roll back those cells.
- Therefore `ContN` capture of `Ref[T]` / `UnsafeRef[T]` mutation context is replay-unsafe by default unless it is inside an explicit rollback region or another proven replay-safe boundary.

The same rules apply after storage and later call. If a continuation is placed in a record field, tuple field, record-update field, callable return, or parameter and then resumed, the stored value must preserve the same capture facts.

For `Cont1`, static repeated resume is a compiler error when usage analysis can prove it. If the repeat is only observable through erased storage or dynamic dispatch, the boxed one-shot state machine must trap on the second call. `ContN` remains repeatable, subject to replay-safety and send/world restrictions.

## 11. Usage Color and Rust Reference Mapping

level-1 continuation 与 callable 类型必须携带 usage color：

- `1`：affine / single-shot。`Cont1` 是 `1`。
- `N`：repeatable / shared。`ContN` 与 top-level function 是 `N`。
- closure 的 color 由 capture set、escape 与 callable storage 推导。
- struct / type / data 的 aggregate shape 也要能记录 color，以便 capture 与 replay-safety 检查不丢失所有权语义。

Rust reference compiler 中，`Rc[T]` 不直接等价于 Chiba source-level `T`。它是 reference lowering AST 的可视化证据：Rust 为了表达多路径持有而写出的 `Rc[YYY]`，在 Chiba source 里仍可写成普通 `YYY`，但类型检查与 lowering 后必须显式出现 `N YYY`。

例如 Rust reference lowering 可显示为：

```text
fn xxx(x: Rc<YYY>) -> ZZZ
```

对应 Chiba source 可以是：

```chiba
def xxx(x: YYY): ZZZ
```

类型检查后的 Chiba typed/lowered AST 必须能显示为：

```text
def xxx(x: N YYY): 1 ZZZ
```

这里 `N YYY` 必须和当前实现中的 usage-color 标注对上；返回值若不需要共享或重放，则可标成 `1 ZZZ`。因此 Rust `Rc` 的作用是帮助审计 Chiba lowering 是否保留了 `N`，不是要求用户在 Chiba source 里写 `Rc`。

## 11. Usage Color and Rust Reference Mapping

Level-1 continuation and callable types must carry usage color:

- `1`: affine / single-shot. `Cont1` is `1`.
- `N`: repeatable / shared. `ContN` and top-level functions are `N`.
- Closure color is inferred from captures, escape, and callable storage.
- Struct / type / data aggregate shapes must also be able to record color, so capture and replay-safety checks do not erase ownership semantics.

In the Rust reference compiler, `Rc[T]` is not directly equivalent to source-level Chiba `T`. It is visible evidence in the reference lowering AST: when Rust needs `Rc<YYY>` to express multi-path ownership, Chiba source may still write plain `YYY`, but type checking and lowering must expose `N YYY`.

For example, reference Rust lowering may show:

```text
fn xxx(x: Rc<YYY>) -> ZZZ
```

The corresponding Chiba source may be:

```chiba
def xxx(x: YYY): ZZZ
```

After Chiba type checking, the typed/lowered AST must be able to show:

```text
def xxx(x: N YYY): 1 ZZZ
```

The `N YYY` annotation must match the implementation's current usage-color representation. If the return does not need sharing or replay, it may be `1 ZZZ`. Therefore Rust `Rc` is an audit signal for whether Chiba lowering preserved `N`; it is not a requirement that users write `Rc` in Chiba source.

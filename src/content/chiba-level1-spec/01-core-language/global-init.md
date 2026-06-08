# Global Values and Module Init

## 语法

level-1 的顶层值使用不带参数列表的 `def`：

```chiba
def ONE: i64 = 1
def TWO: i64 = ONE + 1

#[world_local]
def LOG: Ref[File] = {
	let file = open("/tmp/chiba.log", "a")
	Ref.new(file)
}
```

零参数函数仍写成 `def f(): T = expr`。它不是静态值。

## 语义

顶层值表示 module-owned binding。它可以是编译期常量，也可以需要 module init 阶段执行初始化表达式。

level-1 固定下面规则：

- `def x: T = expr` 是静态值 surface。
- `def x(): T = expr` 是零参数函数，不再作为伪常量使用。
- 顶层值允许顺序依赖已经声明的顶层值。
- 依赖环一律拒绝，包括直接环和跨多个顶层值形成的间接环。
- 初始化表达式允许副作用；执行时机是 module load / module init。
- record init block 和普通顶层 value init 共享同一 module init 纪律。

初始化顺序由顶层依赖图决定。没有依赖关系的值可以按稳定 source order 或确定性拓扑顺序初始化；实现不得依赖文件系统遍历顺序。

## 错误

下列情况必须报错：

- 顶层值依赖形成 cycle。
- 顶层 `Ref[T]` 没有显式 `#[world_local]`。
- `#[entry]` 标到静态值上。
- 初始化表达式在 module init 边界跨 world/thread 泄漏不允许 escape 的值。

## Usage

```chiba
def BASE: i64 = 40
def ANSWER: i64 = BASE + 2

def main(): i64 = ANSWER
```

注释：`ANSWER` 可以依赖前面声明的 `BASE`。如果 `BASE` 反过来依赖 `ANSWER`，编译器必须拒绝，而不是生成运行时 lazy cycle。

## 边界

module init 是语言语义，不是某个 backend 的链接器巧合。后端可以把 init 编译成 start function、显式 init thunk 或 runtime registration，但 Core/CIR 必须先携带 module-owned binding、dependency edge、init order 与 world-local facts。

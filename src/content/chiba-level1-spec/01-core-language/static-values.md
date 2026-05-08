# 顶层静态值定义

## 语法

使用 `def` 但是不加 `()` 来创建顶层静态值类型

```chiba
def PI : f32 = 3.14159265358

#[world_local]
def FILE : Ref[File] = {
    let f = open("/tmp/log", "rw")
    Ref.new(f)
}

// in function will lift to top
def f() = {
    def E : f32 = 2.7
    def EPlusPI : f32 = E + PI
}
```

顶层 `Ref[T]` 必须显式写 `#[world_local]`。

所以下面的虽然看起来很危险但是是合法的，因为它明确声明为 world-local global cell：

```chiba
#[world_local]
def FILE : Ref[File] = {
    let f = open(f, "rw")
    Ref.new(f)
}
```

不写 `#[world_local]` 的顶层 `Ref[T]` 不合法；需要跨 world 共享的可变状态请使用 Atomic，或者在 unsafe 边界中使用 `UnsafeRef[T]`。

顶层 `UnsafeRef[T]` 是另一条边界：它会被翻译成 static mutable shared handle。语言只承认它是 unsafe shared global，不保证同步、可见性、ordering 或数据竞争安全。

## 语义

如果顶层静态值类型非静态类型
则会塞入stub并在init的时候codegen初始化行为

普通顶层静态值表示稳定的顶层绑定。

`#[world_local] def x: Ref[T] = expr` 表示每个 world 拥有一份独立的 `Ref[T]` cell。它不是 shared global mutable state，也不会把 `Ref[T]` 变成 `send`。

需要跨 world 共享的可变全局状态必须使用 Atomic；如果需要低级 shared-owned unsafe handle，则使用 `UnsafeRef[T]` 或后续显式 shared capability。

`def x: UnsafeRef[T] = expr` 不需要 `#[world_local]`。它表示全局 static mutable unsafe handle，所有跨 world 访问都必须由用户或库层协议保证同步。它不能被当成 safe shared mutable global。

level-1 支持顶层静态值。

顶层静态值不要求编译期常量初始化；初始化逻辑进入模块或程序的 `init` 阶段执行。

因此静态值的语义重点是“存在稳定的顶层绑定”，而不是“必须可 constexpr 求值”。

## Usage

```chiba
#[world_local]
def stdout_file: Ref[File] = {
    let f = open("/dev/stdout", "w")
    Ref.new(f)
}

def pi: f32 = 3.1415926

def shared_state: UnsafeRef[State] = open_shared_state()
```

注释：`pi` 是普通静态值；`stdout_file` 是 world-local 顶层 `Ref`，初始化可发生在每个 world 的 init 阶段而非编译期常量折叠。`shared_state` 是 static mutable unsafe handle；它的同步安全不由语言保证。
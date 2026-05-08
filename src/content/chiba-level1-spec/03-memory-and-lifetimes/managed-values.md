# 普通值默认是 Managed Value

## 语法

该条目描述默认语义，不新增独立语法。

## 语义

普通 `data`、tuple、record、closure env 默认按 managed value 处理，不要求用户为日常值显式标注 unique 或 reference 类修饰。

`Array[T]` 也按普通 managed value 处理。level-1 中 `Array[T]` 没有 safe internal mutability；它不是 mutable buffer capability。

这里的 managed 不是 GC 同义词，而是“受 arena / escape / promotion / RC 规则统一管理”的值语义。

低级 capability 类型如 `Ptr[T]`、`Ref[T]`、`UnsafeRef[T]` 不属于这条默认 managed value 路线。

普通 managed value 的更新语义总是产生新值。record update `{base | field: value}` 和 array update helper 都应被理解为 whole-value update；lowering 可在 uniqueness / escape 允许时做原地复用优化，但 surface 语义不是可变容器写入。

## Usage

```chiba
data User {
	User(name: String, age: i32)
}

let u = User("a", 10)
```

注释：`u` 是普通 managed value；它默认走 level-1 的 managed 内存语义，而不是要求用户显式选择底层 capability 模式。

```chiba
let xs: Array[i64] = [1, 2, 3]
// xs[0] := 9  // error: Array[T] is not internally mutable
```

注释：`Array[T]` 是普通值；元素更新需要构造新 array value，或通过 `Array[Ref[T]]` 存储显式可变 cell。

## 边界

当程序进入 FFI、Metal、ABI 或共享可变能力边界时，应显式改用 capability 类型，而不是依赖 managed value 自动退化。

# `def`

## 语法

`def` 定义普通函数，也可参与 `extern` 形式与 method-style 定义。

## 语义

`def` 引入可调用顶层绑定。其主体可能是普通 block，也可能是外部声明或特殊 ABI 入口。

`def` 也可定义 method-style item。level-1 正式引入 `def Type.method(...)`，方向接近 Go 的 receiver method，而不是 trait witness 风格的方法定义。

普通 `def` 与 method-style `def Type.method(...)` 共享同一套函数定义基底；差异只在 receiver 关联与 method resolution。

## 参数类型推断与自动泛化

普通非 `extern` 函数允许省略参数与返回值类型。

```chiba
def f(a, b, c) = expr
```

`a`、`b`、`c` 会先获得 fresh inference variable。函数体的使用点负责收集约束：具体类型需求按普通 unify 处理；字段访问、method call、operator、shape dispatch 等需求生成 structural obligation。函数体检查完成后，仍未具体化的自由变量与其 obligation 在函数边界自动泛化为隐式 generic 参数。

例如：

```chiba
def id(x) = x
```

检查后等价于：

```chiba
def id[T](x: T): T = x
```

而：

```chiba
def get_name(x) = x.name
```

会生成类似：

```chiba
def get_name[T: {r | name: a}](x: T): a = x.name
```

这不是旧 C++ 模板式“定义期不检查”。函数体仍必须在抽象参数与已收集 obligation 下通过定义期类型检查。

显式 `[T]` 是定义期 HM 环境中的类型变量 binder，但函数体检查时它是 rigid abstract type，不是可被函数体随意解成 concrete type 的 inference hole。

因此：

```chiba
def bad[T, F](value: T): F = value
```

除非有其他约束证明 `T == F`，否则必须报错。返回类型写 `F` 不表示函数体能凭空构造 `F`。

合法写法包括：

```chiba
def id[T](value: T): T = value
def map_one[T, F](value: T, convert: fn(T): F): F = convert(value)
```

`extern` 是 ABI 边界，参数与返回值必须显式标注 ABI 类型，不能靠自动泛化。

## Row 参数简写

函数参数上的 row 标注是 row-bound generic 参数的简写。

```chiba
def f(a: {r | name: Str}) = a.name
```

等价于：

```chiba
def f[T: {r | name: Str}](a: T) = a.name
```

该 row 约束是 open-row shape obligation，不是 closed record type，也不会抹掉 concrete nominal identity。多个参数分别使用 row 简写时，默认各自引入 fresh synthetic generic；只有显式复用同一个命名类型变量时才表示它们必须是同一个类型参数。

# Method-Style `def Type.method(...)`

## 语法

method-style 定义采用：

```chiba
def Type.method(self, ...)
```

的方向。

## 语义

这种写法把方法定义挂到某个 nominal receiver type 之上。level-1 不依赖 interface witness，也不把 method receiver 降成 structural receiver shape；默认规则就是 nominal method resolution。

`self` 绑定到 owner nominal type。method body 内可使用 receiver-scope alias `Self` 表示这个 owner type：

```text
Self := Type
self : Self
```

若 owner 带 generic 参数，例如：

```chiba
type Box[T] { value: T }

def Box[T].get(self): T = self.value
```

则 method scope 中 `Self := Box[T]`，`self : Box[T]`。`Self` 不是普通 top-level type name，也不是 row 约束；它只在 method receiver scope 内有效。

method-style `def` 是 level-1 的正式能力。

## Usage

```chiba
data Vec2 {
	x: f32,
	y: f32,
}

def Vec2.norm(self): f32 = {
	return sqrt(self.x * self.x + self.y * self.y)
}
```

注释：`Vec2.norm` 采用 receiver 风格定义，surface 上是 method，但它的归属仍然绑定到 `Vec2` 这个 nominal type，而不是绑定到某个 shape。

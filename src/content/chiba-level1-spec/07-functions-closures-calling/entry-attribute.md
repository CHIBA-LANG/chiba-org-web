# `#[entry]`

## 语法

`#[entry]` 标记程序入口函数。

```chiba
#[entry]
def start(): i64 = 0
```

## 语义

它告诉编译器哪一个定义应当成为最终程序入口。

level-1 固定下面规则：

- 一个可执行 program 至多拥有一个显式 `#[entry]` 函数。
- 如果存在一个显式 `#[entry]` 函数，它优先于默认 `main`。
- 如果不存在显式 `#[entry]`，编译器可以按 package/program 规则寻找默认 `main`。
- `#[entry]` 只能标记函数定义，不能标记 static/global value、type、data、namespace 或局部表达式。
- 入口函数不能有普通 source-level 参数。
- 入口函数返回类型必须能被当前 target 的 entry ABI 接受；不接受时在 TopDef / entry gate 报错。
- 多个显式 `#[entry]` 必须报错，不能按 source order 或 namespace merge order 选一个。

`#[entry]` 是 item attribute。parser 只负责把它作为 attribute 结构附到 item 上；entry 唯一性、签名、target ABI 适配在 project surface / TopDef gate 中检查。

## Usage

```chiba
def main(): i64 = 1

#[entry]
def actual_start(): i64 = 42
```

注释：这个 program 的入口是 `actual_start`，不是 `main`。

## 边界

package manifest 的 `[[entry]]` 描述构建入口；source-level `#[entry]` 描述某个编译单元内部的函数入口。二者在 package resolution 后汇合，但不是同一层语义。

实现不得通过函数名字字符串形状猜测入口。默认 `main` 规则也必须走 resolved symbol / project surface fact，而不是在 backend 里临时搜索字符串。

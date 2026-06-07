# 关键字集合

## 语法

关键字是在词法层具有保留意义的一组标识符，例如：

- `def`
- `type`
- `data`
- `union`
- `if`
- `else`
- `let`
- `unique`
- `send`
- `match`
- `for`
- `reset`
- `resetn`
- `shift`
- `public`
- `private`
- `unsafe`
- `true`
- `false`
- `via` for level2
- `as`
- TODO 需要补充

## 语义

关键字在关键字位置不能被当作普通标识符使用。

关键字集合决定 parser 的起始分支与某些歧义消解策略。

`public` 当前只作为 `public use` re-export modifier 进入 level-1 surface；普通 item 默认 public，不需要写 `public def`。`private` 仍是 item 可见性收窄 modifier。

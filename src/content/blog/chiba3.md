---
title: 'CHIBA-LANG Level-0 DONE! Starting ChibaLex & ChibAcc'
description: 'After two weeks of hard work, Chiba-level0 has gone from an initial Rust demo to hand-written assembly and then to an LLM-assisted bootstrap path, and the next step is to build chibalex and chibacc for Level-1 self-hosting.'
pubDate: 'April 21 2026'
heroImage: '/chiba3.png'
ogImage: 'https://chiba-lang.org/chiba3.png'
---

经过了两个星期的艰苦奋斗，从 Rust 写初版 demo，到手写汇编，再到在大模型（感谢 Opus 4.6 GPT 5.4 GLM-5.1 Kimi k2.5）的帮助下完成 chiba-level0，我们终于把第一阶段真正做出来了。现在，chiba-level0 在 i7-11700K 上自举只需要不到 7 秒钟。这不是一个漂亮的数字游戏，而是一个很实在的信号：这条路能走，而且开始走快了。
After two weeks of hard work — from an initial Rust demo, to hand-written assembly, to finishing chiba-level0 with the help of a large model — we have finally built the first stage for real. Chiba-level0 now bootstraps in under 7 seconds on an i7-11700K. This is not a cosmetic number; it is a very concrete signal: the path works, and it is starting to move fast.

如果说前两周是在证明“能不能做出来”，那么现在开始，问题已经变成了“怎么把它做对、做稳、做久”。这件事的意义不只是一个编译器快了几秒，而是整个项目第一次拥有了可以反复验证、反复迭代的底座。
If the first two weeks were about proving whether it could be built at all, then the question now has shifted to how to make it correct, stable, and durable. The meaning of this milestone is not merely that the compiler became a few seconds faster; it is that the project now has a base that can be validated and iterated on repeatedly.

---

## 先夸一下 / First, the Praise

这一步其实挺狠的。短短两个星期，从一个 Rust demo 开始，拉到手写汇编，再到在大模型辅助下完成自举，说明我们已经跨过了“想法”这一关，进入了“工程现实”的关口。很多语言项目死在第一步，因为它们只有宣言，没有执行；而 chiba-level0 至少已经证明了自己不是空想。
This step is genuinely impressive. In just two weeks, going from a Rust demo to hand-written assembly and then to LLM-assisted bootstrapping means we have crossed the “idea” stage and entered the gate of engineering reality. Many language projects die at the first step because they have declarations but no execution; chiba-level0 has at least proved it is not a daydream.

更关键的是，7 秒以内的自举时间意味着反馈回路已经足够短。编译器一旦慢到离谱，开发者就会开始逃避它；但当它足够快时，你就真的可以反复修改、反复验证、反复逼近正确性。这个速度本身，就是后续一切工作的前提。
More importantly, a bootstrap time under 7 seconds means the feedback loop is now short enough. Once a compiler becomes absurdly slow, developers start avoiding it; but once it is fast enough, you can genuinely modify, verify, and converge on correctness again and again. That speed itself is the prerequisite for everything that comes next.

---

## 再贬一下 / Then, the Honest Critique

但我们也得老老实实承认：现在的 level-0 也就是一个 MVP。它能跑，不代表它好看；它能自举，不代表它已经具备一个真正语言系统应有的骨架。
But we also have to be honest: the current Level-0 is just an MVP. It runs, but that does not mean it is elegant. It bootstraps, but that does not mean it yet has the skeleton a real language system should have.

现在的问题很多，而且不是那种“稍微打磨一下就好”的问题，而是结构性的。
The current problems are numerous, and not in the “a little polish will fix it” category — they are structural.

- 没有真正的内存管理。
- 直接裸写 syscall，工程味道非常乱。
- 前端会不定时崩溃。
- 后端有时候就是在瞎吐汇编。
- 还带着 gcc 依赖，包括 as 和 linker。
- 到处都是临时补丁。
- src 里 i64 开花，类型边界很粗。

- There is no real memory management.
- Syscalls are written naked, and the engineering structure is messy.
- The frontend crashes unpredictably.
- The backend sometimes just spews assembly at random.
- There are still gcc dependencies, including as and the linker.
- Temporary patches are everywhere.
- src is full of i64 everywhere, and type boundaries are still very coarse.

所以现在的 level-0，本质上就是一个能用来验证方向的壳。它证明的是“这条路线可行”，不是“这条路线已经完成”。如果把它说得更直白一点，它已经不算幼稚了，但离成熟还差得很远。
So the current Level-0 is essentially a shell for validating direction. It proves that “this route is feasible,” not that “this route is finished.” Put more bluntly, it is no longer naive, but it is still far from mature.

---

## 但好在，下一步已经很清楚 / But Fortunately, the Next Step Is Clear

好消息是，我们现在已经准备开始写 chibalex 和 chibacc 了。这两个东西会协助我进行 level-1 的自举。它们不是装饰品，也不是临时起意的旁支，而是下一阶段真正要用起来的工具链核心。
The good news is that we are now ready to start chibalex and chibacc. These two pieces will help me bootstrap Level-1. They are not decorations, and they are not side quests invented on the fly; they are the core of the toolchain for the next stage.

更具体一点说，CHIBA-SPEC/MISC 里已经有它们各自的设计草案：`chibalex` 负责词法，`chibacc` 负责语法。它们并不只是给 Chiba 自己的前端服务的——反过来，它们也可以成为我们自己写小语言、小 DSL、甚至玩一把 toy compiler 的现成工具。
More concretely, CHIBA-SPEC/MISC already has design drafts for both of them: `chibalex` handles lexing, and `chibacc` handles parsing. They are not only there to serve Chiba's own frontend — they can also become ready-made tools for us to write small languages, small DSLs, or even just play with toy compilers.

设计上我更愿意把它们理解成一对“前端生成器”而不是传统意义上的 lexer / parser generator：`chibalex` 负责把字符流切成稳定的 token 流，处理 longest-match、layout/trivia、宏展开这些脏活；`chibacc` 负责在 token 流上做 token grammar、Pratt、语义谓词和回滚恢复。你可以把它们组合起来，先写一个很小的语言，再慢慢把它长成真正的 Chiba 前端。
Design-wise, I prefer to think of them as a pair of “frontend generators” rather than a traditional lexer / parser generator: `chibalex` turns a character stream into a stable token stream and handles the dirty work of longest-match, layout/trivia, and macro expansion; `chibacc` then works on that token stream with token grammar, Pratt rules, semantic predicates, and rollback recovery. Put together, they let you start with a tiny language and gradually grow it into a real Chiba frontend.

比如一个最小的玩具语言，大概可以长这样：
For example, a minimal toy language could look something like this:

```text
#![CHIBALEX]
{
	namespace toy.lexer
}

$digit = [0-9]
$alpha = [A-Za-z_]

@ident = $alpha ($alpha | $digit)*
@int   = $digit+

tokens :-
	KwLet  = "let"
	Ident  = @ident
	IntLit = @int
	Plus   = "+"
	Eq     = "="
	Semi   = ";"
{}
```

```text
#![CHIBACC]
{
	namespace toy.parse
}

start Term
rule Expr   ::= 
    Expr p:Plus t:Term | t:Term
    => handle_expr(p,t,t)
    ;

rule Term   ::= 
    il:IntLit | i:Ident | LParen e:Expr RParen
    => handle_term(il,i,e)
    ;

{
    data AST {
        Expr(...)
        Term(...)
    }
}
```

这个例子很简单，但意思很明确：先用 `chibalex` 定义 token，再用 `chibacc` 把 token 组织成 AST。哪怕只是做一个加减法解释器、一个配置语言、或者一个小型脚本 DSL，这套链路也已经够用了。
The example is tiny, but the point is clear: use `chibalex` to define tokens first, then use `chibacc` to assemble those tokens into an AST. Even for something as small as an arithmetic interpreter, a configuration language, or a tiny scripting DSL, this pipeline is already enough.

我把这件事看得很简单：level-0 负责把路踩出来，chibalex 和 chibacc 负责把路修平。
I see this very simply: Level-0 is responsible for breaking ground, and chibalex and chibacc are responsible for paving the road.

如果说 level-0 还是“能跑起来”的证明，那么 level-1 就必须开始承担“能稳定开发”的责任。那意味着前端、词法、语法、诊断、代码生成、链接流程，都要开始往真正可维护的方向走。
If Level-0 is still a proof that it can run, then Level-1 must start carrying the responsibility of supporting stable development. That means the frontend, lexer, parser, diagnostics, code generation, and linking flow all need to move toward something genuinely maintainable.

---

## 我们准备画的饼 / The Promises We Can Already Make

接下来可以开始画一些饼，而且这次不是空口说白话，是已经能看到轮廓的那种。
Now we can start drawing some promises — not empty talk, but the kind whose outline is already visible.

### 更好的前端体验 / A Better Frontend Experience

前端不能老是动不动就崩。接下来要做的是把解析、语义分析、类型检查这些东西分层拆开，让每一层都更稳定、更容易定位问题。用户不应该在一个错误出现时，面对一坨没头没尾的崩溃栈。
The frontend cannot keep crashing at random. The next step is to separate parsing, semantic analysis, and type checking into clearer layers so that each layer is more stable and easier to debug. Users should not be faced with a meaningless crash stack when a single error happens.

### 更好的报错体验 / Better Error Reporting

报错不是附属品，报错是语言的一部分。一个好报错，不只是告诉你“错了”，而是告诉你“错在哪、为什么错、怎么改”。如果一个人第一次接触 Chiba，十分钟内就能看懂错误信息，那这门语言就已经赢了一半。
Error messages are not an accessory; they are part of the language. A good error does not merely say “something is wrong”; it says where it is wrong, why it is wrong, and how to fix it. If a first-time Chiba user can understand the error within ten minutes, the language has already won half the battle.

### 更好的 codegen / Better Code Generation

后端也不能继续瞎鸡巴吐汇编了。代码生成必须更稳定、更可预测、更可推理。该复用的地方要复用，该内联的地方要内联，该保守的地方要保守。最终目标不是“能吐出来”，而是“吐出来的东西是对的，而且是可控的”。
The backend cannot keep spewing assembly at random. Code generation must become more stable, more predictable, and more reasoned about. Reuse where reuse is appropriate, inline where inlining is appropriate, stay conservative where conservatism is needed. The final goal is not merely to emit something, but to emit something correct and controlled.

### 类型更像 HM 了 / A Type System Closer to HM

我希望下一阶段的类型系统能更像 HM：更自然、更直观、更适合写小程序，也更适合逐步扩展。不是为了让类型看起来炫，而是为了让程序员在写代码的时候少掉一点负担，多一点确定性。
I want the next stage of the type system to feel more like HM: more natural, more intuitive, more suitable for writing small programs, and more suitable for gradual expansion. Not to make types look flashy, but to make programming a little less burdensome and a little more certain.

### 可以开始写点小东西了 / It Will Be Possible to Build Small Things

如果这些都走顺了，Chiba 就不只是一个“编译器项目”了，它会开始变成一个真的可以拿来开发小工具、小脚本、小服务的东西。哪怕一开始只是很小的项目，也比只停留在语言自举本身更重要。
If all of this goes smoothly, Chiba will stop being just a “compiler project” and start becoming something you can actually use to build small tools, small scripts, and small services. Even if the first projects are tiny, that still matters more than staying stuck at bootstrapping alone.

---

## 我们的目标是星辰大海 / Our Goal Is the Stars

但说到底，这些都只是阶段性目标。真正的目标不是把一个 MVP 修补成一个还能看的样子，而是把 Chiba 变成一门真正能打的语言。
But in the end, all of these are only intermediate goals. The real goal is not to patch an MVP into something merely presentable, but to turn Chiba into a language that can truly fight.

我们的目标是星辰大海。我们要击碎函数式语言中看不中用的旧世界：那些只会把抽象堆得越来越高、却越来越远离现实的旧习惯；那些把优雅当成目的、把复杂当成荣耀的旧世界；那些让语言成为少数人审美展示品的旧世界。
Our goal is the stars. We want to smash the old world of functional languages that look good but are useless: the habits of endlessly stacking abstractions while drifting farther and farther away from reality; the old world that treats elegance as an end and complexity as a badge of honor; the old world that turns languages into aesthetic displays for a small elite.

我们不想只做一个“理论上很漂亮”的东西。我们想做的是一个能落地、能自举、能扩展、能跑进现实世界的系统。它可以粗粝，可以野蛮，可以不够圆滑，但它必须是活的。
We do not want to build something that is merely “theoretically beautiful.” We want something that lands, self-hosts, scales, and runs into the real world. It can be rough, it can be brutal, it can be imperfect, but it has to be alive.

而 chiba 的真正故事，也才刚刚开始。
And Chiba’s real story has only just begun.

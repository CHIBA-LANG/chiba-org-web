---
title: ' Chiba Language’s Boring Promise: When Zig Starts Drifting'
description: 'Zig once promised directness and control, but recent governance and ecosystem shocks around Bun, AI-assisted forks, and accepted language churn expose a deeper problem: a systems language needs a leash, not just velocity.'
pubDate: 'May 5 2026'
heroImage: '/chiba4.png'
ogImage: 'https://chiba-lang.org/chiba4.png'
---

## Zig 的问题不是坏，而是没人拴住方向盘

Zig 当然不是一门烂语言。恰恰相反，Zig 最初迷人的地方就在于它非常清醒：没有隐藏控制流，没有隐藏内存分配，编译期执行，显式 allocator，能读懂的错误模型，能落到机器上的语义。它曾经像一把很锋利的刀，锋利到很多人愿意忍受它还没到 1.0、标准库反复变、语法偶尔大改这些痛苦。

但一把刀不能一直只靠“锋利”存在。系统语言最后拼的不是一两个漂亮概念，而是路线纪律。你可以快，可以激进，可以在 0.x 阶段拆掉重来，但总得有人把方向盘扶住。现在 Zig 最危险的地方，不是它有 bug，不是它没稳定，而是 Andrew 像没人拴住一样，语言设计、社区条例、生态关系、路线优先级都在一边跑一边改。

说得难听一点：Zig 现在有一种“我知道我要去哪，但我明天可能重新定义去哪”的气质。

这对玩具项目无所谓，对系统语言是致命的。因为系统语言承载的不是语法审美，而是别人的工具链、构建系统、生产服务和长期维护成本。你今天改一个关键字，明天重塑一套 async，后天调整社区贡献规则，大后天再说某种开发方式不符合价值观——外面的人不会觉得这是纯粹，他们只会觉得这东西不好下注。

## Zig’s Problem Is Not That It Is Bad, but That Nobody Is Holding the Wheel

Zig is not a bad language. Quite the opposite: what made Zig attractive in the beginning was its clarity. No hidden control flow, no hidden allocation, compile-time execution, explicit allocators, a readable error model, semantics that land directly on the machine. It felt like a sharp knife, sharp enough that many people were willing to tolerate the pain of pre-1.0 churn, standard library reshuffles, and occasional syntax demolition.

But a knife cannot live on sharpness alone. A systems language is not ultimately judged by one or two elegant ideas, but by route discipline. You can move fast, you can be aggressive, you can tear things down during 0.x, but someone has to hold the wheel. The dangerous part of Zig today is not that it has bugs, or that it is unstable. It is that Andrew increasingly looks like nobody has him on a leash: language design, community policy, ecosystem relationships, and roadmap priorities all keep moving while the car is still in motion.

To put it bluntly: Zig now gives off the feeling of “I know where I am going, but tomorrow I may redefine where going means.”

That is fine for toy projects. It is lethal for a systems language. A systems language carries other people’s toolchains, build systems, production services, and long-term maintenance costs. Change a keyword today, reshape async tomorrow, adjust contribution rules the day after, and then declare that some development method violates community values. Outsiders will not call that purity. They will call it an unsafe bet.

---

## Bun 给 Zig 上了一课

Bun 曾经是 Zig 最好的广告牌之一。

这很重要。一个语言最好的宣传，从来不是官网上写“我们很快”，也不是 benchmark 里赢了谁，而是有真实项目拿它去打真实世界。Bun 就是那种项目：JavaScript runtime、bundler、package manager、server API，一堆脏活硬活全塞在一起，而且真的有人每天在用。

所以当 Bun 仓库里出现一个名为 `claude/phase-a-port` 的 Rust 迁移草稿 commit，一口气加了两万多行 Rust 文件时，这件事的象征意义远大于这次 commit 本身。

[这个 commit](https://github.com/oven-sh/bun/commit/9f3917e979fecd2dae1327e159c6b2fd258bb67f) 当然还不能说明 Bun 明天就会把 Zig 全部扔掉。它更像是一个信号：Bun 至少已经认真到愿意把 Zig 代码迁移到 Rust 的可行性摆上桌面。一个项目不会无缘无故做这种事。尤其是 Bun 这种已经用 Zig 写出规模的项目，迁移语言不是换主题色，而是换骨架。

而围绕 Bun 的 Zig fork 使用 LLM 生成代码是否触碰 Zig 社区规则边界的争议，则指向了更尴尬的一层：这不是单纯的“Rust 比 Zig 更好”问题，而是一个生态信任问题。

当一个现实项目为了生存速度使用 LLM，当一个语言社区为了代码来源和治理洁癖设下边界，当两者发生冲突，最后受伤的不是某一条规则，而是语言作为工程底座的可信度。

Zig 曾经卖的是“工程直接性”。但如果一个用 Zig 最成功的工业项目之一开始认真看 Rust，那么外界听到的不是“Zig 很纯”，而是“Zig 可能接不住现实”。

## Bun Just Taught Zig a Lesson

Bun used to be one of Zig’s best advertisements.

That matters. The best promotion for a language is never a homepage saying “we are fast,” nor a benchmark where it beats someone else. It is a real project using it to fight the real world. Bun is exactly that kind of project: JavaScript runtime, bundler, package manager, server APIs, and a pile of dirty work all fused together, with people actually using it every day.

So when the Bun repository gets a Rust migration draft commit under a branch named `claude/phase-a-port`, adding more than twenty thousand lines of Rust files in one shot, the symbolic meaning is much larger than the commit itself.

[This commit](https://github.com/oven-sh/bun/commit/9f3917e979fecd2dae1327e159c6b2fd258bb67f) does not prove that Bun will throw Zig away tomorrow. It is a signal: Bun is at least serious enough to put the feasibility of porting Zig code to Rust on the table. Projects do not do this for no reason. Especially not projects like Bun, which have already built real scale in Zig. Migrating languages is not changing a theme color. It is changing the skeleton.

And the controversy around whether Bun’s Zig fork used LLM-generated code in a way that collides with Zig community rules points to an even more awkward layer. In other words, this is not merely a “Rust is better than Zig” story. It is an ecosystem trust story.

When a real project uses LLMs for survival speed, when a language community draws boundaries around provenance and governance purity, and when those two collide, the thing that gets damaged is not one rule. It is the credibility of the language as an engineering foundation.

Zig used to sell “engineering directness.” But if one of the most successful industrial Zig projects starts seriously looking at Rust, what outsiders hear is not “Zig is pure.” What they hear is “Zig may not be able to catch reality.”

---

## Rust 的无聊，反而成了优点

Rust 很烦。这个我得承认。

借用检查器烦，生命周期烦，trait bound 烦，编译时间烦，`Cargo.toml` 里一堆 feature flag 也烦。Rust 社区也经常有自己的神学辩论，从 async 到 GAT，从 unsafe guidelines 到 edition 迁移，吵起来一点不比 Zig 文明。

但 Rust 有一个 Zig 现在越来越缺的东西：**制度化的无聊**。

Rust 的很多决定很慢，很官僚，很 RFC，很看起来不够英雄主义。但也正因为这样，一个公司把生产服务压到 Rust 上时，心里会比较踏实。它知道语言不会因为某个核心维护者凌晨突然获得启示，第二天就把一个关键设计推翻。它知道 edition 会给迁移留窗口。它知道生态里的 crate 虽然质量参差不齐，但治理方式大体可预期。

系统语言最重要的品质之一，就是让使用者不用每天猜创始人的精神状态。

## Rust’s Boredom Became Its Advantage

Rust is annoying. I have to admit that.

The borrow checker is annoying. Lifetimes are annoying. Trait bounds are annoying. Compile times are annoying. The pile of feature flags in `Cargo.toml` is annoying. The Rust community has its own theological debates too, from async to GATs, from unsafe guidelines to edition migration. It is not exactly a temple of peace.

But Rust has something Zig increasingly lacks: **institutional boredom**.

Rust’s decisions are often slow, bureaucratic, RFC-heavy, and insufficiently heroic. But precisely because of that, when a company puts production services on Rust, it can feel relatively calm. It knows the language will not overturn a key design tomorrow because one core maintainer had a revelation at midnight. It knows editions provide migration windows. It knows the ecosystem quality varies, but the governance shape is roughly predictable.

One of the most important qualities of a systems language is that users do not have to guess the founder’s mental weather every day.

---

## `@TypeOf`、`anytype` 和 `|T|`：这已经不是小改名了

再看 [Zig issue 5893](https://github.com/ziglang/zig/issues/5893)。这个 issue 从 2020 年开始讨论 `anytype` 要不要改成 `anyval`，里面可以看到非常典型的 Zig 式张力：一边是语义洁癖，一边是实践直觉；一边说 `anytype` 在数学上可以解释，一边说普通用户读起来就是不对劲。

如果事情只停在 `anytype` 改 `anyval`，那还可以说只是命名债。问题是 Andrew 又开了一个更逆天的 [Zig issue 32099](https://codeberg.org/ziglang/zig/issues/32099)：直接提议移除 `@TypeOf` 和 `anytype`，然后引入 `|T|` 语法。

这个提案的动机也很 Zig：`@TypeOf` 让语言规格复杂，因为它会求值表达式，但保证没有运行时副作用；`anytype` 看起来像类型，实际上却是语法。于是新的写法变成这样：

```zig
fn foo(x: anytype) @TypeOf(x) {
	return x;
}
```

变成：

```zig
fn foo(x: |T|) T {
	return x;
}
```

这已经不是“换个名字更准确”了。这是把 Zig 的泛型入口、类型推断表达方式和 `@TypeOf` 这类元编程工具一起掀桌子。更搞笑的是，提案自己也承认会失去 `@TypeOf(val, lower, upper)` 这种 peer type resolution 的 builtin 能力。标准库里的 `clamp` 这种函数，可能要把原来一行 `@TypeOf` 变成用户态手写 `Clamp(.{ val, lower, upper })`，甚至还得自己实现 peer type resolution。

也就是说，Zig 一边说 `@TypeOf` 让语言规格复杂，所以要删；另一边又把这部分复杂性推给用户，让用户在库里把编译器原本知道的东西重新发明一遍。这种设计哲学就很迷人：语言规格是干净了，用户代码脏了；核心语义瘦身了，生态复杂度发胖了。

对语言作者来说，这可能叫“移除特殊情况”。对用户来说，这就是另一种形式的地面液化。你昨天刚学会 `anytype`，今天有人说它其实是语法伪装成类型；你刚接受 `anyval`，明天又说不如整个 `@TypeOf` 一起扬了，换成 `|T|`。这不是渐进式稳定，这是拿用户心智模型做热更新。

这就是 Zig 的悖论。它想做一门离机器更近的语言，但它自己的语言表面却一直处于高流动状态。它要求用户显式管理内存，却没有给用户同等显式的路线稳定性。它拒绝隐藏控制流，却在社区治理和设计优先级上制造了另一种隐藏控制流。

你不知道下一次 breaking change 从哪里来，也不知道它是技术必要、审美冲动，还是路线焦虑。

## `@TypeOf`, `anytype`, and `|T|`: This Is No Longer a Small Rename

Look at [Zig issue 5893](https://github.com/ziglang/zig/issues/5893). This issue started in 2020, debating whether `anytype` should be renamed to `anyval`. Inside it you can see a very Zig-like tension: semantic cleanliness on one side, practical intuition on the other; one side says `anytype` can be justified mathematically, the other says ordinary users read it and feel something is wrong.

If the story stopped at renaming `anytype` to `anyval`, we could call it naming debt. The problem is that Andrew then opened a much wilder [Zig issue 32099](https://codeberg.org/ziglang/zig/issues/32099): remove `@TypeOf` and `anytype` entirely, and introduce `|T|` syntax.

The motivation is very Zig: `@TypeOf` makes the language specification complex because it evaluates expressions while guaranteeing no runtime side effects; `anytype` looks like a type, while actually being syntax. So this:

```zig
fn foo(x: anytype) @TypeOf(x) {
	return x;
}
```

becomes this:

```zig
fn foo(x: |T|) T {
	return x;
}
```

This is no longer “let us pick a more accurate name.” This is flipping the table on Zig’s generic entry point, type-inference surface, and `@TypeOf`-style metaprogramming tool all at once. The funnier part is that the proposal itself admits a real downside: losing `@TypeOf(val, lower, upper)` as a builtin for peer type resolution. A standard-library function like `clamp` may need to turn one builtin call into a userland `Clamp(.{ val, lower, upper })`, possibly reimplementing peer type resolution by hand.

In other words, Zig says `@TypeOf` makes the language spec complex, so it should be deleted; then it pushes part of that complexity onto users and libraries, asking them to re-invent what the compiler used to know. The philosophy is charming in a strange way: the spec gets cleaner, user code gets dirtier; the core semantics slim down, ecosystem complexity gains weight.

For language authors, this may be “removing a special case.” For users, it is another form of ground liquefaction. Yesterday you learned `anytype`; today someone tells you it was syntax disguised as a type. You just accepted `anyval`; tomorrow the proposal says maybe delete `@TypeOf` too and replace the whole thing with `|T|`. That is not gradual stabilization. That is hot-reloading the user’s mental model.

This is Zig’s paradox. It wants to be a language closer to the machine, yet its language surface remains highly liquid. It asks users to manage memory explicitly, but does not give users equally explicit roadmap stability. It rejects hidden control flow, while creating another kind of hidden control flow in governance and design priorities.

You do not know where the next breaking change will come from, or whether it is technical necessity, aesthetic impulse, or roadmap anxiety.

---

## Chiba 不应该学 Zig 的英雄主义

这里就要说回 Chiba。

Chiba 当然还很小。现在拿 Chiba 和 Zig、Rust、Bun 放在一起比，听起来有点不要脸。一个是刚开始自举、还在修 lexer/parser/codegen 的语言，一个是已经有巨大社区的系统语言，一个是现实世界每天跑的 runtime。体量完全不是一个级别。

但正因为 Chiba 还小，才更应该在一开始把这个教训吃进去：**语言不能只靠作者的冲劲活着。**

Chiba 的路线不能是“今天我觉得这个美，明天我觉得那个更美”。Chiba 要做的是函数式系统语言，不用 LLVM，控制栈，控制内存布局，把限定续延、行多态、Arena、Perceus、inline asm 这些东西落到机器上。这条路已经够难了，不需要再叠加一种创始人审美漂移带来的不确定性。

所以 Chiba 应该和 Zig 拉开差异，不是在 slogan 上拉开，而是在工程承诺上拉开：

1. 语义可以演进，但核心模型要早冻结。
2. 工具链可以粗糙，但构建路径要可重复。
3. LLM 可以参与，但生成来源、审查边界和责任归属要讲清楚。
4. 社区可以有价值观，但价值观不能突然变成生态项目的地雷。
5. 作者可以有审美，但审美必须服从长期可维护性。

Zig 的教训不是“不要锋利”。Zig 的教训是：锋利如果没有刀鞘，最后割到的是自己人。

## Chiba Should Not Imitate Zig’s Heroism

This is where we return to Chiba.

Chiba is still tiny. Comparing Chiba with Zig, Rust, and Bun right now sounds almost shameless. One is a language just starting to bootstrap and still fixing lexer, parser, and codegen. One is a systems language with a large community. One is a runtime used in the real world every day. The scale is not comparable.

But precisely because Chiba is still small, it should absorb this lesson early: **a language cannot live on the author’s momentum alone.**

Chiba’s route cannot be “today I find this beautiful, tomorrow I find that more beautiful.” Chiba wants to be a functional systems language: no LLVM, stack control, memory layout control, delimited continuations, row polymorphism, arenas, Perceus, inline assembly, all grounded in the machine. That path is already difficult enough. It does not need the additional uncertainty of founder-aesthetic drift.

So Chiba should separate itself from Zig not in slogans, but in engineering promises:

1. Semantics may evolve, but the core model should freeze early.
2. The toolchain may be rough, but the build path must be reproducible.
3. LLMs may participate, but provenance, review boundaries, and responsibility must be explicit.
4. A community may have values, but values must not suddenly become landmines for ecosystem projects.
5. The author may have taste, but taste must submit to long-term maintainability.

The lesson from Zig is not “do not be sharp.” The lesson is: if a sharp knife has no sheath, eventually it cuts its own people.

---

## AI 不是敌人，失控才是敌人

这次 Bun 和 Zig 的争议还有一个更大的时代背景：LLM 已经进入编译器工程了。

这件事不会因为某个社区条例就消失。你可以禁止它出现在 official contribution 里，可以要求开发者声明来源，可以要求人工审查，可以为了许可证和版权风险制定流程，这些都合理。但你不能假装 2026 年还有人会完全手写每一行迁移代码。

Chiba 从第一天就没必要装这个纯。我在前文已经说过，Chiba level-0 的自举过程里 LLM 介入率很高。这不是耻辱。真正的问题不是“有没有 AI”，而是“AI 生成的东西有没有被工程系统驯服”。

AI 写出来的代码，必须经过测试、diff 审查、语义约束、性能验证和责任归属。它不能因为是 AI 写的就天然低贱，也不能因为是 AI 写的就天然免责。把 AI 当外包员工看就行：它可以干很多活，但它不能签字负责。

如果一个语言社区把 LLM 当作道德污染源，它会把现实项目推走。如果一个项目把 LLM 当作免审神器，它会把自己炸掉。正确路线在中间：承认它存在，利用它加速，用工程制度管住它。

这也是 Chiba 应该比 Zig 更清楚的地方。我们不是要建一个纯洁修道院，我们要建一个能跑的系统。

## AI Is Not the Enemy. Loss of Control Is the Enemy.

The Bun and Zig controversy also sits inside a larger historical shift: LLMs have entered compiler engineering.

This will not disappear because a community policy says so. You can ban it from official contributions. You can require developers to declare provenance. You can require human review. You can design procedures for license and copyright risk. All of that is reasonable. But you cannot pretend that in 2026 people will still hand-write every line of migration code.

Chiba has no need to perform purity here. I have already said in earlier posts that LLM involvement in Chiba Level-0 bootstrapping was high. That is not shameful. The real question is not “was there AI?” The real question is “was the AI-generated work domesticated by an engineering system?”

AI-written code must go through tests, diff review, semantic constraints, performance validation, and ownership. It is not naturally inferior because AI wrote it. It is not naturally absolved because AI wrote it. Treat AI like an outsourced worker: it can do a lot of labor, but it cannot sign off responsibility.

If a language community treats LLMs as moral contamination, it will push real projects away. If a project treats LLMs as review-free magic, it will destroy itself. The correct path is in the middle: acknowledge it, use it for acceleration, and constrain it with engineering procedure.

This is where Chiba should be clearer than Zig. We are not building a purity monastery. We are building a system that runs.

---

## Chiba 的软承诺：可控的野蛮

Chiba 也有野蛮的一面。不用 LLVM，自己写后端，直接碰栈，inline asm，自己设计内存模型，这些都不是温和路线。它们甚至比 Zig 更危险。因为 Zig 至少还在传统系统语言的轨道上，而 Chiba 想把函数式抽象直接压进系统编程的金属层。

所以 Chiba 更不能学 Zig 那种“先跑再说，跑着跑着改世界观”的做法。Chiba 可以野蛮，但必须是可控的野蛮。

可控意味着什么？意味着每一个核心抽象都要能回答三个问题：

它在类型系统里是什么？它在 IR 里是什么？它在机器上是什么？

限定续延不是“高级控制流美学”，它必须对应具体的栈帧切割、保存和恢复。行多态不是“结构化类型很优雅”，它必须对应字段偏移、布局约束和调用约定。Arena 不是“我们也有内存管理故事”，它必须对应 reset 边界、逃逸传播和释放成本。inline asm 不是“给底层程序员一个玩具”，它必须对应寄存器约束、clobber、ABI 和优化边界。

这就是 Chiba 和 Zig 真正的分野。

Zig 的口号是没有隐藏控制流、没有隐藏内存分配。Chiba 要把这个口号推进一步：**没有隐藏语义债。**

一个设计如果会在三年后变成生态炸弹，那现在就不要装作它只是小语法。一个社区规则如果会逼走真实项目，那现在就不要装作它只是价值观声明。一个 AI 流程如果会污染代码来源，那现在就把审查和责任写清楚。

系统语言不是靠激情活着的。系统语言靠可重复、可推理、可迁移、可维护活着。

## Chiba’s Soft Promise: Controlled Brutality

Chiba has its own brutality. No LLVM, a hand-written backend, direct stack manipulation, inline assembly, a self-designed memory model: none of this is gentle. It may be even more dangerous than Zig. Zig at least remains on the traditional systems-language track. Chiba wants to press functional abstraction directly into the metal layer of systems programming.

That is exactly why Chiba cannot imitate Zig’s “run first, revise the worldview while running” style. Chiba may be brutal, but it must be controlled brutality.

What does controlled mean? It means every core abstraction must answer three questions:

What is it in the type system? What is it in the IR? What is it on the machine?

Delimited continuations are not “advanced control-flow aesthetics.” They must correspond to concrete stack-frame slicing, saving, and restoration. Row polymorphism is not “structural typing is elegant.” It must correspond to field offsets, layout constraints, and calling conventions. Arenas are not “we also have a memory-management story.” They must correspond to reset boundaries, escape propagation, and release costs. Inline assembly is not “a toy for low-level programmers.” It must correspond to register constraints, clobbers, ABI, and optimization boundaries.

This is the real divide between Chiba and Zig.

Zig’s slogan is no hidden control flow, no hidden allocation. Chiba should push that slogan one step further: **no hidden semantic debt.**

If a design will become an ecosystem bomb three years later, do not pretend today that it is merely small syntax. If a community rule will push real projects away, do not pretend today that it is merely a values statement. If an AI workflow may contaminate provenance, write review and responsibility rules now.

Systems languages do not live on passion. They live on reproducibility, reasoning, migration, and maintenance.

---

## 结尾：别当下一个失控的漂亮东西

我对 Zig 没有恶意(bushi)。甚至可以说，如果没有 Zig，很多人不会重新意识到 C 之后的系统语言还可以追求透明、简洁和机器亲和。Zig 对这个时代是有贡献的。

但贡献不等于免死金牌。一个语言早期的锋芒，不能替代长期治理。一个作者的审美，不能替代生态契约。一个社区的洁癖，不能替代工业现实。

Bun 看 Rust，不只是 Bun 的选择，也是 Zig 的警钟。`anytype` 改名、`@TypeOf` 移除、`|T|` 语法，不只是语法讨论，也是稳定边界的警钟。LLM 争议，不只是代码来源问题，也是语言社区如何面对新时代生产方式的警钟。

Chiba 要吸取的不是“Rust 赢了，Zig 输了”这种廉价结论。真正的结论是：**系统语言必须把野心关进工程纪律里。**

Chiba 可以粗粝，可以锋利，可以不讨所有人喜欢。但它不能成为另一个失控的漂亮东西。它要做的不是靠作者的兴奋感往前冲，而是把每一次抽象都压到机器上，把每一个承诺都写进工具链里，把每一次 AI 加速都纳入审查，把每一次破坏性变更都当成债务而不是胜利。

Zig 教会我们的，不是怎么做一门语言。

Zig 教会我们的是：一门语言如果没人拴住，跑得越快，越容易把自己的生态甩下车。

## Finale: Do Not Become Another Beautiful Thing Out of Control

I have no malice toward Zig. In fact, without Zig, many people may not have rediscovered that after C, a systems language could still pursue transparency, simplicity, and machine affinity. Zig contributed something real to this era.

But contribution is not immunity. Early sharpness cannot replace long-term governance. The author’s taste cannot replace an ecosystem contract. Community purity cannot replace industrial reality.

Bun looking at Rust is not only Bun’s choice. It is a warning bell for Zig. Renaming `anytype`, removing `@TypeOf`, and introducing `|T|` syntax are not merely syntax discussions. They are warning bells about stability boundaries. The LLM controversy is not only about code provenance. It is a warning bell about how language communities face a new mode of production.

The lesson for Chiba is not the cheap conclusion that “Rust won, Zig lost.” The real conclusion is: **a systems language must lock ambition inside engineering discipline.**

Chiba can be rough, sharp, and not universally liked. But it cannot become another beautiful thing out of control. It should not move forward on the author’s excitement alone. It should press every abstraction down onto the machine, write every promise into the toolchain, bring every AI acceleration under review, and treat every breaking change as debt rather than victory.

Zig did not teach us how to build a language.

Zig taught us this: if nobody holds a language on a leash, the faster it runs, the more easily it throws its own ecosystem out of the car.

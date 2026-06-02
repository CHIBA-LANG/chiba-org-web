---
title: 'First Shoot, Then Draw the Target: Chiba, Rust, and the LLM Cheat Code'
description: 'A Chiba note about a strange two-agent experiment: the self-bootstrap path became messy, while the Rust reference compiler came out absurdly clean, forcing a rethink of how LLMs learn language style.'
pubDate: 'June 2 2026'
heroImage: '/RIIR.jpg'
ogImage: 'https://chiba-lang.org/RIIR.jpg'
---

## 我被两个 Agent 气笑了

上一篇 [chiba5](https://chiba-lang.org/blog/chiba5/) 里，我写 Chiba Level-1 为什么能推进得这么快。那篇的核心判断是：AI 不是魔法。AI 真正能干活，是因为我把它放进了 spec、harness、context engineering、agent loop、validation loop 这些工程结构里。

这个判断到现在仍然成立。

但最近我又遇到了一件很微妙的事。

我同时开了两个 Agent。一个 Agent 负责继续做自举，把 chiba-1b 的 gate、validation、compiler pipeline 往能跑的方向推。另一个 Agent 负责按照 spec，从零开始实现一个 Rust 版本的 reference Chiba compiler。

按理说，自举那个 Agent 更贴近真实路线。它接着已有代码走，有现成上下文，有之前的失败痕迹，也有更明确的工程目标。Rust reference compiler 那个 Agent 反而像是旁边新开的一条路：从 spec 出发，重新写一个干净的参考实现。

结果很讽刺。

自举那边还没跑完，代码质量已经开始变成一坨。它为了让 gate 过，引入了一堆 JS gate，临时补丁越来越多，validation surface 越长越奇怪，看起来像一个 agent 在泥地里越陷越深。

而 Rust 那边，源码干净得过分。

不是“能看”。是真的干净。模块边界清楚，错误处理克制，类型结构像样，代码读起来甚至有点过于正常。它当然还没证明自己能替代自举路线，也不等于语义全对，但单看源码质量，我只能说我气笑了。

同样是 AI。为什么写 JS 就写成一坨？为什么写 Chiba 虽然好一点但也没有好太多？为什么一到 Rust，就突然像是有工程品味了？

## Two Agents Made Me Laugh in Anger

In the previous [chiba5](https://chiba-lang.org/blog/chiba5/), I wrote about why Chiba Level-1 moved so quickly. The core argument was that AI is not magic. AI becomes useful only when placed inside engineering structures: specs, harnesses, context engineering, agent loops, and validation loops.

I still believe that.

But recently I ran into something subtler.

I had two agents running at the same time. One agent continued the self-bootstrap path, pushing chiba-1b gates, validation, and the compiler pipeline toward something runnable. The other agent implemented a Rust reference Chiba compiler from scratch, following the spec.

In theory, the bootstrap agent had the more realistic path. It continued from existing code, inherited context, had failure traces, and had a concrete engineering objective. The Rust reference compiler looked more like a side road: start from the spec and write a clean reference implementation.

The result was ironic.

The bootstrap side had not even finished running, and the code quality was already turning into a pile of mud. To make gates pass, it introduced a bunch of JS gates, more and more temporary patches, and a validation surface that became stranger the longer it grew. It looked like an agent sinking deeper into wet ground.

The Rust side was absurdly clean.

Not merely acceptable. Clean. The module boundaries were clear, error handling was restrained, type structure was decent, and the code read almost too normally. Of course, that does not prove it can replace the bootstrap path, nor that all semantics are correct. But if you only looked at source quality, I could only laugh in anger.

Same AI. Why does it write JS like a mess? Why does it write Chiba a little better, but not by much? Why does it suddenly look like it has engineering taste when writing Rust?

---

## 我一开始以为是 Chiba 长得像 Rust

我第一反应不是“Rust 赢了”。我第一反应是：会不会是 Chiba 本来就长得有点像 Rust，所以模型在写 Chiba 的时候，多少借到了 Rust 的分布？

Rust 可以粗暴地说成：爹是 C，妈是 OCaml。

Chiba 如果也粗暴地说，可以说是：爹是 SML，妈是 C。

这两个描述当然都不严谨，但作为语言气质的比喻，它们有点用。Rust 把 C 那边的控制、机器、layout、系统编程压力，和 ML 系那边的 algebraic data type、pattern matching、type discipline、expression-oriented taste 放在了一起。Chiba 也在做类似的混合，只是血缘更偏 SML，另一边仍然拉着 C 的机器现实。

所以我一度怀疑：是不是因为 Chiba 的形状离 Rust 太近，模型在 zero-shot Chiba 的时候，其实可以偷用很多 Rust 先验？

比如它知道一个 compiler project 应该有 AST、parser、diagnostics、lowering、type context、arena、symbol table、error enum。它知道这类东西在 Rust 里通常怎么分层。即使 Chiba 是一门新语言，它也能从 Rust、OCaml、SML、compiler crate、PL blog 里拼出一个大致像样的结构。

这解释了一部分。

但解释不了全部。因为如果只是“Chiba 像 Rust”，那它写 Chiba 应该也很干净。现实是，写 Chiba 比写 JS 好一点，但还是会漂。它会在语义还没稳定的时候发明写法，会把局部看起来聪明的结构堆到一起，会把某些 Rust/ML 习惯半吊子地套进 Chiba。

Chiba 没有被世界画过靶子。

## At First I Thought Chiba Looked Like Rust

My first reaction was not "Rust won." My first reaction was: maybe Chiba already looks somewhat like Rust, so when the model writes Chiba, it borrows from the Rust distribution.

You can crudely say that Rust's father is C and its mother is OCaml.

If I say Chiba just as crudely, Chiba's father is SML and its mother is C.

Neither description is rigorous, but as a metaphor for language temperament, it helps. Rust combines C's control, machine reality, layout, and systems pressure with the ML family's algebraic data types, pattern matching, type discipline, and expression-oriented taste. Chiba is attempting a related mixture, except its ML side is closer to SML while the other side still pulls toward C's machine reality.

So for a while I suspected that Chiba's shape was close enough to Rust that the model could borrow Rust priors during zero-shot Chiba generation.

For example, it knows a compiler project should have ASTs, parsers, diagnostics, lowering, type contexts, arenas, symbol tables, and error enums. It knows how such things are often layered in Rust. Even if Chiba is a new language, it can assemble a plausible structure from Rust, OCaml, SML, compiler crates, and PL blogs.

That explains part of it.

But it does not explain everything. If the answer were only that Chiba resembles Rust, then Chiba generation should be just as clean. In reality, Chiba generation is somewhat better than JS, but it still drifts. It invents styles before semantics are stable, piles together locally clever structures, and half-imports Rust or ML habits into Chiba.

Chiba has not had its target drawn by the world.

---

## 后来我发现，大模型在作弊

后来我意识到，我之前把问题问错了。

这不是“为什么 LLM 对 Rust zero-shot 这么强”。这更像是：**大模型在 Rust 上根本不是真的 zero-shot。**

它是在作弊。

当然不是说它违反规则。我的意思是，Rust 这个语言生态已经提前把“好代码应该长什么样”画得太清楚了。模型不是先在空中射箭，然后我们再去解释它为什么射中了。更像是 Rust 社区已经画了很多年靶子，模型只是站在这个靶场里射箭。

统一格式、稳定标准库、官方文档、Clippy、compiler diagnostics、API Guidelines、crates、blog、HN 讨论、review 习惯、错误信息、开源项目，全都在反复告诉模型：这就是 Rust，这样写更像 Rust，那样写不像。

所以当我让 Agent 写 Rust reference Chiba compiler 时，它不是从零开始理解 Chiba。它先把任务投影到“Rust 编译器项目应该怎么长”这个已经很厚的分布上，再从 spec 里补 Chiba 的差异。

这就是先射箭后画靶子。

不是我先画了 Chiba 的靶子，让模型射中。是模型先射到 Rust 的靶子上，然后我发现，哎，这个靶子居然离 Chiba 想要的工程形态不算远。

## Then I Realized the Model Was Cheating

Later I realized I had asked the wrong question.

This is not "why are LLMs so good at zero-shot Rust." It is more like: **on Rust, the model is not truly zero-shot at all.**

It is cheating.

Not cheating in the sense of breaking rules. I mean that the Rust ecosystem has already made "what good code looks like" extremely clear. The model is not shooting into empty air and then waiting for us to explain why it hit something. The Rust community has been drawing the target for years, and the model is shooting inside that range.

Unified formatting, a stable standard library, official documentation, Clippy, compiler diagnostics, API Guidelines, crates, blogs, HN discussions, review habits, error messages, and open-source projects all repeatedly tell the model: this is Rust, this looks like Rust, that does not.

So when I ask an agent to write a Rust reference Chiba compiler, it is not understanding Chiba from zero. It first projects the task onto the thick distribution of "what a Rust compiler project should look like," then fills in Chiba-specific differences from the spec.

That is shooting first and drawing the target later.

I did not draw the Chiba target first and have the model hit it. The model shot at the Rust target first, and then I realized that this target happened to be uncomfortably close to the engineering shape I wanted for Chiba.

---

## 为什么 JS 那边容易变成一坨

这也解释了为什么 JS gate 那边容易变成一坨。

不是因为 JavaScript 一定差。JS 生态有很多非常强的项目，也有非常成熟的工程体系。但对 LLM 来说，JS 的训练分布太宽了。

它见过浏览器脚本，见过 Node CLI，见过 React，见过 Express，见过测试框架胶水，见过 build tool 配置，见过十年前的 callback，见过 TypeScript，见过半 JS 半 TS，见过 CommonJS，见过 ESM，见过临时脚本，见过 production framework，见过 npm 包里各种奇怪历史债。

当你让模型写 JS gate，它很容易选择“能跑就行”的路径。尤其是在 validation 这种任务里，它会不断引入小脚本、小胶水、小 bypass、小 adapter。每个单独看都合理，合在一起就开始像泥。

Rust 不一样。Rust 的分布也复杂，但它会不断把模型往一个更窄的道路上拉。`cargo fmt` 会拉一次，Clippy 会拉一次，compiler error 会拉一次，`Result` 和类型边界会拉一次，社区 idiom 会再拉一次。

JS 的问题不是没有靶子，而是靶子太多。模型射中了一个，下一箭又射中另一个，最后你得到的是一堆互相都能解释、放在一起却很脏的东西。

## Why the JS Side Turns Into Mud

This also explains why the JS gate side easily turns into mud.

Not because JavaScript is necessarily bad. The JS ecosystem has many excellent projects and mature engineering systems. But for LLMs, the JS training distribution is too wide.

The model has seen browser scripts, Node CLIs, React, Express, test-framework glue, build-tool configuration, ten-year-old callbacks, TypeScript, half-JS-half-TS projects, CommonJS, ESM, temporary scripts, production frameworks, and strange historical debt inside npm packages.

When you ask it to write JS gates, it easily chooses the "just make it run" path. Especially in validation tasks, it keeps introducing small scripts, small glue, small bypasses, and small adapters. Each piece looks reasonable in isolation. Together, they become mud.

Rust is different. Rust's distribution is complex too, but it keeps pulling the model toward a narrower road. `cargo fmt` pulls once. Clippy pulls once. Compiler errors pull once. `Result` and type boundaries pull once. Community idiom pulls again.

The JS problem is not that there are no targets. There are too many targets. The model hits one, then hits another, and what you get is a pile of things that are individually explainable but collectively dirty.

---

## Rust 把靶子画得太清楚了

所以这里才轮到 Rust。

Rust 社区过去十几年做了很多看起来无聊、烦人、甚至有点洁癖的事。现在看，它们全都变成了 LLM 时代的训练优势。

首先是风格。Rust 有官方 [Rust Style Guide](https://doc.rust-lang.org/style-guide/index.html)，`rustfmt` 又把格式选择压得很窄。到 Rust 2024，官方还把 [rustfmt style edition](https://doc.rust-lang.org/beta/edition-guide/rust-2024/rustfmt-style-edition.html) 放进 edition 叙事里。对人类来说，这是减少争论；对模型来说，这是减少分布噪音。

然后是第一方 API 品味。Rust 的 [API Guidelines](https://rust-lang.github.io/api-guidelines/) 不是随便写几个最佳实践，而是在告诉整个生态：命名、互操作、可预测性、灵活性、类型安全、可靠性、可调试性应该怎样表达。标准库和官方文档长期重复这种品味，模型自然会学到。

再然后是社区洁癖工具化。Clippy 的官方文档说它用于 [catch common mistakes and improve Rust code](https://doc.rust-lang.org/clippy/)，而 [Clippy lint list](https://doc.rust-lang.org/clippy/lints.html) 不只是 correctness，还有 style、complexity、perf、pedantic、restriction。Rust 官方工具页也把 [Clippy](https://www.rust.dev/tools/clippy) 描述为帮助写 idiomatic and correct Rust 的 linter。

这很关键。因为 LLM 不会真的被 code review 骂醒，但它会被训练数据里的偏好信号塑形。Rust 社区把很多“这样写不对味”变成了工具、文档、错误信息、issue 讨论和 PR 习惯。

HN 上关于 [Rust Design Patterns](https://news.ycombinator.com/item?id=25620110) 的讨论里也能看到这种直觉：Clippy 不只是抓 bug，也是在教很多人什么是 good Rust patterns。

## Rust Drew the Target Too Clearly

This is where Rust enters the story.

Over the last decade, the Rust community has done many things that looked boring, annoying, or even obsessive. In the LLM era, those things become training advantages.

First, style. Rust has an official [Rust Style Guide](https://doc.rust-lang.org/style-guide/index.html), and `rustfmt` narrows formatting choices aggressively. With Rust 2024, the official docs even place [rustfmt style edition](https://doc.rust-lang.org/beta/edition-guide/rust-2024/rustfmt-style-edition.html) inside the edition story. For humans, this reduces argument. For models, it reduces distribution noise.

Then, first-party API taste. Rust's [API Guidelines](https://rust-lang.github.io/api-guidelines/) are not just a few casual best practices. They tell the ecosystem how naming, interoperability, predictability, flexibility, type safety, dependability, and debuggability should be expressed. The standard library and official docs repeat this taste for years, and the model learns it.

Then, community cleanliness becomes tooling. Clippy's official documentation says it helps [catch common mistakes and improve Rust code](https://doc.rust-lang.org/clippy/), while the [Clippy lint list](https://doc.rust-lang.org/clippy/lints.html) includes not only correctness but also style, complexity, performance, pedantic, and restriction categories. The official Rust tools page describes [Clippy](https://www.rust.dev/tools/clippy) as a linter for idiomatic and correct Rust.

This is crucial. An LLM will not actually wake up because a reviewer scolds it, but it will be shaped by preference signals in the training data. Rust turned many "this does not feel right" judgments into tools, docs, error messages, issue discussions, and PR habits.

You can see the same intuition in the HN discussion around [Rust Design Patterns](https://news.ycombinator.com/item?id=25620110): Clippy is not just catching bugs; it is also teaching many people what good Rust patterns look like.

---

## Rust 编译器错误信息，是模型的第二轮 prompt

还有一个更直接的优势：Rust 编译器错误信息太适合喂回给模型了。

在自举那条线里，我需要自己搭 harness，让 agent 的每一步都有 ground truth。Rust 则自带一大块 ground truth。Rust compiler dev guide 对 [diagnostics](https://rustc-dev-guide.rust-lang.org/diagnostics.html) 的结构讲得很清楚：error code、span、label、note、help、suggestion。错误不是一坨日志，而是一组面向修复的信号。

这对 agent loop 很友好。

HN 上关于 [RustAssistant](https://news.ycombinator.com/item?id=43851143) 的讨论很适合看这个现象。对应的 Microsoft Research 论文 [Fixing Rust Compilation Errors using LLMs](https://www.microsoft.com/en-us/research/publication/fixing-rust-compilation-errors-using-llms/) 和 [arXiv 版本](https://arxiv.org/abs/2308.05177) 直接研究了用 LLM 修 Rust 编译错误，并在真实开源 Rust 仓库编译错误上报告了大约 74% 的修复准确率。

这当然不说明 LLM 修 Rust 已经完美。borrow checker 一样会让模型绕圈。但相比 JS 那种“局部跑了、全局脏了、边界以后再说”的失败，Rust 的失败更早、更硬、更容易复制，也更容易被塞回下一轮 prompt。

HN 上另一个关于 [Evolution of Rust Compiler Errors](https://news.ycombinator.com/item?id=44005195) 的讨论，也能看到类似直觉：LLM 和 agent 时代，详细、可读、可行动的错误日志会越来越重要。

## Rust Compiler Errors Are Second-Round Prompts

There is another direct advantage: Rust compiler errors are extremely easy to feed back into models.

On the bootstrap path, I need to build harnesses so every agent step can collide with ground truth. Rust ships with a large amount of ground truth already. The Rust compiler dev guide explains the structure of [diagnostics](https://rustc-dev-guide.rust-lang.org/diagnostics.html): error codes, spans, labels, notes, help messages, and suggestions. An error is not a blob of logs. It is a set of repair-oriented signals.

That is friendly to agent loops.

The HN discussion of [RustAssistant](https://news.ycombinator.com/item?id=43851143) is useful here. The corresponding Microsoft Research paper, [Fixing Rust Compilation Errors using LLMs](https://www.microsoft.com/en-us/research/publication/fixing-rust-compilation-errors-using-llms/), and its [arXiv version](https://arxiv.org/abs/2308.05177), directly study using LLMs to fix Rust compilation errors and report roughly 74% fix accuracy on compilation errors from real open-source Rust repositories.

This does not mean LLMs can fix Rust perfectly. The borrow checker can still make models loop. But compared with JS failures where something runs locally, becomes globally dirty, and postpones boundaries until later, Rust failures are earlier, harder, more reproducible, and easier to feed into the next prompt.

Another HN discussion, [Evolution of Rust Compiler Errors](https://news.ycombinator.com/item?id=44005195), shows a similar intuition: in the LLM and agent era, detailed, readable, actionable error logs will matter more and more.

---

## LLM 公司也不会放过 Rust 这个靶子

还有一个现实因素：我不相信主流 LLM 公司会放过 Rust。

公开资料不会告诉你“我们给 Rust 加权多少”。所以这句话不能写成内部事实。但外部信号已经足够明显：Rust 是主流 code model 必须认真对待的语言。

[Aider LLM Leaderboards](https://aider.chat/docs/leaderboards/) 的 polyglot benchmark 覆盖 C++、Go、Java、JavaScript、Python、Rust；[Epoch AI 对 Aider Polyglot 的说明](https://epoch.ai/benchmarks/aider-polyglot) 也明确把 Rust 放在评测语言里。Rust 已经不是“可能有用户问”的语言，而是 coding benchmark 的固定靶面。

训练数据层面也一样。[StarCoder](https://huggingface.co/blog/starcoder) 这类开放 code model 基于 GitHub permissive data 和 80+ programming languages；[DeepSeek Coder](https://deepseekcoder.github.io/) 公开说过它在 2T tokens 和 80+ programming languages 上预训练；[Qwen2.5-Coder](https://qwenlm.github.io/blog/qwen2.5-coder/) 强调覆盖 92 种编程语言，并系统提升 code generation、completion、repair、reasoning。

这些材料不能证明“所有公司都专门强化 Rust”。但它们足够说明：代码模型正在吞多语言开源生态，而 Rust 作为系统语言、基础设施语言、Wasm 语言、安全敏感项目语言，不可能只是角落里的副产品。

甚至在代码迁移研究里，Rust 也经常直接成为目标。[Towards Translating Real-World Code with LLMs: A Study of Translating to Rust](https://arxiv.org/abs/2405.11514)、[VERT: Verified Equivalent Rust Transpilation with Large Language Models](https://arxiv.org/abs/2404.18852)、[SafeTrans: LLM-assisted Transpilation from C to Rust](https://arxiv.org/abs/2505.10708) 都把生成或迁移到 Rust 当成明确问题。

所以我的结论不是“Rust 在所有 benchmark 上第一”。Python 在短题上仍然很强，JS 在生态胶水上也很强。我的结论更窄，也更重要：**Rust 是一个已经被社区和模型公司共同画好靶子的语言。**

## LLM Companies Will Not Ignore the Rust Target

There is also a practical factor: I do not believe major LLM companies will ignore Rust.

Public materials will not tell you how much extra weight Rust received. So this cannot be written as an internal fact. But the external signals are clear enough: Rust is a language mainstream code models must take seriously.

The [Aider LLM Leaderboards](https://aider.chat/docs/leaderboards/) polyglot benchmark covers C++, Go, Java, JavaScript, Python, and Rust. [Epoch AI's description of Aider Polyglot](https://epoch.ai/benchmarks/aider-polyglot) also explicitly includes Rust among the evaluated languages. Rust is no longer just a language users might ask about. It is part of the fixed target surface for coding benchmarks.

The training-data story points in the same direction. Open code models like [StarCoder](https://huggingface.co/blog/starcoder) are based on GitHub permissive data across 80+ programming languages. [DeepSeek Coder](https://deepseekcoder.github.io/) publicly describes pretraining on 2T tokens and 80+ programming languages. [Qwen2.5-Coder](https://qwenlm.github.io/blog/qwen2.5-coder/) emphasizes coverage of 92 programming languages and improvements across code generation, completion, repair, and reasoning.

These sources do not prove that every company explicitly strengthened Rust. But they show enough: code models are ingesting multilingual open-source ecosystems, and Rust, as a systems, infrastructure, Wasm, and security-sensitive language, is very unlikely to be a side product hidden in the corner.

Rust also appears directly as a target in code migration research. [Towards Translating Real-World Code with LLMs: A Study of Translating to Rust](https://arxiv.org/abs/2405.11514), [VERT: Verified Equivalent Rust Transpilation with Large Language Models](https://arxiv.org/abs/2404.18852), and [SafeTrans: LLM-assisted Transpilation from C to Rust](https://arxiv.org/abs/2505.10708) all make generation or migration to Rust an explicit problem.

So my conclusion is not that Rust ranks first on every benchmark. Python is still strong on short problems, and JS is strong at ecosystem glue. My narrower and more important conclusion is this: **Rust is a language whose target has already been drawn by both its community and the model ecosystem.**

---

## 这对 Chiba 来说才是重点

如果这篇只是在夸 Rust，那就没什么意思。

对我真正有用的结论是：Chiba 不能等生态自然长出来。尤其不能等“先随便写，等用户多了再统一风格”。

在 LLM 时代，这个想法很危险。

因为未来几个月，模型公司会继续训练，继续抓新语言、新框架、新 repo、新 benchmark、新文档。它们不一定理解 Chiba 想表达什么，但它们会吃下 Chiba 能被公开看见的一切：spec、STD、第一方库、示例、gate、validation compiler、错误信息、issue、blog、commit。

如果第一批 Chiba 代码是乱的，模型会学会乱的 Chiba。

如果第一批 Chiba 文档同时存在三种语气，模型会学会三种互相冲突的 Chiba。

如果 STD 为了短期方便接受不克制的 API，模型会把这些 API 当成 Chiba 的主流写法。

如果第一方库里有一堆临时 hack，未来的 agent 会把这些 hack 重新生成给用户。

这就是 Rust reference compiler 那件事真正刺痛我的地方。它不是告诉我“以后都用 Rust 写”。它告诉我：**如果 Chiba 自己不画靶子，模型就会借 Rust 的靶子来写 Chiba。**

这短期看起来很好，因为 Rust 的靶子很干净。但长期看很危险。Chiba 不是 Rust。Chiba 的爹是 SML，妈是 C。它可以借 Rust 的工程纪律，但不能变成 Rust 的影子。

## This Is the Point for Chiba

If this article only praised Rust, it would not matter much.

The useful conclusion for me is that Chiba cannot wait for its ecosystem to grow naturally. It especially cannot say, "write whatever for now; we will unify the style after users arrive."

In the LLM era, that idea is dangerous.

Over the next few months, model companies will keep training. They will keep collecting new languages, new frameworks, new repositories, new benchmarks, and new documentation. They may not understand what Chiba is trying to express, but they will ingest everything publicly visible: specs, standard library, first-party libraries, examples, gates, validation compilers, error messages, issues, blogs, and commits.

If the first Chiba code is messy, models will learn messy Chiba.

If the first Chiba documentation has three voices, models will learn three conflicting Chibas.

If the standard library accepts unrestrained APIs for short-term convenience, models will treat those APIs as mainstream Chiba style.

If first-party libraries contain temporary hacks, future agents will regenerate those hacks for users.

That is what hurt about the Rust reference compiler result. It did not tell me "write everything in Rust forever." It told me: **if Chiba does not draw its own target, models will borrow Rust's target when writing Chiba.**

In the short term, that looks good because Rust's target is clean. In the long term, it is dangerous. Chiba is not Rust. Chiba's father is SML, and its mother is C. It can borrow Rust's engineering discipline, but it cannot become Rust's shadow.

---

## 所以 Chiba 的第一方材料必须偏执统一

这就是我现在对 Chiba 的新要求。

Chiba 的文档、STD、第一方库、示例代码、错误信息、gate、validation surface，必须保持偏执级别的统一风格。不是为了装专业，不是为了写给官网访客看，而是因为这些东西会变成未来模型眼里的 Chiba。

我必须把第一方材料写成靶子。

STD 不能只是“能用”。它必须体现我希望用户采用的写法。

文档不能只是“说明清楚”。它必须用同一种语言习惯反复表达同一种边界。

示例不能只是“跑得通”。它必须干净到可以被模型直接学习。

错误信息不能只是“报错”。它必须给人和 agent 都能回灌的修复信号。

gate 不能只是“临时过一下”。它必须告诉未来模型什么叫成功，什么叫失败。

Rust 给我的启发不是“Rust 比 Chiba 好”。Rust 给我的启发是：一个语言如果长期、稳定、克制地告诉世界“好代码长这样”，那么 LLM 最终会学会这个形状。

现在的问题是：Chiba 要不要也拥有自己的形状？

我的答案是，要。

而且必须从现在开始。

## Chiba's First-Party Material Must Be Obsessively Unified

This is my new requirement for Chiba.

Chiba's documentation, standard library, first-party libraries, examples, error messages, gates, and validation surface must keep an almost obsessive level of unified style. Not to look professional. Not for homepage visitors. Because these materials will become Chiba in the eyes of future models.

I have to write first-party material as the target.

The standard library cannot merely be usable. It must express the style I want users to adopt.

Documentation cannot merely explain things clearly. It must use the same language habits to express the same boundaries again and again.

Examples cannot merely run. They must be clean enough for models to learn directly.

Error messages cannot merely report errors. They must provide repair signals that both humans and agents can feed back into the loop.

Gates cannot merely pass temporarily. They must tell future models what success and failure mean.

Rust's lesson is not "Rust is better than Chiba." Rust's lesson is that if a language tells the world, steadily and with restraint, what good code looks like, LLMs will eventually learn that shape.

The question now is: should Chiba have its own shape?

My answer is yes.

And it has to start now.

---
title: "CHIBA's Level-1: PL created overnight using AI Agent Engineering like Sunomata Overnight Castle"
description: 'Chiba Level-1 did not appear out of nowhere. It was assembled through specs, harnesses, context engineering, agent loops, and finally Codex turning a prepared pile of documents and Level-0 code into a real next-stage compiler.'
pubDate: 'May 10 2026'
heroImage: '/chiba5.png'
ogImage: 'https://chiba-lang.org/chiba5.png'
---


> 墨俣一夜城是由织田信长命丰臣秀吉所筑的前线据点。传说里它像一夜之间冒出来，像魔术，像神迹，像不讲道理的速度。但任何真的建过东西的人都知道，一夜城之所以能一夜出现，不是因为它真的只花了一夜，而是因为有人在此前很久就把木料、人手、渡河路线、搬运顺序、监工体系、撤退预案都准备好了。
>
> Sunomata Castle was a forward outpost built by Toyotomi Hideyoshi at the behest of Oda Nobunaga. Legend has it that it appeared overnight, like magic, like a miracle, like an unreasonable speed. But anyone who has actually built anything knows that the reason a castle could appear overnight was not because it really only took one night, but because someone had prepared the timber, manpower, river crossing routes, transport order, supervision system, and evacuation plans long beforehand.

## 我们为什么能这么快做出 Level-1 （冒烟测试通过）

很多人看到 Chiba Level-1 的进展，第一反应是：这速度是不是有点离谱。

说实话，是有点离谱。

如果按传统语言项目的节奏，你先要写设计文档，再写 parser，再写 type checker，再修 IR，再修 codegen，再把前一层的错误全吃一遍，然后你才配说“哦，我们开始有一个像样的下一阶段编译器了”。这一套流程，过去往往按年算，不按周算。

但 Chiba 这次不是那种古典作坊式推进。它不是一个人坐在 Emacs 里，靠意志力一个函数一个函数抠出来。它更像一个前所未有的新工地：PL 经验、人类工程判断、LLM、subagent、harness、spec、context fork、context reuse、eval loop 全都堆在一起，然后终于把一座本来该慢慢长出来的城，硬生生提前抬到了河对岸。

所以这篇文章不是在吹“AI 让一切自动完成”。恰恰相反，这篇文章要说的是另一件更不浪漫的事：**Level-1 之所以快，不是因为 AI 神，而是因为我们把 AI 放进了一套越来越像工业流程的工程结构里。**

## Why We Managed to Build Level-1 So Fast

A lot of people look at the recent pace of Chiba Level-1 and immediately think: this is suspiciously fast.

Honestly, it is.

Under a traditional language-project cadence, you write design docs, then the parser, then the type checker, then repair the IR, then the code generator, then spend another long stretch paying for all the mistakes from the previous layer. Only after that are you allowed to say, with a straight face, that you now have something resembling the next compiler stage. Historically, that timeline is measured in years, not weeks.

But Chiba did not move like a classical workshop project this time. It was not one person sitting in an editor, willing a compiler into existence one function at a time. It looked more like a strange new construction site: PL background, human engineering judgment, LLMs, subagents, harnesses, specs, context forks, context reuse, and evaluation loops all stacked together until a castle that should have grown slowly was suddenly carried across the river ahead of schedule.

So this article is not here to say “AI automated everything.” It is here to argue something less romantic and more important: **Level-1 moved fast not because AI is magical, but because we trapped AI inside an engineering structure that increasingly behaves like an industrial process.**

---

## 第一层地基：不是先写代码，而是先铺文档

很多人对 AI coding 最大的误解，是以为先打开模型，再把需求丢进去，代码就会像老虎机一样往外掉。

这只对最简单的 CRUD、脚手架、样板胶水成立。对编译器不成立。对语言更不成立。因为语言不是一堆功能拼装，它是一整套彼此咬合的语义边界。你如果没有提前把这些边界写下来，AI 只会给你生成一堆局部看起来聪明、全局拼起来互相打架的垃圾。

所以我们一开始做的不是“让模型多写代码”，而是“让模型前面先有足够多的文字可以踩”。这也是 Chiba 一路疯狂写 spec、type_system、misc notes、roadmap 的真正原因。不是因为我有文档癖，而是因为没有这些文档，后面的 agent 系统根本没有稳定落脚点。

文档在这里不是装饰，不是以后给社区看的宣传册，而是模型的地面摩擦力。

你可以把它理解成一种很朴素的 context engineering：不是把上下文窗口当作垃圾桶什么都塞进去，而是有意识地建造一层一层的语义脚手架，让模型在进入某个任务之前，已经踩在定义、命名、约束、边界和例子之上。

今天大家会把这个词说得很时髦，叫 context engineering。其实说白了，就是**你怎么给模型准备工作现场**。

- 什么信息应该长期驻留。
- 什么信息应该只在当前任务局部注入。
- 什么设计必须先写成 spec，不能只留在作者脑子里。
- 什么内容适合 fork 成单独 context 给 subagent。
- 什么结论应该回写成 repo memory，防止下一轮重复犯傻。

如果这些东西没整理，模型就不是在编码，它是在算命。

## The First Foundation: Write the Documents Before the Code

One of the biggest misconceptions around AI coding is the idea that you open a model, throw in a requirement, and code starts pouring out like a slot machine jackpot.

That works only for the simplest CRUD, scaffolding, and boilerplate glue. It does not work for compilers. It definitely does not work for languages. A language is not a pile of features; it is a system of semantic boundaries that must interlock. If those boundaries are not written down in advance, the AI will happily generate local cleverness that becomes global garbage.

So the first real move was not “make the model write more code.” It was “make sure there is enough text in front of the model for it to stand on.” That is the real reason Chiba kept producing specs, type-system notes, miscellaneous design pages, and roadmaps at such high volume. Not because I fetishize documents, but because without them the later agent system would have no stable foothold.

Here, documents are not decoration. They are not brochures for a future community. They are the friction surface that keeps the model from sliding off the road.

This is the plain version of what people now like to call context engineering: not treating the context window as a trash can, but deliberately building semantic scaffolding so that before the model enters a task, it is already standing on definitions, names, constraints, boundaries, and examples.

The phrase sounds fashionable now. In practice it just means: **how do you prepare the worksite for the model?**

- What information should stay resident for a long time.
- What should be injected only for the current task.
- What designs must be written as spec instead of left inside the author’s head.
- What should be forked into a dedicated context for a subagent.
- What conclusions should be written back as memory so the next pass does not repeat the same stupidity.

If you do not organize that, the model is not coding. It is fortune-telling.

---

## 第二层地基：Level-0 不是废案，而是给 Level-1 准备的尸体

另一个常见误会是，以为 Level-0 做完之后就该被优雅地扔掉。不是。Level-0 在这里不是一个过渡 demo，而是一具非常有价值的尸体。

它不够好，不够稳，不够干净，很多地方甚至很丑，但它已经把“路线能不能通”这个问题回答过一次了。它已经给出了一份脏但真实的地形图：lexer 会在哪些地方塌，parser 容易在哪些语法点崩，codegen 最容易在哪种 lowering 上吐血，什么 ABI 假设看起来可行，什么内存模型一写就炸。

这意味着 Level-1 不是在真空里开始的，它是踩着一具已经死过一次的前身往前走的。

而这正是 AI 最适合干的一种活：不是从绝对零开始创造宇宙，而是对着一堆半成品、旧代码、spec、todo、注释、目录结构、临时约定、失败痕迹，去做大规模重组、搬运、翻译和收口。

这也是为什么我说最终使用 Codex 从 level-0 和一堆 docs/specs/todos 做出 level-1，这句话不是玩笑，而是工程事实。

Codex 在这里不是“一个更会补全的模型”，而更像一个可以被异步派工的软件工程智能体：它在独立环境里拿着代码库、说明文档和测试命令工作，可以读、写、跑、验证，并把行动轨迹作为证据交出来。它不是神谕，它更像一个会自己开终端、看日志、交补丁的远程工人。

最关键的是，它擅长接手那些**范围明确但上下文很厚**的任务。比如：

- 根据现有 spec 把一个目录的文档整体收口。
- 把 level-0 中某段已经存在的实现迁到新的结构里。
- 对着 todo 和已有实现补一轮 parser / typechecker 的骨架。
- 跑构建、看错误、回头修补，并重复几轮。

这种任务人做当然也能做，但很容易被上下文切换拖死。Codex 这种异步型 coding agent 的价值，就在于它能把这类长链但边界明确的工作从作者脑子里卸走。

## The Second Foundation: Level-0 Was Not Trash, but a Prepared Corpse for Level-1

Another common misunderstanding is the assumption that once Level-0 exists, it should be elegantly discarded. No. In this story, Level-0 is not a disposable demo. It is a very useful corpse.

It is not good enough, not stable enough, not clean enough, and in many places frankly ugly. But it has already answered the question of whether the route works at all. It has already produced a dirty but real terrain map: where the lexer collapses, which syntax points make the parser fall apart, which lowering paths make codegen cough blood, which ABI assumptions look survivable, which memory-model ideas explode on contact.

That means Level-1 did not begin in a vacuum. It moved forward by stepping on the body of something that had already died once.

And that is exactly the kind of work AI is unusually good at: not creating a universe from absolute zero, but taking half-finished code, old implementations, specs, TODOs, comments, directory structures, temporary conventions, and failure traces, then doing large-scale reorganization, transfer, translation, and closure.

That is why saying that Level-1 was ultimately produced by Codex from Level-0 plus a heap of docs, specs, and TODOs is not a joke. It is an engineering description.

In this setting, Codex is not “a model that autocompletes better.” It is closer to an asynchronously delegated software-engineering agent: it works inside an isolated environment with the repository, the docs, and the test commands; it can read, write, run, verify, and then present its work as traceable evidence. It is not an oracle. It is more like a remote worker who knows how to open a terminal, read logs, and hand back patches.

Most importantly, it is strong at tasks that are **well-scoped but context-heavy**. For example:

- tighten an entire docs directory based on the existing spec,
- move a Level-0 implementation fragment into a new structure,
- scaffold parser or type-checker pieces from TODOs and existing code,
- run builds, inspect failures, repair, and repeat.

Humans can do all of this too. But humans get destroyed by context switching. The value of an asynchronous coding agent like Codex is that it can offload exactly this kind of long-chain, bounded work from the author’s head.

---

## Harness engineering：不是让模型更聪明，而是让错误更容易暴露

再往下一层，就是很多人嘴里说得少、但实际最值钱的东西：harness。

如果说 spec 是给模型踩的地面，那么 harness 就是你给模型修的防撞墙、测试跑道和裁判系统。

我这里说的 harness engineering，不是某个官方定义非常死的术语，而是一种非常具体的工程方法：你怎么搭一个环境，让模型每做一步都更容易被验证、更容易出错时暴露、更容易在局部循环里纠正，而不是一路写到最后才发现整片工地歪了。

比如：

- 让构建命令稳定、便宜、可重复。
- 让目录结构足够清晰，模型能快速找到锚点。
- 让 spec 与实现足够近，模型不至于读三层目录还找不到 controlling code path。
- 让 patch、diff、build、grep、test 这些动作形成闭环。
- 让失败时输出足够“可判读”，而不是一坨噪音。

很多人以为 prompt engineering 才是 AI coding 的核心。其实到编译器这种级别，prompt 早就不够了。真正的核心是 harness engineering。因为 prompt 再好，也只是第一脚油门；真正决定你能不能跑起来的，是路有没有铺、弯道有没有护栏、撞车以后有没有黑匣子。

Anthropic 那篇《Building effective agents》讲得很对：复杂 agent 系统真正有效，不是因为框架花哨，而是因为工具边界清楚、流程简单、环境反馈真实、可验证循环存在。说白了，agent 不是靠“自主性”活着，agent 是靠“每一步都能拿到地面真相”活着。

编译器工程恰好特别适合这个。因为代码能 build，能 test，能报错，能 diff，能看 IR，能看 crash。也就是说，它有天然的 ground truth。这比很多纯内容写作任务幸福太多了。

## Harness Engineering: Not Making the Model Smarter, but Making Errors Easier to Expose

Below that sits something many people talk about less, even though it is one of the most valuable parts of the stack: the harness.

If the spec is the floor the model stands on, the harness is the crash barrier, test runway, and judging system built around it.

By harness engineering I do not mean some rigid official term. I mean a very concrete engineering practice: how do you construct an environment where every step the model takes is easier to verify, easier to expose when wrong, and easier to correct in a local loop instead of drifting all the way to the end before the whole site tilts sideways?

For example:

- build commands should be stable, cheap, and repeatable,
- the directory structure should be clear enough for the model to find anchors quickly,
- the spec should live close enough to the implementation that the model can find the controlling code path,
- patch, diff, build, grep, and test should form a loop,
- failure output should be readable rather than pure noise.

A lot of people assume prompt engineering is the core of AI coding. Once you are at compiler scale, it is not enough. The core becomes harness engineering. A prompt is only the first press on the accelerator. What actually determines whether you move is whether the road is paved, whether the turns have barriers, and whether the crash leaves a black box.

Anthropic’s “Building effective agents” makes this point well: agent systems become effective not because the framework is fancy, but because tool boundaries are clear, the workflow is simple, the environmental feedback is real, and there is a verifiable loop. Put bluntly, agents do not live on autonomy. They live on ground truth.

Compiler work is unusually well suited for this because code can build, test, fail, diff, expose IR, and crash loudly. In other words, it has native ground truth. That is a much happier setting than most pure content-generation tasks.

---

## Subagent 不是分身术，是任务分治

这时候就能说到另一个现在很热的词：subagent。

很多人第一次听 subagent，会脑补成“多个 AI 人格在群聊里开会”。这当然可以做，但真正有工程价值的不是人格戏剧，而是任务分治。

subagent 的本质，不是让多个模型互相吹捧，而是把一个大问题拆成几个更窄、更干净、上下文污染更少的小问题，然后并行或者半并行地跑。

例如一篇文档任务，可以拆成：

- 一个 subagent 只负责搜现有 spec 的冲突点。
- 一个 subagent 只负责看 build / lint / test 能不能过。
- 一个 subagent 只负责研究外部概念，比如 Codex、agent workflow、context reuse 这些词到底该怎么讲才不外行。
- 主 agent 再把这些结果收口，决定真正写什么、改什么、删什么。

Anthropic 那篇文章里把这类模式叫 orchestrator-workers，也提到 parallelization、evaluator-optimizer。这些词听起来像白皮书，但落到现实里其实很朴素：**你不要让同一个模型在一次上下文里同时做检索、判断、起草、批改、验证和总结。你会把它压成一滩。**

Subagent 的最大价值，就是减少相互污染。

一个上下文里刚讨论完 type system soundness，再让它立刻去写市场文案、搜网页、修 frontmatter、跑构建，你会得到一个非常疲惫、开始胡说八道的系统。把任务拆出去，分别喂上下文，再把结果汇总，这不是奢侈，是必要的卫生习惯。

当然，subagent 也不是越多越好。分得太细，通信成本会吃掉收益，最后变成一堆 agent 在互相转述。真正好的 subagent 使用方式，不是“越多越先进”，而是“只在复杂度真的值得的时候分治”。

## Subagents Are Not Clone Magic, but Task Decomposition

This leads to another hot term: subagents.

The first time many people hear it, they imagine multiple AI personalities holding a little internal panel discussion. That can be entertaining, but the real engineering value lies elsewhere. What matters is decomposition.

A subagent is not fundamentally about several models praising each other. It is about splitting a large problem into narrower, cleaner subproblems with less context contamination, then running them in parallel or semi-parallel.

For example, a documentation task can be split into:

- one subagent that only searches for conflicts in the current spec,
- one subagent that only checks whether build, lint, or tests pass,
- one subagent that only researches external concepts like Codex, agent workflows, or context reuse,
- then a main agent that synthesizes those results and decides what to actually write, edit, or delete.

Anthropic describes related patterns as orchestrator-workers, parallelization, and evaluator-optimizer. Those terms sound white-paper-ish, but the practical meaning is very simple: **do not force the same model instance to do retrieval, judgment, drafting, critique, verification, and summarization inside a single overloaded context. You will flatten it.**

The greatest value of subagents is reducing mutual contamination.

If one context just spent a long time discussing type-system soundness, and then you immediately ask it to write marketing copy, browse the web, fix frontmatter, and run builds, you get a tired system that starts hallucinating with confidence. Splitting work into separate contexts and then merging the results is not luxury. It is hygiene.

Of course, more subagents are not automatically better. Split too far and the communication overhead eats the gain, until the whole system degenerates into agents relaying summaries to other agents. Good subagent usage is not “the more the better.” It is “split only when the complexity actually warrants it.”

---

## Context fork 和 context reuse：这不是 token economy，这是记忆外科手术

再进一步，才是这套系统最关键也最容易被外界低估的一层：fork context 和 context reuse。

大模型最贵的资源不是参数，不是调用次数，而是有效上下文。你每开一轮新任务，都在重新决定：

- 我要继承哪些记忆。
- 我要故意忘掉哪些噪音。
- 我要让这个新任务看见多少历史。
- 我要不要把之前已经得出的结论打包后重新注入。

如果说普通软件工程里的模块化，是在管理代码之间的依赖；那么 agent 工程里的 context fork，本质上是在管理**认知依赖**。

一个好 fork，不只是复制聊天记录，而是把任务所需的最小真实历史打包给下一个工作单元。一个好 reuse，也不是把整个对话重新塞进去，而是把已经验证过的结论、命令、接口、限制、失败经验压缩成可复用的语义块。

这个东西今天在很多团队里被叫 context engineering，也有人把它视为下一代 prompt engineering。我的看法更粗暴一点：这其实是在做记忆外科手术。

你得不断判断：

- 哪些历史保留会提高成功率。
- 哪些历史保留只会制造幻觉和路径依赖。
- 哪些上下文该被 fork 成平行支线。
- 哪些结论该回写成 memory 或 spec，成为以后所有任务的公共地基。

Chiba 这次能快，一个很重要的原因，就是不是每轮都从零开聊。很多局部任务都能直接吃到前面几轮留下来的设计骨架、目录锚点、验证命令、术语约束和失败教训。也就是说，速度不是只来自模型更强，而是来自**上下文资产开始复利**。

## Context Fork and Context Reuse: Not Token Economy, but Memory Surgery

Go one layer deeper and we reach the part that matters most and is easiest for outsiders to underestimate: context fork and context reuse.

The most expensive resource in large-model work is not parameters, nor invocation count, but effective context. Every time you open a new task, you are deciding:

- which memories to inherit,
- which noise to intentionally forget,
- how much history the new task should be allowed to see,
- whether previously reached conclusions should be repackaged and re-injected.

If modularity in ordinary software engineering is about managing code dependencies, then context fork in agent engineering is really about managing **cognitive dependencies**.

A good fork is not just copying the chat transcript. It is packaging the smallest true history that the next work unit actually needs. Good reuse is not dumping the whole previous conversation back in. It is compressing verified conclusions, commands, interfaces, constraints, and failure lessons into reusable semantic chunks.

Today a lot of people call this context engineering, and some treat it as the next generation of prompt engineering. My own view is less elegant: it is memory surgery.

You constantly have to judge:

- which history helps success,
- which history only creates hallucination and path dependence,
- which contexts should be forked into parallel branches,
- which conclusions should be written back into memory or spec as shared ground for future tasks.

One major reason Chiba moved quickly is that not every round restarted from zero. Many local tasks could directly consume design skeletons, directory anchors, validation commands, terminology constraints, and failure lessons left behind by previous rounds. In that sense, the speed came not only from stronger models, but from **context assets beginning to compound**.

---

## Agent loop：左脚踩右脚，不是玄学，是 evaluator-optimizer

大纲里那句“左脚踩着右脚写出 subagent 的 prompt”其实很准确，而且很重要。因为 AI coding 到今天，最值钱的往往不是一次性生成，而是循环论证。

你先让模型写一个方案。

再让另一个 agent 或同一个 agent 的下一轮去批判它。

再把批判结果喂回去，让它重写。

再用 build、test、grep、spec 对齐去验证。

这听起来很像荒唐的永动机，但实际上它对应的是非常老实的 evaluator-optimizer workflow：一个负责产出，一个负责评价，评价标准越清楚，循环就越值钱。

写 spec 是这样，修 docs 是这样，写 parser 是这样，甚至写 prompt 也是这样。你不是指望第一轮神启，而是指望每一轮都把错误压缩一点，把模糊变清楚一点，把局部聪明收束成全局可用。

传统工程当然也有这个过程，只不过以前这个 evaluator 和 optimizer 基本都住在人脑里。现在只不过把其中一些环节外包给了 agent。

所以这不是“模型自我改进”的神话，也不是“AI 会自己递归进化”的科幻。它更接近一个很土的事实：**你终于可以把以前只能在脑子里做的几轮草稿-批改-回写，拆成可并行、可追踪、可局部重跑的流程。**

## The Agent Loop: Standing on Your Own Foot Is Not Mysticism, but Evaluator-Optimizer

The line in the outline about “standing on your own foot to write the subagent prompt” is actually accurate, and important. In AI coding today, the most valuable thing is often not one-shot generation, but iterative argument.

First you ask a model for a plan.

Then you ask another agent, or the next pass of the same agent, to criticize it.

Then you feed the criticism back and ask for a rewrite.

Then you validate the result against build, tests, grep, and the spec.

This sounds like a ridiculous perpetual-motion machine, but it is really just the evaluator-optimizer workflow in practice: one component generates, another evaluates, and the clearer the criteria, the more valuable the loop becomes.

This is how you write specs, how you repair docs, how you build parsers, and even how you write prompts. You are not betting on a first-pass revelation. You are betting that each loop compresses error a little more, sharpens ambiguity a little more, and gradually turns local cleverness into globally usable structure.

Traditional engineering has always contained this loop too. It is just that the evaluator and optimizer used to live almost entirely inside one human head. Now some of those passes can be offloaded to agents.

So this is not the myth of “self-improving AI,” nor a sci-fi fantasy of recursive autonomous evolution. It is something much more grounded: **for the first time, draft-critique-rewrite passes that used to exist only in your skull can be decomposed into workflows that are parallelizable, traceable, and locally rerunnable.**

---

## 为什么这件事现在才成立：模型能力终于碰到了工程接口

到这里还得把时间条件说清楚。不是 2023 年有个 ChatGPT 之后，这件事就天然成立。真正让它开始像样工作的，是最近这一两年模型能力和工程接口一起成熟。

一边是模型越来越像真正的 coding system，而不是纯聊天玩具。

Codex 现在的叙事就很说明问题：它已经不是 IDE 里那个只会续几行代码的老 Codex 了，而是能在隔离环境里并行接任务、读写仓库、运行测试、给出行动证据的软件工程智能体。你可以把任务扔过去，让它异步处理，这本身就改变了“作者如何分配精力”的结构。

另一边是 agent engineering 自己也长出了更像工程学的经验。Anthropic 把 workflow、agent、orchestrator-workers、evaluator-optimizer、tool documentation、ground truth loop 这些模式说清楚以后，大家终于不必假装每个 agent 系统都得从玄学开始。LangChain 这些生态里也越来越强调 tracing、human oversight、offline eval、guardrail 和 observability。

说得直白一点：**现在不是模型单方面变强了，而是“怎么把模型塞进一条能持续产出的工程流水线”这件事，终于开始有方法论了。**

## Why This Only Works Now: Model Capability Finally Met Engineering Interfaces

There is also a timing issue that has to be stated clearly. This did not become real the moment ChatGPT appeared. What changed is that over the last year or two, model capability and engineering interfaces matured together.

On one side, models became more like real coding systems rather than chat toys.

Codex is a good illustration. It is no longer just the old IDE-side Codex that could continue a few lines. It is framed as a software-engineering agent that can take parallel tasks in isolated environments, read and write repositories, run tests, and present evidence of what it did. Once you can hand work to such a system asynchronously, the structure of authorial attention changes.

On the other side, agent engineering itself has become more methodical. Once workflows, agents, orchestrator-workers, evaluator-optimizer loops, tool documentation, and ground-truth feedback loops are described clearly, teams no longer have to pretend every agent system starts from mysticism. Ecosystems around agents increasingly emphasize tracing, human oversight, offline evaluation, guardrails, and observability.

Put plainly: **the change is not only that models got stronger. It is that we now have the beginnings of a methodology for placing models inside a repeatable engineering production line.**

---

## 这不是“AI 替我写语言”，而是“我开始有了一个施工队”

所以如果要把这整件事压缩成一句话，我会这么说：

**Chiba Level-1 不是 AI 替我写出来的，而是我第一次真的拥有了一支可以派工、可以审查、可以分工、可以并行、可以返工的半自动施工队。**

这个施工队当然不稳定，当然会犯错，当然会误解 spec，当然会写烂 prompt，当然会在你没盯着的时候往错误方向狂奔。但这都不是关键。关键是，现在它已经不是无组织的混沌。

- 它有 specs 当脚手架。
- 它有 level-0 当旧地形图。
- 它有 harness 当验证跑道。
- 它有 subagent 当局部分治机制。
- 它有 context fork / reuse 当记忆调度系统。
- 它有 Codex 这种异步 coding agent 当重型劳动力。
- 它有人类作者作为最后的结构工程师，而不是每一颗钉子的手工敲击者。

这就是“墨俣一夜城”的真正含义。

不是说城真的一夜之间凭空长出来，而是说在别人眼里它像是一夜完成，在建造者眼里，它其实是长期铺垫、集中调度、前线组装、快速落地的结果。

Chiba Level-1 也是一样。

你看到的是突然快起来。

我看到的是：spec 终于够厚了，harness 终于够稳了，context 终于能复用了，agent 终于能派工了，Codex 终于能接重活了。

速度不是奇迹。

速度只是准备工作开始兑现利息。

## This Was Not “AI Writing My Language,” but “Finally Having a Construction Crew” 

If I had to compress the whole story into one sentence, it would be this:

**Chiba Level-1 was not written by AI on my behalf. It was the first time I truly had a semi-automatic construction crew that could be delegated to, reviewed, divided, parallelized, and sent back for rework.**

That crew is obviously imperfect. It makes mistakes. It misreads specs. It writes bad prompts. It occasionally sprints in the wrong direction when unsupervised. None of that is surprising. None of that is even the main point. The main point is that the process is no longer unstructured chaos.

- The specs serve as scaffolding.
- Level-0 serves as an old terrain map.
- The harness serves as the verification runway.
- Subagents serve as local decomposition.
- Context fork and reuse serve as memory scheduling.
- Codex-style asynchronous coding agents serve as heavy labor.
- The human author remains the structural engineer, not the person manually hammering every nail.

That is the real meaning of the Sunomata Overnight Castle metaphor.

Not that the castle literally appeared out of nowhere in one night, but that from the outside it looked sudden, while from the inside it was the result of long preparation, concentrated scheduling, frontline assembly, and rapid deployment.

Chiba Level-1 is the same.

From the outside, you see sudden speed.

From the inside, I see that the specs finally got thick enough, the harness finally got stable enough, the context finally became reusable, the agents finally became delegatable, and Codex finally became capable of taking the heavier work.

The speed is not a miracle.

The speed is just preparation beginning to pay interest.

---

## 最后一句：这还不是终点，这只是施工方法第一次跑通

我其实不觉得这篇文章的重点是“我们已经完成了什么”。真正值得写下来的，是我们第一次把一种新的语言工程方法跑通了。

以前做语言，更多像独自修寺庙。

现在做语言，开始有点像指挥一支带着挖机、卡车、测绘员、质检员和夜间施工灯的混合工程队。

它还很新，很乱，很多工具今天看起来还像临时拼起来的怪物。但只要这套方法能持续跑，Chiba 后面的速度未必会越来越快，至少不会再完全回到那种纯手工、纯单线程、纯作者脑力硬顶的旧时代。

这篇文章写的不是 AI 神话。

写的是一个更无聊、也更危险的事实：**从 2026 年开始，小团队做语言这件事，可能真的进入了新工法时代。**

## Final Line: This Is Not the Finish Line, Only the First Time the Construction Method Worked

I do not actually think the most important part of this article is what we have already finished. The more important fact is that we made a new language-engineering method work for the first time.

Building a language used to feel more like repairing a temple alone.

Now it increasingly feels like directing a hybrid crew with excavators, trucks, surveyors, inspectors, and floodlights for night construction.

It is still new. Still messy. Many of the tools still look like monsters assembled from temporary parts. But if the method keeps working, then even if Chiba does not accelerate forever, it may at least never fully return to the old era of pure handcraft, pure single-threaded labor, and pure authorial mental overclock.

This is not an article about AI mythology.

It is about something duller and more dangerous: **from 2026 onward, small teams building languages may genuinely have entered a new age of construction methods.**

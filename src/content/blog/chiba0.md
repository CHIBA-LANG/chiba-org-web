---
title: 'Chiba — Reclaiming the Missing Functional Dimension in Systems Programming'
description: 'Many people have known me for a long time. After wandering through various projects over the years, I recently posted a few tweets, and quite a few old acquaintances said to me: "Its 2026—how are you still building new languages?'
pubDate: 'April 13 2026'
heroImage: '/chiba0.jpeg'
ogImage: 'https://chiba-lang.org/chiba0.jpeg'
---


## 先说声抱歉

很多人很早之前就认识我，兜兜转转，最近写了几篇推文，很多旧相识对我说：
"2026 年了，你怎么还在造新语言。"

我知道这看起来是什么样子——网上躺着几十万个造语言的项目，大部分连最简单的程序都跑不利索，说明文档写得比编译器还长。Chiba 现在看起来也差不多（尽管暂时没有开源），但我不在乎。

最近这一年我在学尺八，就是那个隋唐时期的竹管子。一根管，五个孔，没有任何机械结构。想吹半音？靠嘴唇角度。想要颤音？靠气息流速的微调。想吹出大音量？先学会怎么把气息全部灌进那个不到两厘米的吹口里。

没有捷径，没有辅助按键，没有电子调音器能帮你。你和竹管之间的距离，就是你和音乐之间的距离。

我不想把这搞成什么文艺类比。我想说的很具体：**好的编程语言不应该靠堆特性来获得能力，而应该用最少的原语和它们之间的组合规则，让程序员直接、诚实地控制机器。** 五个孔就够了，前提是你真的理解气息和竹管之间发生了什么。

Chiba 的名字来自"尺八"。这门语言要做的事情很简单：**用函数式编程的方式，写系统级别的代码，不依赖任何现有的编译器基础设施。**

## An Apology, to Begin With

Many people have known me for a long time. After wandering through various projects over the years, I recently posted a few tweets, and quite a few old acquaintances said to me: "It's 2026—how are you still building new languages?"

I know what this looks like. There are hundreds of thousands of "awesome-lang" repos out there, most of which can't even run a Hello World properly, with READMEs longer than their compilers. Chiba looks about the same right now (though it's not open-sourced yet), but I don't care.

This past year I've been learning the Chiba(in japanese shakuhachi) — a bamboo flute from the Sui and Tang dynasties. One tube, five holes, no mechanical parts whatsoever. Want to play a semitone? Adjust your lip angle. Want vibrato? Fine-tune your airflow. Want volume? First learn how to channel all your breath into an embouchure less than two centimeters wide.

No shortcuts, no helper keys, no electronic tuner to bail you out. The distance between you and the bamboo is the distance between you and the music.

I don't want to turn this into some literary metaphor. What I mean is very concrete: **a good programming language shouldn't gain power by piling on features; it should give programmers direct, honest control over the machine through minimal primitives and their composition rules.** Five holes are enough—provided you truly understand what's happening between breath and bamboo.

Chiba is named after the (尺八, "chi-ba" in Chinese) (shakuhachi in japanese). What this language sets out to do is simple: **write systems-level code in a functional style, without depending on any existing compiler infrastructure.**

---

## 离开托管平台，函数式编程还能活吗？

先说一个不太好听的事实：今天所有主流的函数式编程语言，本质上都是寄生的。

Haskell 寄生在 LLVM 上（GHC 后端），Scala 和 Clojure 寄生在 JVM 上，Elixir 寄生在 BEAM 上，PureScript 和 Elm 寄生在浏览器的脚本引擎上。OCaml 稍微好一点，但它的后端也越来越依赖平台的二进制接口。这些语言的编译器前端做得很漂亮——类型推断、模式匹配、代数数据类型、高阶函数——但从中间表示往下，它们就把控制权交出去了。

交出去的是什么？

**二进制接口。** 你写的 Haskell 函数最终要按照 LLVM 认为正确的方式来传参、布局栈帧、安排寄存器。LLVM 不知道什么是代数数据类型，不知道什么是惰性求值节点，它只知道整数、指针和控制流图里的合并节点。你精心设计的类型信息，到了这一层就全丢了。

**栈布局。** 这是更致命的问题。限定续延需要对栈进行切割、捕获、恢复。但 LLVM 管理栈的方式对此完全无感——它假设栈是线性增长、后进先出的。你想在栈中间切一刀把上半截保存起来以后再接回去？LLVM 会告诉你：这不是我的问题。

结果就是，函数式语言要么放弃续延（大部分都放弃了），要么把续延实现成堆分配的闭包链（GHC 就是这么干的），性能代价巨大。

我想说得更直白一点：**现代的函数式语言已经从一种计算范式退化成了一种编译器前端。** 它们的语义能力完全取决于底下那个黑盒优化器愿意给多少支持。离开了 JVM 或者 LLVM，这些语言中的大多数连一次高效的函数调用都做不到。

这不是函数式编程本身的问题。这是函数式编程社区选择的实现路径的问题。

## Can FP Survive Without a Host Platform?

Let me start with an uncomfortable truth: every mainstream functional programming language today is, at its core, parasitic.

Haskell is parasitic on LLVM (via the GHC backend). Scala and Clojure are parasitic on the JVM. Elixir is parasitic on the BEAM. PureScript and Elm are parasitic on JavaScript engines. OCaml is slightly better, but its backend increasingly depends on platform ABIs. These languages all have beautiful compiler frontends—type inference, pattern matching, algebraic data types, higher-order functions—but from the IR downward, they hand over control.

What exactly do they hand over?

**The ABI.** Your Haskell function ultimately passes arguments, lays out stack frames, and allocates registers the way LLVM sees fit. LLVM has no concept of algebraic data types or thunks—it only knows i32, pointers, and phi nodes. All that carefully designed type information? Gone by the time it reaches LLVM IR.

**Stack layout.** This is the more lethal problem. Delimited continuations require slicing, capturing, and restoring the stack. But LLVM's stack management is completely oblivious to this—it assumes the stack grows linearly and pops LIFO. You want to cut the stack in the middle, save the top half, and splice it back later? LLVM says: not my problem.

The result: FP languages either give up on continuations (most do), or implement them as heap-allocated closure chains (which is what GHC does), at enormous performance cost.

Let me put it more bluntly: **modern FP languages have devolved from a computational paradigm into a compiler frontend.** Their semantic power depends entirely on how much support the black-box optimizer underneath is willing to provide. Strip away the JVM or LLVM, and most of these languages can't even make a single efficient function call.

This isn't a problem with FP itself. It's a problem with the implementation path the FP community chose.

---

## 一个令人沮丧的规律

函数式语言社区有一个我观察了很多年的规律。我不知道怎么称呼它比较礼貌，就直说了：**博士生弃坑循环。**

流程是这样的：一个博士生在读期间做了一个很有意思的类型系统扩展，或者实现了一个新的效果系统，或者搞了一种新的区域推断算法。代码写在某个实验性编译器里，论文发了，毕业了，去工业界写 Go 或者 TypeScript 去了。然后那个编译器就留在那里，说明文档最后更新时间是三年前，问题列表里全是 "这个项目还活着吗？"

我不是在嘲笑谁。学术研究当然有它的价值，我自己也读这些论文，从中受益很多。但问题在于，函数式编程社区的**工程推进力**几乎完全依赖这些短期参与者。一旦原作者离开，就没人接得住。

为什么接不住？因为这些项目从一开始就不是按照工程标准做的。代码里没有注释（"类型就是文档"），没有测试（"类型就是测试"），构建系统需要你先装好四个不同版本的 GHC 和一个特定提交的某个分叉版本。你打开构建脚本一看——上来先递归拉二十个子模块，其中三个已经找不到了。

更根本的问题在于，**学术函数式编程社区关心的东西和工程需要的东西之间有一道巨大的鸿沟。** 他们关心范畴论的完备性，关心高阶类型系统的可判定性，关心如何在论文里排出漂亮的推导规则。但他们不关心如何写一个不依赖标准C库的引导程序。不关心编译时间。不关心二进制大小。不关心一个新人打开项目后能不能在十分钟内跑起来。

这就是为什么函数式语言在工程世界里的存在感越来越弱。不是因为函数式编程的思想不好，是因为把这些思想落地的那批人，目标函数跟工程师不一样。

## A Depressing Pattern

There's a pattern in the FP language community that I've watched play out for years. I don't know what to call it politely, so I'll just say it: **the PhD-student abandonment cycle.**

It goes like this: a PhD student builds an interesting type system extension during their program, or implements a new effect system, or creates a novel region inference algorithm. The code lives in some experimental compiler. The paper gets published. They graduate. They go write Go or TypeScript in industry. And the compiler sits there, README last updated three years ago, issue tracker full of "is this project still alive?"

I'm not mocking anyone. Academic research has real value—I read these papers myself and benefit from them. But the problem is that the FP community's **engineering momentum** depends almost entirely on these short-term participants. Once the original author leaves, nobody can pick it up.

Why can't anyone pick it up? Because these projects were never built to engineering standards in the first place. No comments in the code ("types are documentation"). No tests ("types are tests"). The build system requires four different versions of GHC and a specific commit of some fork. You open the Makefile and the first thing it does is `git submodule update --recursive`, pulling twenty submodules, three of which are already 404.

The deeper issue is this: **there is an enormous gap between what the academic FP community cares about and what engineering actually needs.** They care about category-theoretic completeness, about the decidability of System F-omega, about typesetting beautiful inference rules in LaTeX. They don't care about writing a bootstrap that doesn't depend on libc. They don't care about compile times. They don't care about binary size. They don't care whether a newcomer can get the project running in ten minutes.

This is why FP languages keep fading from the engineering world. Not because the ideas are bad—but because the people landing those ideas have a different objective function than engineers do.

---

## 在 Zig、Rust 和 C 的地盘上，函数式编程为什么消失了？

系统编程有一个核心原则：**你写的代码要对应机器上实际发生的事情。**

你写 `int x = 5`，你知道栈上分配了四个字节，里面放的是 `0x00000005`。你写一个包含两个整数字段的结构体，你知道这是连续八个字节。你调一次内存分配，你知道堆上找了一块区域返回了它的地址。每一步都是透明的。

Zig 把这件事做到了极致——它甚至让你在编译期就能看到每个类型的内存布局。它的作者反复强调的一句话是："没有隐藏的控制流，没有隐藏的内存分配。" 这不是什么高深的设计哲学，这就是系统程序员每天需要的东西。

函数式语言在这个维度上天然弱势。你写一个列表——这个列表在哪？栈上？堆上？是连续数组还是链表？谁来释放它？什么时候释放？大部分函数式语言的答案是："你不用管，垃圾回收器会处理的。"

"你不用管"这四个字，在应用层是一种解放，在系统层是一种背叛。

写内核的时候，你必须管。写驱动的时候，你必须管。写嵌入式的时候，你连一次动态内存分配都做不了，因为你的目标平台可能根本没有堆。在这些场景下，"内存透明"不是一个优点，它是一个根本性的缺陷。

但与此同时，函数式编程确实提供了一些真正强大的工具。代数数据类型让你精确建模状态空间。模式匹配让你不会漏掉任何分支。高阶函数让你把通用逻辑和具体逻辑分开。这些东西对系统编程**同样有价值**——甚至比对应用编程更有价值，因为系统代码出错的代价更高。

问题不在于函数式编程的抽象能力没用，而在于现有的实现把这些抽象能力锁死在一个厚重的运行时里了。想用代数数据类型？先来一个一百多兆的 GHC 运行时。想用续延？先来一个复杂到没人说得清楚的惰性求值机器。

Chiba 想做的事，就是把这些好东西从运行时的牢笼里解放出来。

**证明函数式语言可以像 C 一样紧凑、透明，同时保留代数数据类型、模式匹配、续延等核心能力，并且运行时开销可以做到接近零。**

## Why FP Disappeared from Zig, Rust, and C Territory

Systems programming has a core principle: **the code you write should correspond to what actually happens on the machine.**

You write `int x = 5`, and you know four bytes were allocated on the stack containing `0x00000005`. You write a struct with two integer fields, and you know it's eight contiguous bytes. You call malloc, and you know the heap found a region and returned its address. Every step is transparent.

Zig takes this to the extreme—it even lets you inspect every type's memory layout at compile time. Andrew Kelley's repeated mantra is: "No hidden control flow, no hidden allocations." This isn't some profound design philosophy. It's just what systems programmers need every day.

FP languages are inherently weak on this axis. You write a list literal—where does it live? Stack? Heap? Contiguous array or linked list? Who frees it? When? Most FP languages answer: "Don't worry about it, the GC will handle it."

"Don't worry about it"—in application land, that's liberation. In systems land, it's betrayal.

When you're writing a kernel, you have to worry. When you're writing a driver, you have to worry. When you're writing for embedded, you can't even call malloc because your target platform might not have a heap. In these scenarios, "memory transparency" isn't a virtue—it's a fundamental deficiency.

And yet, FP genuinely provides some powerful tools. Algebraic data types let you precisely model state spaces. Pattern matching ensures you never miss a branch. Higher-order functions let you separate general logic from specific logic. These things are **just as valuable** for systems programming—arguably more so, because the cost of bugs in systems code is higher.

The problem isn't that FP's abstractions are useless. The problem is that existing FP implementations lock those abstractions behind bloated runtimes. Want algebraic data types? First, take a 128 MB GHC runtime. Want continuations? First, swallow a STG Machine so complex nobody can fully explain it.

What Chiba wants to do is liberate these good things from the prison of the runtime.

**Prove that a functional language can be as compact and transparent as C, while retaining algebraic data types, pattern matching, continuations, and other core capabilities—with near-zero runtime overhead.**

---

## Chiba 的路径

前面说了一大堆问题，该说说 Chiba 打算怎么干了。

核心思路三句话就能说清楚：

**第一，不用 LLVM。** 限定续延需要切栈、捕获帧、恢复帧，行多态需要自己决定每个字段的内存偏移——这两件事 LLVM 都管不了，也不想管。所以后端是手写的，直接生成 x86-64 汇编，从我自己的中间表示直接翻译，用汇编器汇编成目标文件，然后用链接器链接。整条链路上没有 LLVM，没有标准C库，纯 Linux 系统调用。跑出来的二进制是真正的静态链接。

**第二，工程化学术概念。** 行多态在论文里是类型理论的玩具，在 Chiba 里它决定内存布局——字段偏移作为类型参数传递，一份代码服务所有兼容的结构体，不需要单态化，不需要虚表。限定续延在论文里是优雅的控制流算子，在 Chiba 里它就是几次内存拷贝和一次跳转——推一个标记，切一刀保存帧序列，恢复时写回去。没有调度器，没有用户态线程。

**第三，让函数式代码和汇编共存。** 你可以在函数式代码中间直接写内联汇编。编译器知道约束，知道哪些寄存器会被碰，前后的分配它来处理。不是妥协，是该在什么层面用什么工具。写得出来的代码长这样：

```
def write_stdout(msg: ptr, len: i64): i64 =
  asm(rax = 1, rdi = 1, rsi = msg, rdx = len) -> rax {
    syscall
  }
```

编译出来就是一条系统调用指令，前后的寄存器搬运编译器自动生成。

**第四，先跑起来再说。** 我要写的是能运行的代码，不是定理证明器。健全性很重要，但如果一门语言连最基本的程序都编译不出来，讨论健全性就是空谈。先让它跑起来，再让它跑得对，最后让它跑得快。

具体的实现细节——中间表示长什么样、代码生成怎么走、栈帧怎么布局——之后的文章再展开。这篇只说方向。

## Chiba's Path

Enough about problems. Let's talk about what Chiba actually plans to do.

The core approach fits in three sentences:

**First, no LLVM.** Delimited continuations require slicing, capturing, and restoring stack frames. Row polymorphism requires controlling each field's memory offset. LLVM can't handle either, and doesn't want to. So the backend is hand-written—direct translation from my own IR to x86-64 assembly, assembled with `as`, linked with `ld`. No LLVM in the pipeline, no libc—pure Linux syscalls. The resulting binary is truly statically linked.

**Second, engineering-ify academic concepts.** Row polymorphism is a type-theory toy in papers; in Chiba, it determines memory layout—field offsets are passed as type parameters, one code body serves all compatible structs, no monomorphization, no vtables. Delimited continuations are elegant control-flow operators in papers; in Chiba, they're a few memcpys and a jump—push a prompt marker, slice and save the frame sequence, write it back on restore. No scheduler, no userspace threads.

**Third, let functional code and assembly coexist.** You can write inline assembly right in the middle of functional code. The compiler knows the constraints, knows which registers get clobbered, and handles allocation around the block. It's not a compromise—it's using the right tool at the right level. Code looks like this:

```
def write_stdout(msg: ptr, len: i64): i64 =
  asm(rax = 1, rdi = 1, rsi = msg, rdx = len) -> rax {
    syscall
  }
```

That compiles to a single `syscall` instruction, with register shuffling auto-generated by the compiler.

**Fourth, run first, prove later.** I'm writing code that runs, not a theorem prover. Soundness matters, but if a language can't compile even basic programs, discussing soundness is idle talk. Make it run, then make it correct, then make it fast.

Implementation details—what the IR looks like, how codegen works, how stack frames are laid out—will come in future posts. This one is just about direction.

---

## 接下来要做的事

Chiba 现在还在第零层阶段。第零层是用 Rust 写的引导编译器，能把 Chiba 的一个子集（算术、函数、模式匹配、元组、限定续延、内联汇编）编译成独立运行的 x86-64 Linux 二进制文件。

路线图：

1. **自举。** 用第零层编译第一层。第一层用 Chiba 自己写。这一步完成，Rust 就可以扔了。
2. **区域内存管理。** 把续延的界定符同时作为区域边界。分配跟着 `reset` 走，释放跟着 `reset` 返回走。不需要垃圾回收，不需要引用计数。
3. **追踪式即时编译。** 应用层不走提前编译，走解释加追踪。CPS 中间表示天然就是续延调用链，追踪记录就是这条链上的热路径，不需要额外的追踪表示。

## What's Next

Chiba is currently at Level 0. Level 0 is a bootstrap compiler written in Rust that can compile a Chiba subset—arithmetic, functions, pattern matching, tuples, delimited continuations, inline assembly—into standalone x86-64 Linux binaries.

Roadmap:

1. **Self-hosting.** Use Level 0 to compile Level 1. Level 1 is written in Chiba itself. Once this step is done, Rust can be discarded.
2. **Region memory management.** Use the continuation delimiter as a region boundary. Allocation follows `reset`; deallocation follows `reset`'s return. No GC, no reference counting.
3. **Tracing JIT.** The application layer won't use AOT compilation—it'll use interpretation plus tracing. The CPS IR is naturally a continuation call chain; a trace is just the hot path along that chain, requiring no separate trace representation.

---

## 为什么还要做这件事

我见过太多好想法死在实现路径上了。不是想法不行，是做的人选了一条最省事的路——找一个现成的后端，糊一层前端上去，发一篇论文，然后走了。留下的东西，不是一门语言，是一个证明"这个想法在理论上可行"的遗迹。

我不想证明什么在理论上可行。我想写一个东西，它能从源代码一路走到系统调用，中间没有任何一层是我说不清楚的。

这听起来很蠢。2026 年了，为什么不用现成的基础设施？为什么要从汇编开始写？为什么要自己管栈？答案是：**因为只有这样，我才知道我在做什么。**

函数式编程这些年在工程界越来越边缘化，不是因为λ演算有什么问题，是因为做函数式编程的人越来越不愿意碰脏活了。类型系统做得越来越华丽，运行时越来越臃肿，离硬件越来越远。到最后，函数式编程变成了一种审美，一种圈子里的暗号，一种"你看我的类型签名多漂亮"的自我满足。

我觉得这条路走偏了。

代数数据类型、模式匹配、续延——这些东西本来就不是拿来写论文的。它们是控制复杂度的工具，是精确描述计算过程的语言，是应该比万能指针和分支跳转表更适合写系统代码的东西。只不过从来没有人认真地把它们放到离金属最近的地方去试一试。

Chiba 就是这个试一试。

它大概率会失败。一个人写的编译器，没有资金，没有团队，没有论文发表的压力也没有论文发表的动力。代码仓库的收藏数可能永远是个位数。

但我已经过了在乎这些的年纪了。

我只想知道一件事：**如果把函数式编程从那些层层叠叠的抽象里剥出来，让它赤脚站在硅片上，它还能不能走路。**

如果能，那就继续走。如果不能，至少我亲眼看过了。

## Why Bother

I've seen too many good ideas die because of the implementation path. Not because the ideas were bad, but because the people behind them took the path of least resistance—grab an existing backend, slap a frontend on top, publish a paper, and leave. What's left behind isn't a language. It's a monument proving "this idea is theoretically feasible."

I don't want to prove something is theoretically feasible. I want to build something that goes all the way from source code to syscall, where there isn't a single layer I can't explain.

This sounds stupid. It's 2026—why not use existing infrastructure? Why start from assembly? Why manage the stack yourself? The answer is: **because that's the only way I know what I'm doing.**

Functional programming has been increasingly marginalized in the engineering world, not because there's anything wrong with lambda calculus, but because the people doing FP have become less and less willing to get their hands dirty. Type systems grow ever more ornate, runtimes ever more bloated, the distance from hardware ever greater. Eventually, FP becomes an aesthetic, a shibboleth within a circle, a self-congratulatory "look how pretty my type signature is."

I think this path has gone astray.

Algebraic data types, pattern matching, continuations—these things were never meant for writing papers. They're tools for controlling complexity, languages for precisely describing computation, things that should be better suited to systems code than `void*` and `switch-case`. It's just that nobody has ever seriously tried placing them as close to the metal as possible.

Chiba is that attempt.

It will most likely fail. A compiler written by one person, with no funding, no team, no pressure to publish and no motivation to publish either. The repo's star count will probably stay in single digits forever.

But I'm past the age of caring about that.

I just want to know one thing: **if you strip functional programming out of all those layers upon layers of abstraction and make it stand barefoot on silicon, can it still walk?**

If it can, then keep walking. If it can't, at least I'll have seen it with my own eyes.

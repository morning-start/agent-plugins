---
name: moonbit-repo-analysis
description: |
  MoonBit 仓库深度分析 — 架构理解、分层设计、模块依赖、设计模式提取与参考文档生成。
  Use this skill when the user wants to understand a MoonBit project's architecture —
  analyze its layer design, module organization, dependency structure, error handling
  strategy, and cross-module patterns. Produces structured reference documents with
  Mermaid diagrams, decision matrices, Why-analysis, and ecosystem comparisons
  (Go/Rust/Python). Triggers on Chinese/English phrases: "分析 MoonBit",
  "月兔 架构/分层/模块/依赖/设计", "看看这个库怎么设计的", "提取设计模式",
  "做个分析报告", "how is this MoonBit lib structured", "analyze this repo",
  "how is this designed", "design patterns", "architecture of this MoonBit project".
  Also triggers in a MoonBit workspace for generic "分析一下这个项目".
  Do NOT trigger for: non-MoonBit repos (use repo-analyzer), simple code review
  (use systematic-debugging), debugging, refactoring, or project comparison.
---

# MoonBit 仓库深度分析

## Iron Law

```
NO REPORT WITHOUT CODE EVIDENCE — every claim must have a file:line reference.
```

## 概述

这个 skill 将你之前在 miniio 分析中执行的端到端工作流形式化为可重复的多阶段流程。目标是**从 MoonBit 仓库中提取工程模式，生成供编排设计使用的参考文档**。

## 核心原则（吸收自 repo-analyzer）

### 1. 业务视角优先
从"这个项目解决什么问题"出发，不是"这个文件里有什么函数"。每个模块先说明它在系统整体中的角色，再深入技术细节。

### 2. 抽象层次把控
默认在设计模式和架构层面描述，**非必要不贴原始代码**。优先用 Mermaid 图、流程图、对比表格表达设计思想。只有当实现特别精妙或是核心卖点时，才展示代码片段（且需先用自然语言解释）。

### 3. 全局关联
每个局部分析都必须连接到项目整体设计哲学。这是区分"代码说明书"和"架构分析"的关键：
- 解释设计决策时，说明它如何服务于项目的整体设计哲学
- 描述模块间协作时，说明这种协作模式是否与项目其他部分一致

### 4. 启发性写作
目标是让读者**学到东西、产生思考**，而不是获得一份代码说明书。像资深工程师在白板前讲解——有观点、有推理、有对比。每个设计决策回答：为什么不选更常见的方案？这个设计在什么约束下成立？

### 5. Why > What（强制）
每个设计决策必须解释动机、权衡、替代方案代价。描述"是什么"只是起点，解释"为什么"才是分析的价值所在。

详情参考 `references/analysis-guide.md`（吸收自 repo-analyzer）。

---

## 阶段产出映射（Iron Law）

每个阶段必须有**具体的文件输出**。口头分析不视为有效输出。

| 阶段 | 输出文件 | 内容 | 验收标准 |
|------|---------|------|---------|
| P1 初始化 | `drafts/01-plan.md` | 项目路径、元数据、分析模式 | 路径合法、分析模式已确认 |
| P2 规模评估 | 合并入 `drafts/01-plan.md` | 代码规模、模块分类 | 扫描全部 `.mbt` 文件 |
| P3 外部调研 | `drafts/02-research.md` | 生态定位、竞品差异、用户问答 | 核心问题有答案（可跳过） |
| P4 叙事设计 | `drafts/03-narrative.md` | 叙事线、模块顺序、过渡逻辑 | 每个模块有过渡句 |
| P5 深度分析 | `drafts/04-module-{name}.md` | 模块角色、关键类型、设计决策 Why | 核心模块覆盖率 ≥60% |
| P6 交叉验证 | `drafts/05-cross-validation.md` | 模式提炼、决策矩阵、生态对比 | 每个核心结论有 2-3 个证据源 |
| P7 融合报告 | `<target-path>.md` | 按 report-structure.md 模板组织 | 通过验证管道 |

---

## 7 阶段流程

### 阶段 1：项目获取与初始化

**输入支持**：
- 本地路径（`E:/projects/my-moonbit-lib`）
- GitHub URL（`https://github.com/user/repo`）或 `owner/repo`
- 仅项目名（在工作区中按名称搜索）

**步骤**：
1. **解析输入** — 判断是否为本地路径、远程 URL、或项目名
2. **获取项目** — 远程仓库用 `git clone --depth=1` 克隆到临时目录；本地路径直接用
3. **创建输出目录** — 在报告输出路径下创建 `drafts/` 目录用于存放中间产物
4. **获取元数据**（远程仓库）：Stars、Fork、贡献者、最近提交
5. **扫描结构** — 读取目录树，统计 `.mbt` 文件数和总行数
6. **识别模块** — 按 `moon.pkg` 分组识别逻辑模块，分类为核心/次要
7. **汇报规模** — 向用户报告代码规模，让用户选择分析深度

`# If fails:` 路径不存在 → 提示用户确认路径；克隆失败 → 检查网络或改用本地路径

### 阶段 2：规模评估与分析模式选择

1. 统计有效代码行数（排除测试、构建配置、自动生成代码），按模块列出分布
2. 向用户推荐分析模式：

| 模式 | 核心模块覆盖率 | 次要模块覆盖率 | 适用场景 |
|------|-------------|-------------|---------|
| 快速分析 | ≥30% | ≥10% | 快速了解项目全貌 |
| 标准分析（推荐） | ≥60% | ≥30% | 常规架构分析 |
| 深度分析 | ≥90% | ≥60% | 深入研究每个设计决策 |

3. **覆盖率计算规则**：
   - 覆盖率 = 实际读取的行范围之并集 / 文件总行数
   - 大文件（>500 行）必须分段读取：头部类型定义（前100行）→ 核心函数（grep定位）→ 尾部测试
   - 只读了一小部分（<30%）不计入覆盖率，视为"未读"
   - 自动生成代码（mooncakes 锁文件等）可降低覆盖率要求
4. 将分析模式写入 `drafts/01-plan.md`

### 阶段 3：外部调研 + 自适应提问（新增，吸收自 repo-analyzer）

对于 GitHub 上的 MoonBit 项目，先做外部调研：

1. **搜索项目评价** — WebSearch 搜索 "project_name MoonBit review"、"project_name architecture" 等
2. **阅读项目文档** — README、CONTRIBUTING、ADR、AGENTS.md（如有）
3. **了解生态定位** — 同类 MoonBit 库有哪些？这个库的独特价值是什么？
4. **整理调研笔记** — 写入 `drafts/02-research.md`，包含：
   - 项目解决的核心问题（用 1-3 个具体场景描述）
   - 与同类 MoonBit 库的定位差异
   - 项目文档中的关键设计决策摘录

对于本地项目或简单库，可跳过此阶段。

**自适应提问**：基于项目特征向用户提问（每次不超过 3 个）：
- 观察到不常见的技术选择 → 问动机
- 观察到设计张力 → 问取舍优先级
- 确认报告详略程度（是否需要场景化引入？还是直接进入架构分析？）

将用户回答记入 `drafts/02-research.md`。

### 阶段 4：叙事设计与模块识别（原阶段 2，增强）

先通读关键入口文件建立全局图景：

```bash
# 找到所有 moon.mod.json 和 moon.pkg.json
Get-ChildItem -Recurse -Filter "moon.mod.json" -Name
Get-ChildItem -Recurse -Filter "moon.pkg.json" -Name
```

然后读取：
1. `moon.mod.json` — 包名、依赖、版本
2. 顶层 `*.mbt` 文件 — 入口模块、类型定义
3. `README.md`（如有） — 项目定位

**输出叙事线**：设计模块在报告中的呈现顺序和过渡逻辑。

推荐叙事模式：**自底向上分层**（底层 FFI → 中间封装 → 公共 API → 上层 Traits），或**数据流驱动**（数据从入口到输出的路径）。

将叙事线写入 `drafts/03-narrative.md`。

### 阶段 5：并行模块深度分析（原阶段 3，增强 subagent 并行模式）

对于较大项目（≥10 个核心 `.mbt` 文件），使用 subagent 并行分析各模块：

**调度策略**：
- 每个核心模块 → 一个独立 subagent（`subagent_type: "general"`）
- 所有次要模块 → 合并到一个 subagent 批量处理
- 所有 subagent 在同一消息中并行启动

**Subagent Prompt 模板**（见 `references/subagent-prompt.md`）包含：
- 模块在项目中的角色和叙事上下文
- 需要分析的文件列表
- 覆盖率要求
- 全局视角要求（每个结论连接整体设计哲学）
- 跨模块推断用 `【待主 agent 验证】` 标注

**主 agent 等待纪律**：
- subagent 启动后，主 agent 不得阅读 subagent 负责的源码
- 判断卡住标准：output 文件超过 5 分钟无新增行
- **严禁提前合并**：必须等所有 subagent 全部完成后，再进入阶段 6-7

**小项目替代**：对于小型 MoonBit 库（<5 个核心文件），直接逐文件深入分析即可，无需启动 subagent。

每个核心模块分析（覆盖率 ≥60%）提取：
- **模块角色** — 该层在整个架构中做什么
- **关键类型与函数签名** — 核心抽象
- **设计决策 Why** — 为什么这样设计（vs 替代方案）
- **代码质量信号** — 泛型使用、错误处理、资源管理、测试策略

每个次要模块（覆盖率 ≥30%）选择性快读，只提取设计点和依赖关系。

**Why 分析框架**：每个设计决策回答以下问题：
```
- 为什么这样设计？（不只是"用了什么模式"，而是"为什么适合这个场景"）
- 如果不这样会怎样？（替代方案的代价是什么）
- 同类库（Go/Rust/Python）在这个场景怎么做的？MoonBit 的选择有何不同？
- 如果让你重新设计，会改变什么？
```

使用 `headroom` 工具压缩已读的原始文件内容，节省上下文窗口：

```markdown
## Context Compression Guide

Use headroom_compress in these situations:
- After reading a file >200 lines → compress it before switching to another file
- After a subagent returns its analysis → compress the output before fusion
- Before writing the final report → compress all intermediate drafts
- When switching between phases → compress the previous phase's notes

Use headroom_retrieve when:
- Writing a specific claim that needs exact evidence
- Cross-validating a file:line reference
- A user asks a follow-up about a specific design detail
```

每个模块分析写入 `drafts/04-module-{name}.md`。

### 阶段 6：交叉验证与模式提炼

1. **覆盖率门控** — 检查每个模块草稿末尾是否有覆盖率明细，未达标模块补充阅读
2. **证据验证** — 从每个模块选取 2-3 个关键结论，回到源码逐行验证
3. **模式提炼** — 识别跨模块的设计模式（错误处理、资源管理、类型策略、测试策略）
4. **决策矩阵** — 整理关键技术决策的对比表（选了 A 放弃 B 的理由）
5. **生态对比**（可选）— 如果该库有其他语言（Go/Rust/Python）的同类项目，比较设计哲学差异

写入 `drafts/05-cross-validation.md`。

### 阶段 7：多源融合与报告输出

1. 询问用户输出路径（如果之前未指定）
2. 以阶段 4 的叙事线为骨架，从各草稿中融合内容
3. 按 `references/report-structure.md` 模板组织章节
4. 每章开头用 1-2 句过渡连接上一章
5. 大量使用 Mermaid 图表和对比表格
6. 写入目标路径

**分段写入策略**：报告如果超过 300 行，先 Write 前几个章节，后续用 Edit 追加。

---

## 输出模板

参考 `references/report-structure.md` 获取完整的报告结构模板。核心章节必须包含：

```
1. 项目全景（规模、目录、层数）
2. 模块分层架构（按叙事线，每层 WHY > WHAT）
3. 关键模式提炼（跨模块）
4. Skill & 编排分析（如果项目含 SKILL.md）
5. 决策矩阵 + 生态对比（与 Go/Rust/Python 同类库的设计哲学差异）
6. 评价与启示
```

---

## Context Compression Guide

| 时机 | 操作 | 原因 |
|------|------|------|
| 读完 >200 行文件后 | `headroom_compress` 再切文件 | 保留证据但不占上下文 |
| subagent 返回分析后 | `headroom_compress` 输出 | 节省等 subagent 期间的上下文 |
| 融合前 | 压缩所有中间草稿 | 给最终报告腾空间 |
| 阶段切换时 | 压缩上一阶段产出 | 上下文窗口管理 |
| 写报告需证据时 | `headroom_retrieve` | 恢复压缩的原始内容 |

---

## Red Flags（思维陷阱）

分析过程会遇到各种自我否定的借口。遇到时对照下表纠正：

| Thought (借口) | Reality (现实) |
|----------------|---------------|
| "项目很小，直接看代码就行" | 小项目更需要结构化分析来发现模式。照常走流程。|
| "这个模块太复杂了，写不清楚" | 复杂度更需要结构化表达。用 Mermaid 图分解。|
| "这个设计没什么特别的" | 每个设计选择都有隐含的权衡。找出为什么选了 A 而不是 B。|
| "不需要压缩上下文，我还够用" | 等发现不够时已经晚了。在阶段切换时主动压缩。|
| "用户没要分析报告，我就回答一下" | 口头回答不留记录。写 report 文件才是可复用的输出。|
| "evaluation 打分而已，写个大概就行" | 分析的价值在于精确性。每个 claim 必须有 file:line 证据。|

Red Flags 必须写入报告的章节 6（评价与启示）作为自省部分。

---

## 错误恢复

| 失败点 | 恢复步骤 |
|--------|---------|
| 仓库路径不存在 | 提示用户确认路径，提供当前目录的 ls 结果作为参考 |
| Subagent 超时 | 等待 5 分钟无新行 → 直接内联分析该模块 |
| 模块文件 >1000 行难以全部读入 | 分段读取：头部类型（前100行）→ 核心函数（grep 定位）→ 尾部测试 |
| 覆盖率不达标但文件已全部尝试 | 在报告中标注"部分覆盖"，说明原因 |
| 用户取消分析 | 保留 `drafts/` 目录中的中间产物，下次可续 |

---

## 验证管道

```bash
# 最终检查清单（必须全部通过）
- [ ] 每个结论都有 file:line 的证据引用
- [ ] 报告格式符合 references/report-structure.md
- [ ] 至少一个 Mermaid 架构图（MUST: 无图视为不合格报告）
- [ ] 每个设计决策有 Why 分析（不仅仅是 What，使用框架中的问题模板）
- [ ] 覆盖率明细表在 drafts/ 中
- [ ] 中间草稿已通过 headroom 压缩（如有使用）
- [ ] 报告已保存到用户指定的输出路径
```
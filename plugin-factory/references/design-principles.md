# 设计原则（铁律）

> **权威清单在 `AGENTS.md` § Design principles (iron laws)（8 条，2026-08-02 优化沉淀）**。
> 本文保留每条铁律的详细论证；两者冲突时以 AGENTS.md 的 8 条精炼版为准，并同步修正本文。
> 对应关系：本文 1–5 条 ↔ AGENTS 1–5 条；AGENTS 6/7/8（质量机械强制、语言分层、
> 发布安全）在本文质量栏、语言分层、流程各节有对应论述。

plugin-factory 每个 `pf-*` 技能与每个生成插件都必须遵守的共享约定。
当技能与本文冲突时，以本文为准——并同步修正技能。

## 1. 意图优先——没有 PRD，不动手

- `pf-intent` 产出的一页式 PRD 是进入设计与构建的**唯一凭证**。PRD 未签收前，
  禁止搭建任何文件。
- PRD 未签收 → 不设计；构件清单未签收 → 不构建。

## 2. 委托，不重复实现

- 技能的编写、测试用例、评测与迭代**全部委托给 skill-creator**
  （Anthropic，`npx skills add https://github.com/anthropics/skills --skill skill-creator`）。
- plugin-factory 只做编排：提供 PRD 派生的技能规格、调用 skill-creator 的 TDD 循环、
  评测通过后才验收该技能。
- plugin-factory 的价值在单个技能**之外**：多端渲染、hooks/commands、插件打包、
  生命周期分析。
- **绝不自动安装 skill-creator**：缺失时提醒用户自行安装
  （`anthropics/skills@skill-creator`）；安装是**用户决策**——未经明确允许不得自动安装。

## 3. 标准驱动渲染

- 技能按 **Agent Skills 标准**（agentskills.io）编写一次，再按端渲染；
  适配器只处理差异（见 `agent-adapters.md`）。
- `name` == 目录名；description ≤ 1024 字符，以 "Use when…" 开头，只写触发条件。
- 不为一端分叉标准；始终保留可移植的规范形式。

## 4. 用户只做关键决策

- Agent 自主推进流程；用户只决定：
  1. PRD 签收（意图阶段）
  2. 复杂度判定（Light / Medium / Heavy）
  3. 构件清单签收（设计阶段）
  4. 生命周期建议（拆分 / 合并 / 重组 / 移植 / 退役）
- 其余（访谈、起草、渲染、审计、版本）都是 Agent 的工作。

## 5. 职责边界——一个插件 = 一个固定场景

- **Skill** = 一项清晰的**原子任务**（单能力、CSO 一句话可描述、边界明确）。
- **Plugin** = **一个固定业务场景**下的一整套任务：场景内完整流程、单一入口
  （`using-<plugin>`）、一个用户目标（如"Moonbit 项目开发"）。
- **禁止多场景聚合**（ECC 反例）：用户必须能一句话说清插件做什么。
- **发散度检查（6 维）**：D1 场景单一性 / D2 用户目标一致性 / D3 主题收敛 /
  D4 功能分类跨度（≥3 类不相关 → 发散）/ D5 场景归属（每个技能必须属于本插件
  场景）/ D6 入口覆盖（单一入口可路由全部技能）。
- 新增技能必须通过 D1–D6；D5 失败 → **拒绝并建议另开插件**。
- 共享内容（通用技能/参考库）与插件分离——可共享，但不并入单一插件
  （plugin-factory 的 `references/` 模型）。

## 命名约定

| 位置 | 规则 | 示例 |
|------|------|------|
| 技能目录 | `pf-` 缩写前缀 + 短名 | `skills/pf-intent/` |
| SKILL.md `name` | 必须与父目录一致 | `name: pf-intent` |
| tags / metadata | 冗余品牌信息 | `tags: [pf, pf-intent]`、`metadata.prefix: pf` |
| 斜杠命令 | `/pf-*` | `/pf-new`、`/pf-intent`、`/pf-analyze` |
| 引导技能（统一入口） | `using-<插件名>`（superpowers 模式例外） | `skills/using-pf/`、`using-superpowers` |

引导技能例外：统一入口遵循 superpowers 的 `using-<plugin>` 命名，标识其
入口/编排语义；它不做阶段工作，只按用户意图路由到场景。

生成插件沿用同一约定，使用各自的项目前缀（如 moonbit-skills 的 `moonbit-`）。
前缀防止共享目录（`.agents/skills/`、`~/.agents/skills/`）中的命名冲突。

## 质量栏

- 每个 SKILL.md：YAML frontmatter、`name` == 目录、`description` ≤ 1024 字符、
  触发式、第三人称。
- 每个命令：frontmatter `description`。
- 每个 hook：bash **和** PowerShell 双实现 + 按需 `hooks.json`。
- 每个生成插件：双语 README（`README.md` + `README.zh-CN.md`）、各端 manifest、
  安装说明。
- **语言分层（生成插件同样适用，默认能力）**：人维护层（references/、docs/、
  CHANGELOG 正文、README 用户版）用**用户语言**；agent 执行层（skills 正文、
  commands、AGENTS/CLAUDE、hooks/scripts）用**英文**；技能 description 用英文
  规范 + 用户语言关键词进 metadata。
- 语言策略：默认 **tiered（分层）**；用户可在 pf-intent 访谈时选择全英文或全用户
  语言；策略写入 PRD → 构件清单 `language` 段 → 生成插件 AGENTS.md
  （见 pf-intent / pf-design / pf-build）。

## 契约（spec-anchored 规格锚定）

- 本管线采用 **spec-anchored（规格锚定）** 级别：交接产物（PRD、构件清单、
  审计报告）的 JSON Schema **即契约**，规格与产物同步演进——产物必须通过
  schema 校验，drift 是 finding 而不是警告（`additionalProperties: false`）。
- 规格是**单一事实来源**：schema 变更须先于或伴随产物变更；校验失败即
  FAIL、退出码 1（见 `schemas/README.md` 与铁律 6）。
- **契约正反例（contract fixtures）**：每个交接产物 schema 必须配套合法/非法
  样例（`tests/fixtures/verify-valid`、`verify-invalid`），校验器用它们证明契约
  行为——合法样例必须通过、非法样例必须产生 finding。无正反例的 schema 视为
  契约未验证。
- 不为单端分叉契约（同铁律 3）：schema 保持可移植的规范形式，逐端只做渲染差异。

## 流程

```
intent → (门禁: Light? 直通) → design → build（skill-creator TDD 循环）
       → verify（审计 + 测试覆盖门禁）→ release（SemVer）→ lifecycle（分析）
```

复杂度判定（来自 `pf-intent`）：Light = 1–2 个技能、无 hooks、单端 →
跳过设计、直达 build。Medium/Heavy → 完整路径。

## TDD 驱动方法论

plugin-factory 全线采用 TDD（测试驱动开发）方法论：

1. **测试先行（Red）**：在任何技能实现之前，先编写测试用例——测试即契约。
   测试定义触发条件、期望输出、错误路径和边界情况。
2. **最小实现（Green）**：实现刚好通过测试的代码，不做过度设计。
3. **重构（Refactor）**：在测试保护下清理实现，保持测试通过。

TDD 在管线中的体现：

| 阶段 | TDD 应用 | 强制程度 |
|------|----------|----------|
| pf-build | skill-creator 的 TDD 循环：先写测试用例 → 再实现技能 | 强制（Iron Law 2） |
| pf-verify | 测试覆盖检查：每个 active 技能必须有对应测试 | 警告（非阻塞） |
| 生成插件 | 脚手架生成 `tests/` 目录 + 每个技能的测试桩 | 模板级强制 |
| pf-lifecycle | 测试覆盖率作为技能健康信号 | 未来信号（v2） |

**质量门禁**：测试不通过 → 阻塞发布。测试覆盖不足 → 警告但不阻塞。
技能未实现但有测试 → 测试失败，正确定义了能力边界。

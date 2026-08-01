# 设计原则（铁律）

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

## 流程

```
intent → (门禁: Light? 直通) → design → build（skill-creator 循环）
       → verify（审计）→ release（SemVer）→ lifecycle（分析）
```

复杂度判定（来自 `pf-intent`）：Light = 1–2 个技能、无 hooks、单端 →
跳过设计、直达 build。Medium/Heavy → 完整路径。

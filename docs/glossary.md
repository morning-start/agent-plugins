# Glossary（术语表）

| 术语 | 含义 |
|------|------|
| **Plugin（插件）** | 向 agent 端扩展技能/hooks/commands/rules/agents 的可安装包。 |
| **Harness（端/宿主）** | 消费插件/技能的 agent 运行时（Claude Code、pi、opencode、oh-my-pi）。 |
| **Adapter（适配器）** | 规范插件模型到某一端具体位置/格式的映射（见 `references/agent-adapters.md`）。 |
| **Skill（技能）** | 能力包：一个含 `SKILL.md`（Agent Skills 标准）+ 可选附属文件的目录。 |
| **SKILL.md** | 技能清单：YAML frontmatter（`name`、`description`、…）+ 指令正文。 |
| **Agent Skills standard** | agentskills.io 的跨端规范，plugin-factory 视其为规范形式。 |
| **CSO description** | 只写**触发条件/症状/场景**（"Use when…"）、绝不写工作流的描述。 |
| **PRD** | `pf-intent` 产出的一页式产品需求文档；进入设计/构建的唯一凭证。 |
| **Complexity gate（复杂度判定）** | `pf-intent` 的 Light/Medium/Heavy 判定，决定直通或完整流程路径。 |
| **Component manifest（构件清单）** | `pf-design` 产出的、经签收的技能/hooks/commands/rules 清单 + 逐端规格（含 orchestration 段）。 |
| **skill-creator** | Anthropic 官方的技能创建/评测技能（创建 → 测试用例 → A/B 评测 → 迭代）。plugin-factory 委托给它；**缺失时只提醒用户自装**。 |
| **Multi-shell（多 shell）** | 每个 hook/脚本须同时提供 bash 与 PowerShell 实现。 |
| **Orchestration（编排）** | 一组技能的协作设计：入口点、触发链、交接产物、冲突避免（见 `references/orchestration-patterns.md`）。 |
| **Lifecycle actions（生命周期动作）** | 拆分 / 合并 / 重组 / 移植 / 退役 / 演进——`pf-lifecycle` 的建议（v1 纯结构）。 |
| **Dogfood** | 用 plugin-factory 自己生成一个示例插件（M4）。 |

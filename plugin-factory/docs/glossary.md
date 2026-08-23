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
| **Dogfood** | 用 plugin-factory 自己生成一个示例插件（T5 `npm run smoke`：`git-release` 从干净临时目标生成→校验→引导→审计）。 |
| **Verifier（验证器）** | `scripts/verify.mjs`：跨平台结构/harness/生命周期审计引擎；Bash 与 PowerShell 仅转发参数。`npm run validate` / `validate:ps` 调用同一引擎。 |
| **Finding schema（findings 形状）** | 验证器产出的稳定结构 `{ signal, file, severity: FAIL|WARN|INFO, action, impact }`；FAIL 使退出码为 1。 |
| **Lifecycle probe（生命周期探针）** | `verify.mjs lifecycle` 实现的纯结构信号（`skill-too-large`、`trigger-overlap`、`broken-handoff`、`orphan-skill`、`missing-entry-skill` 等 11 个）。 |
| **Bootstrap marker** | `PLUGIN_FACTORY_BOOTSTRAP:<plugin>`：引导注入的唯一标记，每个生命周期阶段至多出现一次（T3）。 |
| **Release-check（发布门禁）** | `scripts/release-check.mjs`：发布准备检查（版本同步、审计、验证器、CHANGELOG 证据、harness 产物、干净工作树）；从不隐式打标签或推送。 |
| **SemVer（语义化版本）** | `scripts/version.mjs` 严格解析 `X.Y.Z[-prerelease]`；声明文件经 `.version-bump.json` 同步。 |
| **ADR（架构决策记录）** | 一页纸的决策记录；状态机 `Proposed → Accepted → Superseded → Deprecated`，**不可变**——改决策即写新 ADR 并标记 Superseded（见 `skills/pf-adr/SKILL.md`）。 |
| **Spec-anchored（规格锚定）** | 规格与产物同步演进的开发级别：交接产物 Schema 即契约，门禁处校验强制对齐（`schemas/`，见 `references/design-principles.md` § 契约）。 |
| **Contract fixture（契约正反例）** | 每个交接产物 schema 配套的合法/非法样例（`tests/fixtures/verify-valid`、`verify-invalid`），校验器用它们证明契约行为。 |
| **Plugin optimization playbook（插件优化方法论）** | 维护期优化现有插件的固定流程：审计先行（findings 驱动）→ P0/P1/P2 分级 → 每个修复固化为先红后绿的防回归测试 → 收尾三连（测试 + 门禁 + diff 审查）。见 `references/plugin-optimization.md`。 |

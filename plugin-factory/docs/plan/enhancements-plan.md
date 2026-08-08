# Enhancements Plan — pf-learn, Pipeline State, SKILL Template, Pre-commit, Entry Skill

> **Created**: 2026-08-08
> **Scope**: 吸收 moonbit-skills 中的 5 个高/中价值模式，落地到 plugin-factory 的脚手架、验证引擎和技能系统。
> **Goal**: 让 plugin-factory 生成的插件具备错误学习闭环、跨会话进度持久化、标准化技能结构、安全感知 pre-commit hook、和 alwaysApply 入口。

---

## Phase 对比：plugin-factory vs moonbit-skills

| 模式 | plugin-factory 现状 | moonbit-skills 对标 | 价值 |
|------|---------------------|---------------------|------|
| 错误学习闭环 | 无，bug 处理知识不沉淀 | `moonbit-learn` + RCA 模式 + 可观察根因信号 | 高 |
| 跨会话持久化 | 无，全靠对话历史 | `.moonbit-pipeline.json` + schema 校验 + 断点恢复 | 高 |
| 技能模板三段式 | Iron Law/Red Flags/自检在个别技能中手写 | 每条技能有标准 `## Iron Law` + `## Red Flags` + `## 路由后自检` | 中 |
| pre-commit 安全扫描 | 无，只有结构检查 | Step 0 安全扫描 + fmt 自修复 + 增量检查 | 中 |
| alwaysApply 入口 | `using-pf` 无 `alwaysApply: true` | `using-moonbit-skills` 有 `alwaysApply: true` | 中 |

---

## 依赖图

```
Phase A (pf-learn)        Phase B (pipeline state)    Phase C (SKILL template)    Phase D (pre-commit)    Phase E (entry skill)
      │                           │                          │                          │                         │
      └──────────┬────────────────┴──────────┬───────────────┴──────────┬─────────────────┴─────────┬────────────────┘
                 │                           │                          │                            │
                 ▼                           ▼                          ▼                            ▼
         verify.mjs learnable flag    scaffold.mjs pipeline tmpl    SKILL.md.tmpl standard        using-pf alwaysApply
         pf-lifecycle reference      verify.mjs pipeline check       pf-verify skill-structure    session-start hooks
         pf-verify new signal        pf-build document               pf-build adopt new tmpl    AGENTS.md docs
```

**执行顺序**：A → B → C → D → E（有顺序依赖：verify.mjs 改 learnable flag 后，B 和 C 的 verify 扩展才能复用同一引擎）

---

## Phase 详情

### Phase A: pf-learn — 错误学习闭环

**目标**：插件遇到 bug 或重复验证失败时，知识可沉淀到技能文件或 references，不丢失。

**核心设计**：
- 新增 `skills/pf-learn/SKILL.md` — 学习协议技能
- `verify.mjs` 新增 `learnable: boolean` 到 finding 结构（不破坏现有 JSON schema，仅新增可选字段）
- `pf-lifecycle` 引用 learnable 信号，推荐 `pf-learn` 执行
- `references/learned-patterns.md` — 跨 session 知识沉淀文件（模板生成）

**不做**：不仿照 moonbit-learn 的 RCA 事故模式（那是生产级插件才需要的）；plugin-factory 的 learn 聚焦于「验证发现 → 规则更新」。

---

### Phase B: 跨会话 Pipeline 状态持久化

**目标**：插件开发中断时，可从中断点恢复，不丢失进度。

**核心设计**：
- 新增 `templates/shared/pipeline-state.schema.json.tmpl` — pipeline state schema
- 新增 `scripts/pipeline-state.mjs` — pipeline state 读写、校验、迁移
- `scaffold.mjs` 在生成的插件中写入初始 `pipeline-state.json`
- `verify.mjs` 新增 `pipeline-consistency` 检查（schema_version 匹配、plan_file 存在性）
- `pf-build` 文档化 pipeline state 的使用方式

**与 moonbit 的差异**：plugin-factory 的 pipeline state 更轻量——只追踪「当前 phase + 完成任务列表 + plan_file 引用」，不做 moonbit 的 complex phase/state machine。

---

### Phase C: SKILL.md 模板三段式增强

**目标**：每条技能模板自动包含 Iron Law / Red Flags / Post-routing self-check 三段，减少手工遗漏。

**核心设计**：
- 更新 `templates/skills/{{PLUGIN_PREFIX}}-hello/SKILL.md.tmpl`，增加三段标准模板
- `pf-verify` 新增 `skill-structure` 检查：验证每条 SKILL.md 包含这三个段落
- 更新 `using-pf/SKILL.md` 和所有 `pf-*` 技能，采纳新模板结构
- `AGENTS.md` 更新质量栏，记录新三段式要求

---

### Phase D: pre-commit Hook 安全扫描

**目标**：pre-commit hook 增加安全扫描（secret detection）和增量检查，不扫描无关文件。

**核心设计**：
- 新增 `templates/shared/scripts/pre-commit.sh.tmpl` — bash pre-commit（含 secrets scan step）
- 新增 `templates/shared/scripts/pre-commit.ps1.tmpl` — PowerShell 变体
- 更新 `templates/harnesses/claude-code/hooks/hooks.json.tmpl`，加入 pre-commit hook 声明
- 更新 `validate-structure.sh.tmpl`，增加 secrets scan 可选步骤
- `pf-git` 文档化增强的 pre-commit hook
- `pf-verify` 检查 `hooks/pre-commit.sh` 和 `.ps1` 存在性

**与 moonbit 的差异**：plugin-factory 的 secrets scan 只做基础 pattern（password/secret/token/api_key），不引入外部工具（如 gitleaks），保持零依赖。

---

### Phase E: Entry Skill `alwaysApply` 优化

**目标**：`using-<plugin>` 入口技能标记为 `alwaysApply: true`，确保 session-start 时强制激活。

**核心设计**：
- `using-pf/SKILL.md` 添加 `alwaysApply: true` 到 frontmatter
- `templates/skills/{{PLUGIN_PREFIX}}-hello/SKILL.md.tmpl` 包含 `alwaysApply` 占位符
- `pf-verify` 新增检查：`using-<plugin>` 入口技能必须有 `alwaysApply: true`
- `AGENTS.md` 更新入口激活规则说明

---

## 交付物总览

| Phase | 新增文件 | 修改文件 | 测试 |
|-------|---------|---------|------|
| A | `skills/pf-learn/SKILL.md`, `references/learned-patterns.md.tmpl` | `scripts/verify.mjs`, `skills/pf-lifecycle/SKILL.md`, `skills/pf-verify/SKILL.md` | `tests/learn/learnable-finding.test.mjs` |
| B | `templates/shared/pipeline-state.schema.json.tmpl`, `scripts/pipeline-state.mjs` | `scripts/scaffold.mjs`, `scripts/verify.mjs`, `skills/pf-build/SKILL.md` | `tests/pipeline/pipeline-state.test.mjs` |
| C | — | `templates/skills/{{PLUGIN_PREFIX}}-hello/SKILL.md.tmpl`, `skills/pf-verify/SKILL.md`, `skills/using-pf/SKILL.md`, `skills/pf-*.md` 全部, `AGENTS.md` | `tests/verify/skill-structure.test.mjs` |
| D | `templates/shared/scripts/pre-commit.sh.tmpl`, `templates/shared/scripts/pre-commit.ps1.tmpl` | `templates/harnesses/claude-code/hooks/hooks.json.tmpl`, `templates/shared/scripts/validate-structure.sh.tmpl`, `skills/pf-git/SKILL.md`, `skills/pf-verify/SKILL.md` | `tests/hooks/pre-commit-security.test.mjs` |
| E | — | `skills/using-pf/SKILL.md`, `templates/skills/{{PLUGIN_PREFIX}}-hello/SKILL.md.tmpl`, `skills/pf-verify/SKILL.md` | `tests/verify/entry-always-apply.test.mjs` |

---

## 验证标准

每个 Phase 完成后：
1. `npm test` — 100/100 + 新增测试全绿
2. `npm run validate` — plugin-factory 自身通过
3. 狗食验证：`npm run smoke` — 生成插件包含新能力
4. 无 regression：已有 100 个测试全部通过

---

## 风险

| 风险 | 缓解 |
|------|------|
| verify.mjs 改 schema 破坏下游 | `learnable` 和 `pipelineState` 均为可选字段，向后兼容 |
| SKILL.md.tmpl 大改影响已有技能 | 分步迁移：先改模板，再逐个更新已有技能，每步都过测试 |
| pre-commit hook 与用户现有 hook 冲突 | 模板不强制安装，只在生成时写入文件；用户自行配置 |
| pipeline state schema 变更 | schema_version 字段 + `migrateState()` 函数，旧文件自动迁移 |

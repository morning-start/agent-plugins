# ADR-0002 — 技能命名约定（`pf-` 前缀）

- **状态**: 已接受（2026-08-01）
- **背景**: 子技能名要短到便于调用、够独特以免共享技能目录（`.agents/skills/`、
  `~/.agents/skills/`）冲突，且符合 Agent Skills 标准（name == 目录）。

## 决策

- 目录与 `name` 均用 `<项目前缀>-<短名>`：`skills/pf-intent/SKILL.md` → `name: pf-intent`。
- 前缀是短缩写（`pf`），绝不用全名（`plugin-factory-intent`）。
- 斜杠命令镜像前缀：`/pf-new`、`/pf-intent`、`/pf-analyze`、…
- `tags`/`metadata` 承载冗余品牌信息（`tags: [pf, pf-intent]`）。

## 理由

- name == 目录让 Claude Code（严格）能加载；pi 宽松、opencode v2 不强制——
  以最严端为准。
- 短前缀保证调用顺手，同时防共享目录冲突。
- 生成插件沿用同一约定，使用各自项目前缀。

## 后果

- 验证器必须检查 name == 目录与跨源唯一性。
- 前缀属于插件身份的一部分（记录在 `references/design-principles.md`）。

## 备选方案

- 目录用长前缀（`plugin-factory-intent`）——否决：不便调用。
- 仅 `name` 字段带前缀——否决：破坏 Claude Code 的 name == 目录规则。
- 无前缀——否决：共享目录冲突。

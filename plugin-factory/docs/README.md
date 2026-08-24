# 文档地图（Documentation Map）

> **固化于：2026-08-02** · 按 **Diátaxis** 四象限归位（tutorials / how-to /
> reference / explanation）。目标：任何问题 60 秒内找到答案，且每个文件只有
> 一个权威位置。本文只做归位导航，不复制任何文档内容。

## 四象限地图

| 象限 | 用户需求 | 本仓库位置 |
|------|----------|-----------|
| **Tutorials（教程）** | 新手从零学会用 plugin-factory 生成一个插件 | `README.md`（快速上手）· `tests/smoke/`（dogfood 示例）· `templates/`（脚手架对照） |
| **How-to（操作指南）** | 完成任务：创建/维护/分析/发布插件 | `skills/using-pf/SKILL.md`（统一入口路由）· `docs/templates/`（变更/场景模板）。交付任务记录 T1–T6 属开发过程文档，见 `.agent-workplace/docs/task/`（gitignored） |
| **Reference（参考）** | 查规范：标准、契约、约定、探针、适配器 | `references/`（设计原则、编排模式、生命周期矩阵、适配器/插件规格）· ADR 约定见 `skills/pf-adr/SKILL.md` · `docs/glossary.md`（术语）· `tools/shared/schemas/`（交接产物 JSON Schema 契约）· `tools/`（可执行门禁：verify/bundle/package）· `roles/`（子代理提示词） |
| **Explanation（解释）** | 理解为什么：决策、设计原则 | `docs/ADR-*.md`（架构决策记录）· `references/design-principles.md`（铁律论证）· `temp-docs/`（开发过程文档）。分析报告（ecc/superpowers/optimization 等）属私有研究，已移入 `.agent-workplace/research/`（不提交 git） |

## 快速导航

| 我想… | 去这里 |
|-------|--------|
| 了解项目是做什么的 | `README.md` / `README.zh-CN.md` |
| 生成一个新插件 | `commands/pf-new.md` → `skills/using-pf/SKILL.md`（路由入口） |
| 查一条铁律 | `AGENTS.md` § Design principles（8 条精炼版）· `references/design-principles.md`（详细论证） |
| 查一个术语 | `docs/glossary.md` |
| 查交接产物契约 | `tools/shared/schemas/README.md`（Schema 即契约，门禁校验） |
| 查 ADR 怎么写 | `skills/pf-adr/SKILL.md` |
| 查开发进度 | `temp-docs/plan/`、`temp-docs/task/` |
| 查生命周期探针 | `tools/verify/README.md`（11 个探针） |
| 查编排模式 | `references/orchestration-patterns.md` |
| 查某端（Claude Code/pi/opencode）适配 | `tools/harnesses/<端>/plugin.md` · `references/README.md` |
| 优化一个现有插件 | `references/plugin-optimization.md`（审计先行 + P0/P1/P2 分级 + 防回归测试固化） |
| 查职责边界纪律 | `references/skill-boundaries.md`（设计期）· `references/plugin-optimization.md`（维护期对偶） |
| 整理仓库结构 / 归纳原则 | `references/induction-principles.md`（按场景归位、唯一源、移动必接线） |
| 跑验证/测试 | `package.json` scripts（`npm test` / `npm run validate` / `npm run verify`） |

## 维护规则

- 新文档先归位到四象限，再写入内容；**不要**在多个位置复制同一内容。
- 路由数据唯一权威是 `tools/routing/routing-table.json`；SKILL.md 的路由表格由 `tools/routing/render-routing.mjs` 渲染（verify 防漂移），不要手改。
- 修改 `references/` 或 `docs/` 约定时，同步更新本文导航与 CHANGELOG。
- 判断位置的原则：文档回答"是什么/规范" → reference；"怎么做" → how-to；
  "为什么" → explanation；"入门跟做" → tutorial。

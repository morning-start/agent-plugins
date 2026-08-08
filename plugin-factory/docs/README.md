# 文档地图（Documentation Map）

> **固化于：2026-08-02** · 按 **Diátaxis** 四象限归位（tutorials / how-to /
> reference / explanation）。目标：任何问题 60 秒内找到答案，且每个文件只有
> 一个权威位置。本文只做归位导航，不复制任何文档内容。

## 四象限地图

| 象限 | 用户需求 | 本仓库位置 |
|------|----------|-----------|
| **Tutorials（教程）** | 新手从零学会用 plugin-factory 生成一个插件 | `README.md`（快速上手）· `tests/smoke/`（dogfood 示例）· `templates/`（脚手架对照） |
| **How-to（操作指南）** | 完成任务：创建/维护/分析/发布插件 | `commands/`（`/pf-*` 斜杠命令）· `docs/tasks/`（交付任务清单 T1–T6） |
| **Reference（参考）** | 查规范：标准、契约、约定、探针、适配器 | `references/`（设计原则、ADR 约定、编排模式、生命周期矩阵、适配器/插件规格）· `docs/glossary.md`（术语）· `schemas/`（交接产物 JSON Schema 契约）· `scripts/`（可执行门禁） |
| **Explanation（解释）** | 理解为什么：决策、分析、优化报告 | `docs/ADR-*.md`（架构决策记录）· `docs/report/`（分析报告：ecc/superpowers/optimization）· `references/design-principles.md`（铁律论证）· `temp-docs/`（开发过程文档） |

## 快速导航

| 我想… | 去这里 |
|-------|--------|
| 了解项目是做什么的 | `README.md` / `README.zh-CN.md` |
| 生成一个新插件 | `commands/pf-new.md` → `skills/using-pf/SKILL.md`（路由表权威位置） |
| 查一条铁律 | `AGENTS.md` § Design principles（8 条精炼版）· `references/design-principles.md`（详细论证） |
| 查一个术语 | `docs/glossary.md` |
| 查交接产物契约 | `schemas/README.md`（Schema 即契约，门禁校验） |
| 查 ADR 怎么写 | `references/adr-conventions.md` |
| 查开发进度 | `temp-docs/plan/`、`temp-docs/task/` |
| 查生命周期探针 | `references/lifecycle-matrix.md`（11 个探针） |
| 查编排模式 | `references/orchestration-patterns.md` |
| 查某端（Claude Code/pi/opencode）适配 | `references/plugins/<端>.md` · `references/agent-adapters.md` |
| 跑验证/测试 | `package.json` scripts（`npm test` / `npm run validate` / `npm run verify`） |

## 维护规则

- 新文档先归位到四象限，再写入内容；**不要**在多个位置复制同一内容。
- 路由表只存在于 `skills/using-pf/SKILL.md`（单一权威，避免漂移）。
- 修改 `references/` 或 `docs/` 约定时，同步更新本文导航与 CHANGELOG。
- 判断位置的原则：文档回答"是什么/规范" → reference；"怎么做" → how-to；
  "为什么" → explanation；"入门跟做" → tutorial。

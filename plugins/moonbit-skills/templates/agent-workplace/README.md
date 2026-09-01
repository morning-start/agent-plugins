# .agent-workplace — Agent 私有工作区

> 本目录是 Agent 的私有工作区：**全部内容不提交 git**（根 `.gitignore` 一行 `.agent-workplace/`）。
> 过程稿不提交；定稿发布到正式 `docs/`。
> 详细规范见 `references/project-contract.md` §二。

## 文档系统衔接（过程态 vs 正式 docs）

| 内容 | 位置 | 提交? |
|------|------|-------|
| requirements / PRD / ADR **定稿** | 正式 `docs/` | ✅ |
| plan / task / spec 草稿 / decisions / 脚本尝试 | 本目录（`.agent-workplace/`） | ❌ |

## 目录地图

| 路径 | 用途 |
|------|------|
| `docs/plan/` | 计划文档（Phase→Batch→Task，路线图式规划） |
| `docs/task/` | 任务拆解文档（分阶段实现计划，含验证命令） |
| `docs/spec/` | 规格草稿（implement 阶段的详细设计、API 契约） |
| `docs/decisions.md` | 决策记录（DEC-xxx：日期 + 决策 + 理由 + 影响） |
| `state/checkpoint.json` | 管线状态 + 断点续跑（唯一状态源） |
| `state/artifacts.json` | 产物注册表（跨阶段追踪） |
| `scripts/` | 可执行实验脚本 / 测试桩 |
| `scratch/` | 一次性探索产物（`{YYYYMMDD}-{type}-{slug}`） |
| `research/` | 调研缓存（技术选型、方案对比、根因调查） |

## 维护方

本目录由 `moonbit-writing-plans` / `moonbit-implement` 自行创建和维护，属 moonbit-skills 自包含管线的私有状态区。模式定义（todo/spec/loop/graph）不在本工作区内，它们位于 `skills/`。

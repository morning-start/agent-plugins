# flowstate

**项目开发全流程规范插件** — 引导 AI 编程助手在**需求不全、中途变更、持续迭代**的真实项目中，按"先锁核心底线、边做边补、可控变更、持续校准"流程工作。

> 中文介绍 · English overview 见 `docs/README.md`（文档地图）与 `docs/PRD.md`（完整需求）。

## 这是什么

flowstate 把整个开发过程建模为一张**可执行的状态图（Agent Graph）**——节点是流程环节（N1~N9），边是 DoD 流转判据，人工闸门（HITL）强制等人确认。**图为逻辑蓝图，采用动态软编排**：由 Claude Code / Codex 等 Agent 框架按 skills/commands 原生驱动执行，不做代码级硬编排。

## 技能（skills）

| 技能 | 管哪些节点 | 功能 | 最佳实践 |
|------|-----------|------|---------|
| `using-flowstate` | 入口路由 | 按场景路由到 fst-* | — |
| `fst-init` | N1 立项、N2 冻结、N3 设计 | F1~F3 | Spec 模式 |
| `fst-change` | N5 变更、N9 紧急 | F5/F9 | Plan 模式 |
| `fst-review` | N6 测试、N7 灰度 | F6/F7 | Task 模式 |
| `fst-iterate` | N4 迭代、N8 闭环 | F4/F8 | Goal + Task 模式 |

## 多端支持（harnesses）

flowstate 是跨端插件：技能按 Agent Skills 标准写一次，各端原生加载。

| 端 | manifest | 技能发现 | 入口引导 |
|----|----------|---------|---------|
| Claude Code | `.claude-plugin/plugin.json` | `skills/` | `using-flowstate` |
| pi | `package.json` → `pi.skills` | `skills/` | `.pi/extensions/fst-bootstrap.ts` 注入 |
| oh-my-pi (omp) | `package.json` → `omp.skills` | `skills/` | 复用 pi bootstrap（见 `OMP-NOTES.md`） |
| opencode | `.opencode/opencode.json` | `.opencode/skills/`（预复制） | `.opencode/plugins/fst-bootstrap.ts` 注入（见 `.opencode/INSTALL.md`） |

各端安装方式见对应端说明：`OMP-NOTES.md`（omp）、`.opencode/INSTALL.md`（opencode）。

## 工作区

- `.agent-workplace/` — Agent 私有工作区（plan/task/spec/scripts/state，**不提交 git**），规范见 `docs/agent-workplace.md`
- `templates/agent-workplace/` — 工作区模板，给其他项目初始化用（`cp -r` 复制）

## 文档

见 `docs/README.md`（文档地图）：PRD、ADR-0001（命名）、ADR-0002（图编排）、glossary、skill-split（技能拆分）。

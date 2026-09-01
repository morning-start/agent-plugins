# 技能拆分方案（Skill Split）

- **状态**: Accepted（已接受）
- **日期**: 2026-08-08
- **来源**: 基于 PRD §四（功能 F1~F9）、§七（执行图 N1~N9）、§五（产出物 5.1~5.9）、操作模式（`references/agent-modes/`：lightweight todo / spec / loop / graph，插件绑定）设计。草稿见 `.agent-workplace/docs/spec/skill-split-draft.md`（过程态，不提交）。
- **用途**: 说明 flowstate 为什么拆成这些技能（拆分脉络）。**技能↔节点映射、节点归属、边契约、schema 归属的唯一权威是 [`references/skill-graph.md`](../references/skill-graph.md)**——本文件只讲拆分依据，不复制关系矩阵。

## 拆分思路（为何这样分）

flowstate 把全流程拆为 **3 层**，每层职责单一、互不越权：

| 层 | 技能 | 为何独立成技能 |
|----|------|----------------|
| **入口路由** | `using-fst` | 按场景选唯一首技能；不执行流程，避免重复的入口逻辑分散在各生命周期技能 |
| **生命周期** | `fst-init` / `fst-change` / `fst-review` / `fst-iterate` | 各自负责一段节点（立项/变更/验收/执行），规划与执行分离（fst-change 只规划，fst-iterate 唯一执行） |
| **横切能力** | `fst-workplace` / `fst-research` / `fst-promote` | 跨越全部节点的基础能力（工作区 / 调查 / 定稿闸门），被生命周期技能按需调用，不占用生命周期节点 |

## 关键拆分决策

- **规划与执行分离**：`fst-change` 只做变更管控（记录→分级→评估→审批→归档），不写代码；所有代码实现统一由 `fst-iterate` 作为唯一执行入口驱动。N9 Hotfix 是唯一先修后补的例外。
- **策略选择内联**：`fst-iterate` 内含"方略选择"章节，不再做成独立技能或生命周期节点。正式策略为 spec / loop / graph；lightweight todo 只是 `fst-iterate` 的轻量执行路径（非正式策略）。
- **横切能力独立**：工作区（fst-workplace）、调查（fst-research）、定稿（fst-promote）横切 N1~N9，做成独立可调用技能，避免每个生命周期技能重复实现。

> 节点→技能映射、交接边、schema 归属、越权铁律：见 [`references/skill-graph.md`](../references/skill-graph.md)。
> 完整交接链叙述：见 `skills/using-fst/SKILL.md`「编排总览」。
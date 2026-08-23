## flowstate 架构与职责契约

> 本文件是 flowstate 的架构总览与职责边界契约。具体执行规则以各技能、references/ 和 schemas/ 为准。

## 1. 分层模型

| 层 | 组件 | 职责 | 不负责 |
|---|---|---|---|
| 入口层 | using-flowstate | 识别用户意图并路由到生命周期技能 | 不执行流程、不创建业务产物 |
| 生命周期层 | fst-init / fst-change / fst-iterate / fst-review | 分别负责立项、变更、执行迭代、验收发布 | 不重复维护其他技能规则 |
| 横切基础设施 | fst-workplace / fst-research | 工作区：初始化、落点、运行时状态；分析调查：调查→分析→报告（research/ + report/） | 不选择策略、不驱动生命周期节点 |
| 执行方法层 | references/agent-modes/ | 提供 todo、spec、loop、graph 的具体方法 | 不作为用户入口、不改变 N1~N9 |
| 契约验证层 | schemas/、tests/、hooks | 约束产物结构、执行校验和提交门禁 | 不决定范围、不替代人工确认 |

**命令与技能**：commands/*.md 是薄入口，skills/*/SKILL.md 是执行契约唯一权威；命令不得发展出独立流程。

## 2. 生命周期职责矩阵

| 节点 | 唯一负责技能 | 核心产出 | 交接条件 |
|---|---|---|---|
| N1~N3 | fst-init | 需求分层、范围说明书、柔性 PRD、风险清单 | 底线确认、范围签署、PRD 通过 |
| N4 | fst-iterate | plan、task、代码分支、技术债、批次验证记录 | 代码完成、批次 Gate 通过 |
| N5 | fst-change | 变更申请、分级、影响评估、排期归档 | 用户确认、变更单归档并排期 |
| N6~N7 | fst-review | 测试回归报告、DoD、灰度方案、放量决策 | DoD 通过、灰度指标达标 |
| N8 | fst-iterate | 回顾报告、下轮范围建议 | 用户确认下轮范围 |
| N9 | fst-change（紧急例外） | 紧急 checkpoint、Hotfix、补录变更单 | 修复验证后进入 fst-review |

fst-workplace 与 fst-research 横切 N1~N9，但只提供基础设施（工作区 / 分析调查），不占用生命周期节点。

## 3. 变更入口与 trivial diff 边界

- 新需求、范围外改动、缺陷修复、线上事故：先进入 fst-change，记录、评估并分级。
- 已在范围内、已排期、单点低风险、无需探索的实现动作：可进入 fst-iterate 的 lightweight todo path。
- lightweight todo 不是正式 strategy；正式 plan 只允许 spec / loop / graph。
- phase 记录一个主 strategy 作为默认执行约束，但 strategy 不是互斥模式；task 或节点内可以组合其他方法，例如 Graph 节点使用 Spec 验收。

## 4. 代码与决策边界

- fst-iterate 是常规代码实现、分批执行、Git 分支和批次 Gate 的唯一入口。
- fst-change 常规路径只记录、分级、评估、审批、排期、归档；不得写代码或开功能分支。
- N9 Hotfix 是唯一先执行后补单的例外；修复后必须补录并进入 fst-review。
- fst-review 只测试、核销 DoD、制定灰度和汇总反馈；发现缺陷时回 fst-change。
- 用户负责范围、重大变更、策略确认、DoD 核销和放量决策；Agent 负责起草、执行和提供证据。

## 5. 产物所有权与落点

| 产物 | 负责技能 | 默认落点 |
|---|---|---|
| 需求分层 / 范围 / 风险 | fst-init | 正式 docs/，草稿 .agent-workplace/ |
| 变更申请 / 影响评估 | fst-change | docs/cr/ 或 docs/CR.md |
| plan / task / checkpoint / artifacts | fst-iterate + fst-workplace | 过程态 .agent-workplace/ |
| 技术债 / 回顾 | fst-iterate | 默认 .agent-workplace/docs/ |
| 测试报告 / DoD / 灰度记录 | fst-review | 正式 docs/，草稿 .agent-workplace/ |

fst-workplace 只决定落点并维护目录，不拥有业务产物内容。

## 6. 维护规则

1. 修改生命周期职责时，先更新本文件矩阵，再同步技能和命令。
2. 新增执行方法只添加 references/agent-modes/，不得创建新的生命周期入口。
3. 术语统一：正式策略为 spec / loop / graph；简单路径称 lightweight todo。loop 的模式定义在 `references/agent-modes/goal.md`（文件名历史遗留），运行时状态记录在 `state/goal.md`——两者勿混淆，loop 不是第四种独立策略。
4. 每个 batch 完成后更新 checkpoint，并通过 schema、构建、冒烟和任务验收 Gate。

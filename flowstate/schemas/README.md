# schemas/ — 产出物 JSON Schema

> **本目录是产出物结构的唯一权威**。字段/枚举/必填校验只改 schema，不复制进 PRD §五或任何 SKILL 正文；
> 各文件引用与改动点见下方清单。`npm test`（`tests/validate-schemas.mjs`）用 valid/invalid fixtures 验证 schema 本身合法性。

## 过程产出物 schema（对应 `docs/PRD.md` §五 5.1~5.9）

每个 schema 约束一种开发过程产出物的最小合法结构。

| Schema | PRD § | 用途 |
|--------|-------|------|
| `requirements-layer.schema.json` | 5.1 | 需求分层清单（MoSCoW） |
| `scope.schema.json` | 5.2 | 迭代范围说明书 |
| `change-request.schema.json` | 5.3 | 变更申请单（fst-change N5 / N9 紧急通道） |
| `dod-checklist.schema.json` | 5.4 | 验收 Checklist（fst-review N6） |
| `risk-list.schema.json` | 5.5 | 风险清单 |
| `tech-debt.schema.json` | 5.6 | 技术债清单 |
| `retrospective.schema.json` | 5.7 | 回顾报告 |
| `plan.schema.json` | 5.8 | docs/plan 产物（formal phase 必须含 `strategy` 字段：spec/loop/graph（trivial todo 不进入正式 plan）） |
| `task.schema.json` | 5.9 | docs/task 产物（任务含 `acceptance` 验收标准、`deps` 依赖边） |

## 横切能力 schema（不对应 PRD F1~F9，被横切技能按需引用）

| Schema | 引用技能 | 用途 |
|--------|---------|------|
| `promotion-request.schema.json` | `fst-promote` | 定稿闸门：源过程文档 → 目标定稿文档的提升/审批记录 |
| `document-status.schema.json` | `fst-workplace` | 文档生命周期状态追踪（DRAFT/REVIEW_NEEDED/APPROVED/ARCHIVED/OBSOLETE） |
| `investigation-fact-check.schema.json` | `fst-research` | 调研事实核查条目（claim/evidence/status/confidence） |

> 运行期返回摘要（各 SKILL「输出」段的 JSON）只是示意，**不是权威**；字段与校验一律以上表 schema 为准。

所有 schema 使用 JSON Schema draft-07，`$id` 前缀为 `https://github.com/morning-start/agent-plugins/schemas/`。
测试 fixture 位于 `tests/fixtures/verify-valid/` 和 `tests/fixtures/verify-invalid/`。

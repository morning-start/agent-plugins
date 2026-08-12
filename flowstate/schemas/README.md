# schemas/ — 产出物 JSON Schema

对应 `docs/PRD.md` §五 5.1~5.9，每个 schema 约束一种开发过程产出物的最小合法结构。

| Schema | PRD § | 用途 |
|--------|-------|------|
| `requirements-layer.schema.json` | 5.1 | 需求分层清单（MoSCoW） |
| `scope.schema.json` | 5.2 | 迭代范围说明书 |
| `change-request.schema.json` | 5.3 | 变更申请单 |
| `dod-checklist.schema.json` | 5.4 | 验收 Checklist |
| `risk-list.schema.json` | 5.5 | 风险清单 |
| `tech-debt.schema.json` | 5.6 | 技术债清单 |
| `retrospective.schema.json` | 5.7 | 回顾报告 |
| `plan.schema.json` | 5.8 | docs/plan 产物 |
| `task.schema.json` | 5.9 | docs/task 产物 |

所有 schema 使用 JSON Schema draft-07，`$id` 前缀为 `https://github.com/morning-start/agent-plugins/schemas/`。
测试 fixture 位于 `tests/fixtures/verify-valid/` 和 `tests/fixtures/verify-invalid/`。

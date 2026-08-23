# tools/shared — 跨模块共享资产

被多个模块/技能共用的资产，不属于任何单一模块。

```
schemas/   JSON Schema（跨模块契约；Schema 即契约，门禁校验）
  prd.schema.json                PRD 校验（pf-intent）
  component-manifest.schema.json 构件清单校验（pf-design）
  audit-report.schema.json       审计报告校验
```

## 用法

```sh
node tools/verify/validate-schema.mjs --schema tools/shared/schemas/prd.schema.json --input <prd.json>
```

## 边界

Schema 文件只进这里（单一权威）；各模块不得私藏自己的 Schema 副本。新增跨模块
契约 Schema 时放本目录并在此登记。

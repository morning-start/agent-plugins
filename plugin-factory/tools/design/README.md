# tools/design — 设计/维护期门禁脚本

把 pf-design / pf-intent / pf-build / pf-lifecycle 里的手工判断替换为确定性
可执行门禁的脚本集合。每个脚本导出一个纯函数（供测试），CLI 只做参数解析。

```
check-conflicts.mjs     触发域冲突检测（DES-5，Jaccard 相似度，复用 verify 的 keywordBag/jaccard）
check-creator.mjs       skill-creator 可用性门禁（BLD-1）
check-dependencies.mjs  跨技能依赖图分析（LIF-5，handoff/chain）
check-tool-names.mjs    "技能说动作、不说工具名" 门禁（DES-3）
complexity.mjs          复杂度门禁核心（INT-2，scoreComplexity）
evals.mjs               评测结果记录（X-2，recordEval/evalCoverage）
recommend-bundles.mjs   阶段 1 确定性打包推荐（BND-1，多集 Jaccard 聚类）
evals.json              评测结果数据（evals.mjs 读写）
```

## 用法

```sh
node tools/design/check-conflicts.mjs --manifest <manifest.json>  # 或 --root <dir>
node tools/design/check-creator.mjs [--root <dir>]
node tools/design/complexity.mjs --skills <N> [--hooks] [--harnesses <N>]
node tools/design/evals.mjs record --skill <s> --name <n> --passed <true|false>
node tools/design/recommend-bundles.mjs --root <dir> [--threshold 0.18] [--output-json r.json]
```

## 边界

这些脚本被**技能直接调用**（pf-design / pf-intent / pf-build / pf-lifecycle），
替代对应步骤里的手工评分/判断。它们共享 `tools/verify/verify.mjs` 导出的
`collectSkills` / `keywordBag` / `jaccard` / `LIFECYCLE_STATUS_RE` 等基础函数，
自身不重复实现。

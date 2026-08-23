# tools/routing — 意图路由

plugin-factory 的意图路由：把自然语言输入确定性地映射到 pf-* 技能。
**单一数据源是 `routing-table.json`**——改路由只改这个文件，再重新渲染。

```
route-intent.mjs      路由核心：routeIntent()（ENT-1）
routing-table.json    单一数据源（scenario/skill/path/keywords/priority/trigger）
routing-render.mjs    纯表格渲染器（无副作用）
render-routing.mjs    CLI：把 routing-table.json 渲染进 skills/using-pf/SKILL.md
```

## 用法

```sh
node tools/routing/route-intent.mjs "<natural language input>" [--format table|json]
node tools/routing/render-routing.mjs [--check]   # 重新渲染 using-pf 路由表；--check 只校验漂移
```

- 路由数据**永不内联**在技能正文或其它脚本里——编辑 `routing-table.json`。
- `verify.mjs` 内置 `routing-table-drift` FAIL 探针，防止路由表与渲染产物漂移。

## 边界

本模块只做"输入 → 场景/技能"的确定性匹配与表格渲染。路由决策后的流程引导
（场景步骤、交接）属于 `skills/using-pf/SKILL.md` 与 `references/orchestration-patterns.md`。

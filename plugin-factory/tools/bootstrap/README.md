# tools/bootstrap — 引导渲染器 + 管道状态

生成插件的引导（bootstrap）机制与跨会话管道状态。

```
render-bootstrap.mjs   规范引导渲染器：读 using-<plugin> 入口技能（规范源），
                       去掉 YAML frontmatter，加单一引导 marker（PLUGIN_FACTORY_BOOTSTRAP）
pipeline-state.mjs     管道状态读写/校验/迁移（pipeline-state.json，跨会话恢复用）
```

## 用法

```sh
node tools/bootstrap/render-bootstrap.mjs --root <dir> --plugin-name <n> --harness <claude|pi|opencode>
```

`render-bootstrap.mjs` 被根 `hooks/session-start.*` 与生成插件的同名钩子调用；
marker 幂等（同一插件恰好一个 marker），重复注入由各端适配器检测并跳过。

## 边界

入口技能本体在 `skills/using-<plugin>/SKILL.md`（规范源），本模块只做
"读 → 去 frontmatter → 加 marker" 的渲染，不复制技能内容。

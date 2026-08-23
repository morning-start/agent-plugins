# tools/release — 发布门禁 + 打包

发布前准备门禁与可分发产物打包。发布分类/CHANGELOG 写作在 `skills/pf-version`、
`skills/pf-release`；这里只提供可执行门禁。

```
release-check.mjs   发布门禁：版本检查 → 版本审计 → 校验器 → CHANGELOG 条目 →
                    宣称 harness 产物检查（有 FAIL 即退出 1）
package-plugin.mjs   把已通过校验的插件打包成可分发 .zip（零依赖，纯 Node）
```

## 用法

```sh
node tools/release/release-check.mjs --root <dir> [--json]
node tools/release/package-plugin.mjs [--root <dir>] [--out <dir>] [--json]
```

打包是**门禁制**：结构与 harness 校验必须无 FAIL 才允许打包。排除目录：
`node_modules`、`.git`、`.agent-workplace`、`dist`、`build`、`out`、`.pnp`。

## 边界

版本号决策与提升在 `tools/version/`；"是否可以发布"由本模块的检查结果决定；
真正的发布动作（tag/push）永远只在用户明确要求时执行。

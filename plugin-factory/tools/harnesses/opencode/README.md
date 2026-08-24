# opencode

opencode 插件 harness。

## 规范文档

| 文档 | 内容 |
|------|------|
| `plugin.md` | 插件格式、opencode.json 配置 |
| `hooks.md` | TypeScript 插件事件模型 |
| `adapters.md` | 跨 harness 适配规则 |

## 生命周期工具

| 模块 | 职责 | 关键函数 |
|------|------|----------|
| `init.mjs` | 初始化 .opencode/ 目录、复制模板 | `init(target, values)` |
| `update.mjs` | 更新 opencode.json、增删 plugin 引用 | `updateConfig()`, `addPlugin()` |
| `upgrade.mjs` | 版本管理 | `getVersion()`, `setVersion()` |
| `verify.mjs` | opencode.json 有效性、plugins 目录、导出检查 | `validate(root)` |
| `scaffold.mjs` | install/quickstart/uninstall 文本 | `getInstallSection()` |

## 约束

- 插件**必须**是 TypeScript/JS 模块，导出 Plugin 函数
- `.opencode/plugins/` 目录**必须**存在
- opencode.json **必须**是有效 JSON

# claude-code

Claude Code 插件 harness。

## 规范文档

| 文档 | 内容 |
|------|------|
| `plugin.md` | 插件格式、目录结构、manifest |
| `hooks.md` | hooks.json 事件、命令格式、`${CLAUDE_PLUGIN_ROOT}` |
| `adapters.md` | 跨 harness 适配规则 |

## 生命周期工具

| 模块 | 职责 | 关键函数 |
|------|------|----------|
| `init.mjs` | 初始化目录、复制模板、生成 hooks.json | `init(target, values)` |
| `update.mjs` | 增删改 hooks 事件、manifest、路径迁移 | `addHookEvent()`, `migrateHookPaths()` |
| `upgrade.mjs` | 版本号、CHANGELOG、跨版本迁移 | `getVersion()`, `setVersion()` |
| `verify.mjs` | hooks 路径、事件白名单、shell 类型、配对 | `validate(root)` |
| `scaffold.mjs` | install/quickstart/uninstall 文本 | `getInstallSection()` |
| `templates/` | 脚手架模板文件（.tmpl） | 由 init.mjs 和 scaffold.mjs 使用 |

## 约束

- hooks.json 命令**必须**用 `${CLAUDE_PLUGIN_ROOT}` 引用插件内脚本
- 事件名**必须**在 29 个官方事件内（见 hooks.md）
- hook 脚本只支持 `.sh`（bash）

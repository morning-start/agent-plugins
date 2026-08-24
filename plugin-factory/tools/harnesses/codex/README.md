# codex

Codex / ChatGPT 插件 harness。

## 规范文档

| 文档 | 内容 |
|------|------|
| `plugin.md` | 插件格式、.codex-plugin/plugin.json |
| `adapters.md` | 跨 harness 适配规则 |

## 生命周期工具

| 模块 | 职责 | 关键函数 |
|------|------|----------|
| `init.mjs` | 初始化 .codex-plugin/ 目录、复制模板 | `init(target, values)` |
| `update.mjs` | 更新 manifest、增删 hook 引用 | `updateManifest()`, `addHook()` |
| `upgrade.mjs` | 版本管理 | `getVersion()`, `setVersion()` |
| `verify.mjs` | manifest 有效性、hooks 结构、skills 目录 | `validate(root)` |
| `scaffold.mjs` | install/quickstart/uninstall 文本 | `getInstallSection()` |

## 约束

- `.codex-plugin/plugin.json` **必须**存在且是有效 JSON
- hooks 文件**必须**有正确的导出
- 声明的 skills **必须**存在

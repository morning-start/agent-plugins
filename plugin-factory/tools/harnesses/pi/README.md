# pi

pi / oh-my-pi 插件 harness。

## 规范文档

| 文档 | 内容 |
|------|------|
| `plugin.md` | 插件格式、package.json pi/omp section |
| `hooks.md` | TypeScript 扩展事件模型 |
| `adapters.md` | 跨 harness 适配规则 |

## 生命周期工具

| 模块 | 职责 | 关键函数 |
|------|------|----------|
| `init.mjs` | 初始化 .pi/extensions/、复制模板 | `init(target, values)` |
| `update.mjs` | 更新 package.json pi/omp section、增删 skill/extension | `addSkill()`, `addExtension()` |
| `upgrade.mjs` | 版本管理 | `getVersion()`, `setVersion()` |
| `verify.mjs` | package.json pi/omp section、声明的文件存在性 | `validate(root)` |
| `scaffold.mjs` | install/quickstart/uninstall 文本 | `getInstallSection()` |

## 约束

- `package.json` **必须**有 `pi`（或 `omp`）section
- 声明的 skills/extensions **必须**存在
- oh-my-pi 复用 pi 的工具模块，但有独立规范文档

## oh-my-pi

oh-my-pi 与 pi 共享工具，但有独立的 `oh-my-pi/` 目录存放规范文档。

# oh-my-pi

oh-my-pi 插件 harness。复用 pi 的工具模块，独立规范文档。

## 规范文档

| 文档 | 内容 |
|------|------|
| `plugin.md` | 插件格式、package.json omp section |
| `adapters.md` | 跨 harness 适配规则 |

## 工具模块

oh-my-pi **复用** `pi/` 的工具模块（init/update/upgrade/verify/scaffold），
通过 `index.mjs` 中的别名注册。

## 约束

- 与 pi 共享 `package.json`，但使用 `omp` section（而非 `pi`）
- 声明的 skills/extensions **必须**存在
- 依赖 pi 的工具实现，不独立维护

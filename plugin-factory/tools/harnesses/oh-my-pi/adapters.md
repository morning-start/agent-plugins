# oh-my-pi (omp) — 适配速查

规范技能遵循 **Agent Skills 标准**（agentskills.io）。oh-my-pi 是 **Pi 的 fork**，
扩展 API 与 pi 保持兼容——hooks / 技能发现等机制与 pi 相同，见
[`../pi/adapters.md`](../pi/adapters.md) 与 [`../pi/hooks.md`](../pi/hooks.md)。

本文件只记 omp 与 pi 的差异。

## 技能发现

| | oh-my-pi (omp) |
|---|---|
| 项目 | 读取 `package.json` 的 `pi`/`omp` 字段（`extensions[]`/`skills`） |
| 全局 | `~/.omp/agent/skills/` 等（同 pi，按 omp 目录） |

## 打包 / 安装

| | oh-my-pi (omp) |
|---|---|
| Manifest | `package.json` → `pi`/`omp` 字段（`pkg.omp` 优先，`pkg.pi` 回退） |
| 结构 | `skills/` + `.pi/extensions/*.ts`（同一路径，遵循 pi 扩展 API） |
| 安装 | `omp install <source>`（npm/git/本地路径/marketplace 来源）、`-l` 项目级 |

逐字段规格见 [`plugin.md`](plugin.md)。

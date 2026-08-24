---
name: pf-design
description: Use when a signed-off PRD exists for a plugin, when planning which skills, hooks, commands, and rules a plugin needs, when designing skill orchestration (trigger chains, handoffs, entry points), when mapping a plugin to Claude Code/pi/opencode/oh-my-pi manifests, when designing how skills cooperate, when choosing between Chain/Star/Bus/DAG patterns, or when routed from /pf-design.
tags: [pf, pf-design, plugin, design, architecture, manifest, orchestration, compose]
metadata:
  prefix: pf
  lifecycle:
    status: active
    version: 0.2.0
    created: 2026-08-01
    updated: 2026-08-24
  keywords_zh: "插件设计, 构件清单, 架构, 编排设计, 设计文档, 组合模式"
---

# pf-design — 插件标准化设计

## 概述

将 PRD 转化为**标准化构件清单**：
1. **构件规划** — 需要哪些技能、hooks、命令
2. **harness 适配** — 映射到各 harness 的 manifest
3. **编排设计** — 技能间如何协作

## When to Use

- PRD 已签署，复杂度为 Medium 或 Heavy
- 用户运行 `/pf-design`
- 需要设计技能编排（触发链 / 交接 / 入口点）
- 需要适配新 harness

## 设计流程

### 1. 构件规划

从 PRD 提取：
- **技能列表** — 每个技能的职责、触发条件
- **hooks** — 生命周期钩子
- **commands** — 斜杠命令
- **rules** — 行为约束

### 2. harness 适配

为每个目标 harness 设计 manifest：

| harness | manifest 文件 |
|---------|--------------|
| claude-code | `.claude-plugin/plugin.json` |
| opencode | `.opencode/opencode.json` |
| pi | `package.json` pi section |
| oh-my-pi | `package.json` omp section |
| codex | `.codex-plugin/plugin.json` |

### 3. 编排设计

选择编排模式：
- **Chain** — A → B → C（线性流程）
- **Star** — 中心节点分发（入口路由）
- **Bus** — 事件驱动（松耦合）
- **DAG** — 有向无环图（复杂依赖）

设计要素：
- **入口点** — `using-<plugin>` 技能
- **触发链** — 技能间的触发关系
- **交接产物** — 技能间传递的数据
- **冲突避免** — 触发域不重叠

### 4. 生成构件清单

```json
{
  "name": "my-plugin",
  "prefix": "my",
  "skills": [...],
  "hooks": {...},
  "commands": [...],
  "harnesses": ["claude-code", "pi"],
  "orchestration": {
    "entryPoints": [...],
    "chains": [...],
    "handoffs": [...]
  }
}
```

## 标准化要求

1. **每个技能必须有**：
   - frontmatter（name、description）
   - Iron Law / Red Flags / 自检清单

2. **每个 harness 必须有**：
   - 对应的 manifest 文件
   - hooks 使用 `${CLAUDE_PLUGIN_ROOT}`

3. **编排必须有**：
   - 入口技能（`using-<plugin>`）
   - 明确的触发链
   - 交接产物定义

## Iron Law

```
没有构件清单，就不能构建。
```

## Red Flags

- 跳过设计直接构建
- 不考虑 harness 差异
- 编排过于复杂（>5 个入口点）
- 技能职责不清晰

## 自检清单

- [ ] 构件清单完整
- [ ] harness 适配明确
- [ ] 编排模式选择合理
- [ ] 入口技能已规划
- [ ] 交接产物已定义

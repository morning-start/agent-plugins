---
name: using-pf
description: Use when starting any conversation or task with plugin-factory, when deciding whether a request means creating a new plugin, maintaining an existing one, or analyzing one, when routing to the right pf-* scenario, or when a session starts and the user's intent is unclear.
tags: [pf, using-pf, plugin, entry, bootstrap, orchestration, intent]
metadata:
  prefix: pf
  lifecycle:
    status: active
    version: 0.2.0
    created: 2026-08-01
    updated: 2026-08-24
  keywords_zh: "插件入口, 创建插件, 维护插件, 分析插件, 意图路由, 标准化"
  alwaysApply: true
---

# using-pf — 插件标准化入口

## 概述

plugin-factory 的单一入口。核心职责：
1. **意图识别** — 识别用户想要做什么
2. **路由分发** — 分发到正确的 pf-* 技能
3. **标准化引导** — 确保插件符合标准

## When to Use

- 开始任何 plugin-factory 相关对话
- 用户意图不明确：创建新插件？维护现有？分析？
- 会话启动时自动激活

## 意图识别

### 1. 创建新插件

当用户说"创建插件"、"做一个插件"、"我有个插件想法"时：

1. **收集需求**（一次一个问题）：
   - 核心功能：插件做什么？（动词+对象）
   - 目标：可衡量的结果是什么？
   - 场景：3-5 个真实使用场景
   - 用户和触发：谁用？怎么触发？
   - 边界：明确不做什么？
   - 平台：哪些 harness？（Claude Code / pi / opencode）
   - 复杂度：预计技能数量？需要 hooks？

2. **生成 PRD**：一句话描述 + 核心功能 + 目标 + 场景 + 边界

3. **复杂度判断**：
   - Light（1-2 技能，无 hooks）→ 直接到 `pf-build`
   - Medium（3+ 技能或 hooks）→ 先 `pf-design` 再 `pf-build`
   - Heavy（跨场景、复杂编排）→ `pf-design` + `pf-compose`

4. **路由**：
   - Light → `pf-build`
   - Medium/Heavy → `pf-design`

### 2. 维护现有插件

当用户说"改一下"、"加个技能"、"优化"时：

1. **确认变更类型**：
   - 添加技能 → `pf-design` → `pf-build`
   - 修改技能 → `pf-build`
   - 重组技能 → `pf-verify`（生命周期分析）
   - 适配新 harness → `pf-design`（适配器）→ `pf-build`
   - 版本发布 → `pf-build`（版本管理）

2. **路由**：按变更类型分发

### 3. 分析插件

当用户说"分析"、"检查"、"健康检查"时：

- 运行 `pf-verify` 进行标准化校验
- 输出标准化报告

## 路由规则

| 用户意图 | 路由 |
|----------|------|
| 创建新插件（Light） | `pf-build` |
| 创建新插件（Medium/Heavy） | `pf-design` → `pf-build` |
| 添加/修改技能 | `pf-build` |
| 重组/拆分技能 | `pf-verify`（分析）→ `pf-design` → `pf-build` |
| 适配新 harness | `pf-design` → `pf-build` |
| 版本发布 | `pf-build`（版本管理） |
| 校验/检查 | `pf-verify` |
| 问题 | 直接回答 |

## 标准化原则

1. **harness 是一等公民** — 所有适配围绕 harness 展开
2. **规范 + 工具在一起** — 每个 harness 目录包含规范和工具
3. **校验驱动** — 先校验，再修复
4. **版本一致** — 所有 manifest 版本同步

## Iron Law

```
没有标准化校验，就不能发布。
```

## Red Flags

- 跳过意图识别，直接开始实现
- 不校验就发布
- 生成不符合标准的插件
- 忽略 harness 差异

## 自检清单

- [ ] 已识别用户意图（创建/维护/分析）
- [ ] 已路由到正确的 pf-* 技能
- [ ] 已确认复杂度等级
- [ ] 已确认目标 harness

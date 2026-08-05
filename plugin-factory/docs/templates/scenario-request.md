---
name: Scenario request
about: Request a new plugin-factory scenario that current skills (S1–S10) do not cover
title: "[Scenario] <short description>"
labels: scenario-request
assignees: ""
---

> 由 `using-pf` 的 fallback 路径自动引导填写：当用户意图与 S1–S10 均不匹配时，
> 使用本模板提交新场景。填写语言：按本仓库 language 策略（默认 tiered：
> 说明可用中文，agent 执行字段用英文）。

## 1. Scenario description

<!-- 一句话：这个场景要完成什么任务（verb + object）。示例：把已有技能导出为独立插件仓库。 -->

**场景**：

## 2. Trigger conditions

<!-- 用户会怎么说/做什么来触发这个场景？列出 1–5 个典型触发语（中英文都列）。 -->

- EN: e.g. "export my skills as a plugin"
- 中文：例如"把我的技能导出成插件"

## 3. Entry conditions (前置条件)

<!-- 该场景启动前必须成立的条件。示例：已有至少一个技能；目标平台已安装。 -->

- [ ] 前置条件 1
- [ ] 前置条件 2

## 4. Expected deliverables (产出物)

<!-- 场景完成后应该产出什么。示例：独立插件仓库 + AGENTS.md + 安装脚本。 -->

- [ ] 产出物 1
- [ ] 产出物 2

## 5. Workflow expectations

<!-- 期望经过哪些阶段？（新建/变更/设计/构建/验证/发布/生命周期） -->

**期望流程**：<创建 | 变更 | 设计 | 构建 | 验证 | 发布 | 分析>

## 6. Related scenarios

<!-- 与现有 S1–S10 的关系：是现有场景的变体，还是全新场景？ -->

**关系**：<全新 | S# 的变体（说明差异）>

## 7. Acceptance hints

<!-- 怎么做才算完成？1–3 条可验证的验收提示。 -->

- [ ] 验收提示 1

---

<!-- 维护者使用：
- 评估是否为全新场景（6-dimension divergence check，见 references/design-principles.md）。
- 通过后：更新 skills/using-pf/SKILL.md 的路由表（Skill Priority + Trigger Matrix），
  为场景分配 S#，必要时新增 pf-* 子技能。
- 拒绝后：在本 issue 说明原因，并给出替代场景编号。 -->

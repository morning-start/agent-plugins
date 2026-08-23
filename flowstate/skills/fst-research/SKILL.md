---
name: fst-research
description: Use when a project needs investigation or analysis before a decision — tech selection, solution comparison, impact exploration, root-cause investigation, "research X for me", or "compare option A vs B". Runs a research-then-analyze loop: raw findings land in .agent-workplace/research/, the analysis report lands in .agent-workplace/report/. Cross-cutting capability invoked by fst-init / fst-change / fst-iterate / fst-review (not a lifecycle node).
metadata:
  prefix: fst
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-23
    updated: 2026-08-23
  keywords_zh: "调研, 调查, 分析, 研究报告, 技术选型, 方案对比, research, report, 证据"
---

# fst-research — 分析调查（横切能力：调查 → 分析 → 报告）

> 章节骨架与约定见 `references/skill-structure.md`；本技能是**横切能力技能**
> （同 fst-workplace，不占生命周期节点），按需被其他 fst-* 技能调用。

## 职责

承担 flowstate 中「**调查 → 分析 → 报告**」的完整闭环：为决策提供**证据**，
而不是凭印象拍板。**调查缓存**（外部资料、备选方案、对比结论、原始证据）落
`.agent-workplace/research/`；**分析报告**（结论、权衡、建议）落
`.agent-workplace/report/`。调查是分析的前置，分析是决策的输入——本技能只
产出证据与结论，不代替用户做最终决策。

## Iron Law

```
NO RESEARCH, NO ANALYSIS; NO EVIDENCE, NO CONCLUSION
```

- 未先调查（收集资料/方案/证据）→ 不得写分析结论
- 每个结论必须**可溯源到证据**（research/ 中的条目引用），禁止无证据断言
- 未达决策所需置信度 → 显式标记「证据不足 / 待补充调查」，不强行下结论
- 调查与分析分离：原始素材进 `research/`，加工结论进 `report/`，不混放

## Red Flags — STOP and Re-evaluate

- 没看资料就直接给结论（凭经验拍板）
- 结论没有证据引用，或引用指向不存在的 research 条目
- 把原始资料和分析报告混在一个文件里
- 证据冲突时不处理，直接各取所需
- 把「调研缓存」当成正式交付物提交（research/ 属过程态，不提交 git）

**All of these mean: Stop. Research first, cite evidence, then conclude.**

## 停止条件

- 调查问题不明确（不知道要回答什么）→ 先澄清问题范围，不盲目收集
- 所需资料不可得 → 记录「证据缺口」，报告结论标注不确定度
- 用户要的是决策本身而非分析 → 转交对应生命周期技能（如技术选型属
  fst-iterate 的 graph/spec 方略，本技能只提供对比证据）
- 调查成本已超收益 → 停止，向用户说明已获得的证据与缺口

## 执行流程

### 1. 明确调查问题（范围）

把「调研 X」澄清为**可回答的问题**：要支持什么决策、需要什么类型的证据、
交付时限。产出调查目标清单（如：「对比 A/B 方案在性能与维护成本上的差异」）。

### 2. 调查（收集证据，落 research/）

- 收集外部资料（文档、规范、替代实现、社区经验）、代码现状、历史决策
- 条目化存 `.agent-workplace/research/`（如 `{YYYYMMDD}-{type}-{slug}.md`）：
  原始资料、来源、结论要点
- 有冲突的证据 → 并列记录，不隐藏

### 3. 分析（加工结论，落 report/）

对照调查问题逐项分析：对比表、权衡、风险、建议。产出分析报告写
`.agent-workplace/report/`（如 `{YYYYMMDD}-{topic}-report.md`），每个结论
标注所引用的 research 条目。

### 4. 交接（证据 + 结论给调用方）

- 报告结论摘要 + 证据索引交给调用方技能（fst-init / fst-change /
  fst-iterate / fst-review）
- 若用户决定将分析结果提升为正式交付物 → 由调用方按落点规则写入正式
  `docs/`（本技能不直接提交，落点规则见 `fst-workplace`）

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 澄清调查问题、收集资料/证据、存 research/、写分析报告到 report/、标注证据与缺口 |
| **用户** | 确认调查问题范围、提供内部资料/历史背景、做最终决策（本技能不代做） |

## 关联最佳实践

- **工作区落点**（`fst-workplace`）：research/ 与 report/ 属过程态（不提交 git）；
  提升为正式交付物时按落点规则写正式 `docs/`
- **立项调研**（`fst-init` N1）：立项前的技术/需求调研可调用本技能
- **影响探索**（`fst-change` N5）：变更影响评估前的探索现状可调用本技能
- **技术选型/方案对比**（`fst-iterate` N4）：graph/spec 方略内的选型证据由本技能提供
- **根因调查**（`fst-review` N6）：缺陷/灰度指标异常的分析可调用本技能

## 输出

```json
{
  "status": "report_ready | evidence_gap | blocked",
  "question": "对比 A/B 方案在性能与维护成本上的差异",
  "research_entries": ["research/20260823-tech-abc.md", "research/20260823-tech-def.md"],
  "report": "report/20260823-tech-selection-report.md",
  "conclusions": [
    { "conclusion": "方案 A 性能更优但维护成本高", "evidence": ["research/20260823-tech-abc.md#benchmark"] }
  ],
  "evidence_gaps": ["缺少生产环境压测数据"],
  "next": "caller skill (fst-init | fst-change | fst-iterate | fst-review)"
}
```

## 自检清单

- [ ] 调查问题已澄清（可回答、明确决策依赖）
- [ ] 已先调查后分析——分析报告在调查完成之后写
- [ ] research/ 有条目化证据（含来源），report/ 有分析报告，未混放
- [ ] 每个结论可溯源到 research 条目；证据冲突已并列记录
- [ ] 证据不足处已标「证据缺口」，未强行下结论
- [ ] research/ 与 report/ 未提交 git（过程态）；正式交付走调用方落点规则

## 下一步

报告就绪 → 把结论摘要 + 证据索引交给调用方技能继续生命周期流转：
立项调研 → fst-init；影响探索 → fst-change；选型证据 → fst-iterate；
根因分析 → fst-review。若调用方即用户独立调研请求，报告交付即完成。

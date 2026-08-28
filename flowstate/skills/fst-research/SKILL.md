---
name: fst-research
description: Use when a project needs investigation or analysis before a decision — tech selection, solution comparison, impact exploration, root-cause investigation, "research X for me", or "compare option A vs B". Runs a research-then-analyze loop: raw findings and analysis reports land in .agent-workplace/iterations/current/investigation/. Cross-cutting capability invoked by fst-init / fst-change / fst-iterate / fst-review (not a lifecycle node).
metadata:
  prefix: fst
  lifecycle:
    status: active
    version: 0.3.0
    created: 2026-08-23
    updated: 2026-08-28
  keywords_zh: "调研, 调查, 分析, 研究报告, 技术选型, 方案对比, research, report, 证据"

  tests: [tests/skill-contracts.test.mjs]
  role: capability
  layer: cross-cutting
  invokes: [fst-workplace]
  handoffs_to: [caller]

  handoffs_from: [fst-init, fst-change, fst-iterate, fst-review]
  owns: [evidence, analysis]
---

# fst-research — 分析调查（横切能力：调查 → 分析 → 报告）

> 章节骨架与约定见 `references/skill-structure.md`；本技能是**横切能力技能**
> （同 fst-workplace，不占生命周期节点），按需被其他 fst-* 技能调用。
> **落点规则见 `fst-workplace`**，本技能只定义调查方法，不重复工作区规范。

## 职责

承担 flowstate 中「**调查 → 分析 → 报告**」的完整闭环：为决策提供**证据**，
而不是凭印象拍板。**调查缓存**（外部资料、备选方案、对比结论、原始证据）与
**分析报告**（结论、权衡、建议）统一落在当前迭代的 `investigation/` 目录。
调查是分析的前置，分析是决策的输入——本技能只产出证据与结论，不代替用户做最终决策。

## 落点（引用 fst-workplace）

| 产物 | 落点 | 提交? |
|------|------|-------|
| 调查缓存（原始资料、备选方案、对比结论） | `iterations/current/investigation/raw/` | ❌ |
| 对比分析 | `iterations/current/investigation/comparisons/` | ❌ |
| 冲突观点记录 | `iterations/current/investigation/contradictions/` | ❌ |
| 事实核查记录 | `iterations/current/investigation/fact-checks.md` | ❌ |
| 分析报告 | `iterations/current/investigation/{YYYYMMDD}-{topic}-report.md` | ❌ |
| 调研定稿（需留档） | 正式 `docs/`（经 `fst-promote` 提升） | ✅ |

## Iron Law

```
NO RESEARCH, NO ANALYSIS; NO EVIDENCE, NO CONCLUSION
```

- 未先调查（收集资料/方案/证据）→ 不得写分析结论
- 每个结论必须**可溯源到证据**（investigation/ 中的条目引用），禁止无证据断言
- 未达决策所需置信度 → 显式标记「证据不足 / 待补充调查」，不强行下结论
- 调查与分析分离：原始素材进 `raw/`，对比分析进 `comparisons/`，加工结论按主题命名

## Red Flags — STOP and Re-evaluate

- 没看资料就直接给结论（凭经验拍板）
- 结论没有证据引用，或引用指向不存在的 investigation 条目
- 把原始资料和分析报告混在一个文件里
- 证据冲突时不处理，直接各取所需
- 把「调研缓存」当成正式交付物提交（investigation/ 属过程态，不提交 git）

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

### 2. 选择调研模板（可选）

根据调研类型选择合适的模板（见 `templates/research-templates.md`）：

| 调研类型 | 模板 | 适用场景 |
|---------|------|---------|
| 技术选型 | `tech-selection` | 对比多个技术方案 |
| 竞品分析 | `competitor-analysis` | 分析竞争对手产品 |
| 需求调研 | `requirement-research` | 收集和分析用户需求 |
| 影响评估 | `impact-assessment` | 评估变更的影响 |
| 根因分析 | `root-cause-analysis` | 分析问题根本原因 |

### 3. 调查（收集证据，落 investigation/）

- 收集外部资料（文档、规范、替代实现、社区经验）、代码现状、历史决策
- 条目化存 `iterations/current/investigation/` 下对应子目录：
  - 原始资料 → `raw/{YYYYMMDD}-{type}-{slug}.md`
  - 对比分析 → `comparisons/{YYYYMMDD}-{type}-{slug}.md`
  - 冲突观点 → `contradictions/{YYYYMMDD}-{type}-{slug}.md`
  - 事实核查 → `fact-checks.md`（追加记录）
- 有冲突的证据 → 并列记录，不隐藏
- **验证证据有效性**：检查 URL 可访问性、PDF 完整性等

### 4. 分析（加工结论，落 investigation/）

对照调查问题逐项分析：对比表、权衡、风险、建议。产出分析报告写
`iterations/current/investigation/{YYYYMMDD}-{topic}-report.md`，
每个结论标注所引用的 evidence 条目。

### 5. 交接（证据 + 结论给调用方）

- 报告结论摘要 + 证据索引交给调用方技能（fst-init / fst-change /
  fst-iterate / fst-review）
- 若用户决定将分析结果提升为正式交付物 → 由调用方通过 `fst-promote` 提升
  （本技能不直接提交，落点规则见 `fst-workplace`）

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 澄清调查问题、收集资料/证据、存 investigation/、写分析报告、标注证据与缺口 |
| **用户** | 确认调查问题范围、提供内部资料/历史背景、做最终决策（本技能不代做） |

## 关联最佳实践

- **工作区落点**（`fst-workplace`）：investigation/ 属过程态（不提交 git）；
  提升为正式交付物时按落点规则写正式 `docs/`
- **调研模板**（`templates/research-templates.md`）：5 种调研场景模板
- **立项调研**（`fst-init` N1）：立项前的技术/需求调研可调用本技能
- **影响探索**（`fst-change` N5）：变更影响评估前的探索现状可调用本技能
- **技术选型/方案对比**（`fst-iterate` N4）：graph/spec 方略内的选型证据由本技能提供
- **根因调查**（`fst-review` N6）：缺陷/灰度指标异常的分析可调用本技能

## 输出

```json
{
  "status": "report_ready | evidence_gap | blocked",
  "question": "对比 A/B 方案在性能与维护成本上的差异",
  "investigation_dir": "iterations/current/investigation/",
  "research_entries": [
    "iterations/current/investigation/raw/20260823-tech-abc.md",
    "iterations/current/investigation/raw/20260823-tech-def.md"
  ],
  "report": "iterations/current/investigation/20260823-tech-selection-report.md",
  "conclusions": [
    { "conclusion": "方案 A 性能更优但维护成本高", "evidence": ["raw/20260823-tech-abc.md#benchmark"] }
  ],
  "evidence_gaps": ["缺少生产环境压测数据"],
  "next": "caller skill (fst-init | fst-change | fst-iterate | fst-review)"
}
```

## 自检清单

- [ ] 调查问题已澄清（可回答、明确决策依赖）
- [ ] 已先调查后分析——分析报告在调查完成之后写
- [ ] investigation/ 有条目化证据（含来源），分析报告按主题命名，未混放
- [ ] 每个结论可溯源到 evidence 条目；证据冲突已并列记录
- [ ] 证据不足处已标「证据缺口」，未强行下结论
- [ ] investigation/ 未提交 git（过程态）；正式交付走 `fst-promote` 提升

## 下一步

报告就绪 → 把结论摘要 + 证据索引交给调用方技能继续生命周期流转：
立项调研 → fst-init；影响探索 → fst-change；选型证据 → fst-iterate；
根因分析 → fst-review。若调用方即用户独立调研请求，报告交付即完成。

# 插件优化方法论（Plugin Optimization Playbook）

> **固化于：2026-08-23** · 沉淀自 flowstate 插件实战优化（session-start 钩子 JSON
> 回归、opencode 技能发现断裂、六技能契约测试补齐、路由表面防漂移）。
> **规则**：优化现有插件（含生成的插件与本仓库自身）遵循本文；结构探针见
> `skills/pf-lifecycle/SKILL.md`，审计门禁见 `skills/pf-verify/SKILL.md`，
> 设计期职责边界纪律见 `references/skill-boundaries.md`。

## 为什么存在

插件发布后进入维护期，最常见的失败不是"缺功能"，而是**宣称的能力悄悄坏掉**：
钩子输出的 JSON 非法、某个端的技能发现路径为空、文档声称的产物不在磁盘上。
这些问题结构探针查不出（文件都在、命名都对），只有**执行真实产物并核对声明**
才能暴露。本文收敛一套经过实战验证的优化流程，避免每次重新踩坑。

## 核心原则

1. **审计先行——findings 驱动，不凭直觉动手。**
   动手前先跑全部可执行门禁，把输出汇总成按严重度排序的工作清单：

   ```bash
   npm test                                                  # 现有测试基线
   node tools/verify/verify.mjs structure --root <dir> --coverage=FAIL   # 结构 + 覆盖门禁
   node tools/verify/verify.mjs lifecycle --root <dir>            # 编排健康探针
   node tools/design/check-dependencies.mjs --root <dir>          # 危险依赖
   node tools/release/release-check.mjs --root <dir>               # 发布管线是否走得通
   ```

   门禁崩溃本身就是 finding（如 `.version-bump.json` 缺失导致 release-check
   ENOENT）——流程走不通与产出错误同级对待。

2. **P0/P1/P2 分级修复。**

   | 级别 | 判定 | 实例 |
   |------|------|------|
   | **P0 真实缺陷** | 宣称的能力实际是坏的 | 钩子输出非法 JSON；INSTALL.md 声称已预复制技能但目录不存在；bootstrap 注入的路由链在目标端断裂 |
   | **P1 管线缺口** | 开发/发布流程走不通 | release-check 崩溃；改动后版本未推进；pre-commit 门禁存在但从未接线 |
   | **P2 一致性债务** | 双头维护与过期引用 | 命令复述技能正文（architecture 约定 commands 是薄入口）；文档仍写"待落地"但早已落地 |

3. **每个修复必须固化为防回归测试。** 否则下一次改动会原样再踩。测试只测
   **可观察契约**——输出可被机器解析、两张表逐项一致、副本与权威源零差异——
   绝不测措辞（短语级断言仅用于锁定 Iron Law / 职责边界等契约性文字）。
   平台差异（Windows 上 bash 解析到 WSL 等）用测试的显式 skip 条件表达，
   并注明原因；被跳过的变体须另行手动验证一次并记录证据。

4. **单一权威 + 引用。** 概念、路由表、工作区规则各只有一个权威位置；
   其余表面（README、bootstrap 提示语、命令）要么渲染自权威，要么被
   drift 测试锁死与权威一致。命令是薄入口，不得长出独立流程。

5. **收尾三连。** `npm test` 全绿 → verify 门禁（`--coverage=FAIL`）无
   findings → `git diff` 范围审查确认未越出目标插件边界。然后 SemVer bump +
   CHANGELOG（每次变更以 release 收尾，见 using-pf S9）。

## 五类高价值优化点（实战清单）

| # | 优化点 | 典型信号 | 动作 |
|---|--------|---------|------|
| 1 | **基础设施输出合法性** | 钩子/bootstrap 的 stdout 无法 `JSON.parse`；多行 Markdown 直接嵌入 JSON 字符串字面量 | 按 backslash → 双引号 → 控制字符（\r \n \t）的顺序做完整转义；新增**执行真实脚本并解析其输出**的回归测试（bash 与 PowerShell 变体都测） |
| 2 | **端产物与声明一致** | INSTALL/README 宣称的目录不存在；某端技能发现路径为空而其他端正常 | 先补齐产物（预复制/渲染），或改文档承认手工步骤；加 **parity 测试**逐项断言"声明 ↔ 磁盘"，副本内容与权威源做相等比较 |
| 3 | **技能契约测试缺失** | `--coverage=FAIL` 下全部 active 技能报 `test-coverage`；`metadata.tests` 为空 | 写表格驱动的契约测试：每技能列 3–6 个关键契约短语（Iron Law 句式、交接信号、独占声明）；frontmatter 加 `tests:` 声明使覆盖门禁可用 |
| 4 | **路由表面漂移** | 入口技能、README 技能表、bootstrap 提示语、命令各自维护一份场景→技能映射 | 以入口技能（`using-<plugin>`）为权威；drift 测试断言其余表面与权威一致；另测 command↔SKILL.md 映射完整性（每个命令引用的技能文件存在） |
| 5 | **文档/版本滞后** | 导航中残留"待生成/待落地"；多处 manifest 版本停在旧值而功能已变更 | 过期标记当场更新；按 pf-version 从 git history 决定 bump 并写 CHANGELOG |

## 修复纪律

- **测试先行于修复**：先写暴露缺陷的失败测试（红），修复后看它转绿——
  这同时证明缺陷真实存在且修复有效。
- **不扩职责**：优化不得改变插件的场景边界（铁律 5）；过程中发现的越界诉求
  记录到需求池或另立插件，不顺手实现。
- **批量限制**：每批 ≤5 个任务，批末跑 verify + commit 检查点后再继续
  （沿用 AGENTS.md Batch limit 约定）。
- **诚实报告**：被 skip 的测试、未运行的评测必须显式说明，绝不暗示通过。

## 自查清单（优化一轮结束时逐条过）

- [ ] 全部可执行门禁已跑过，输出成为排序后的工作清单（而非凭印象挑问题）
- [ ] 每个 P0/P1 修复有对应的先红后绿回归测试
- [ ] 权威位置唯一；所有复制/引用它的表面被 drift 或 parity 测试锁定
- [ ] `npm test` + verify 门禁全绿；diff 未越出目标插件范围
- [ ] 版本已 bump、CHANGELOG 已记录本轮驱动变更的动作

## 关联

- `references/skill-boundaries.md`（设计期职责边界纪律——本文是运行期/维护期对偶）
- `tools/verify/README.md`（纯结构探针与 v2 运行时信号路线图）
- `skills/pf-lifecycle/SKILL.md`（拆分/合并/重组/退役决策流）
- `skills/pf-verify/SKILL.md`（审计门禁与 `--coverage` 用法）
- `skills/pf-version/SKILL.md`（SemVer 与 CHANGELOG）

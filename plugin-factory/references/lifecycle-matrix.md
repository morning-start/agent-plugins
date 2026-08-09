# 生命周期决策矩阵

**范围（v1）：纯结构分析**——不读运行时使用数据、无遥测。输入只有 agent 能直接
读取的文件与元数据。运行时信号（触发频率、评测通过率随时间变化）暂缓，矩阵中
注明它们会如何改进建议。

skill-creator 覆盖**单技能**的 创建→测试→迭代 循环。plugin-factory 覆盖
skill-creator 未覆盖的**多技能/插件级**生命周期：拆分、合并、重组、移植、退役、
版本演进。

**位置**：分析不是线性流程的末端——它是运行期循环的驱动器（见
`references/orchestration-patterns.md` § 插件生命周期场景）：任何时刻可跑
/pf-analyze，建议经统一入口 `using-pf` 路由到维护场景（S4 重组 / S5 单技能退役 /
S7 编排优化）。**单技能退役属于维护（S5）**，与插件整体停止维护（范围外）不同。

## 信号 → 建议

> **去重（2026-08-09）**：信号→建议决策表已在 `skills/pf-lifecycle/SKILL.md`
> 的 "Executable probes" 章节内嵌（热，执行时直接查）；本文件保留冷知识部分。

| 信号（纯结构） | 探针（`scripts/verify.mjs lifecycle`） | 严重度 | 如何度量 | 建议 |
|--------------------------|----------------|---------|----------------|----------------|
| 链路断裂 | `broken-handoff` | FAIL | 技能 body 的 route/handoff/next 引用不存在的技能 | **修复编排**（重新链接 / 重排） |
| 孤儿技能 | `orphan-skill` | WARN | 从任何入口/链均不可达（入口存在时） | **重组**：补入口链接，或合并 |
| 入口缺失 | `missing-entry-skill` | FAIL | 项目声明 `using-<plugin>` 路径但无入口技能 | **新增** `using-<plugin>` 入口技能 |

完整信号表（lifecycle-status / skill-too-large / trigger-overlap /
repeated-guidance / nested-skill-tree / harness-gap / zombie-skill /
name-collision / version-drift 等）见 `skills/pf-lifecycle/SKILL.md` § Executable
probes。编排健康探针（链路断裂 / 孤儿技能 / 入口缺失）遵循
`references/orchestration-patterns.md` 中的模式，已在 T2 落地为
`verify.mjs lifecycle`（`npm run lifecycle`；`--format json` 输出机器可读 findings）。

## 决策流程

1. **分析** — `pf-lifecycle` 对目标插件/技能集（自身仓库或生成产物）运行上述结构探针。
2. **建议** — 产出 {技能, 信号, 严重度, 动作, 影响} 表，按严重度排序。
3. **确认** — 用户逐条批准（关键决策）。
4. **执行** — 批准的动走 `pf-design` / `pf-build` / `pf-verify`——不得绕过质量栏。

## 演进（v1 → v2）

版本按 SemVer；每次发布在 CHANGELOG 记录驱动本次变更的生命周期动作
（拆分/合并/重组/移植/退役）。插件自身也要 dogfood：`pf-*` 技能可用同一矩阵
拆分/重组（见 M4）。

## 未来信号（v1 范围外）→ v2 roadmap

触发频率、评测通过率、用户反馈主题、安装数。这些信号就位后，会把建议从
"结构怀疑"升级为"证据"。**v2 规划如下**（每条信号 = 一个探针 + 数据源 +
建议升级方式）：

| v2 信号 | 探针 | 数据源 | 建议升级 |
|---------|------|--------|----------|
| 触发频率 | `trigger-frequency` | 各 harness 的会话/调用日志（session-start 钩子计数） | 长期零触发的技能从 WARN 升级为**退役**候选；高频技能优先**拆分**/优化 |
| 评测通过率 | `eval-pass-rate` | `evals/evals.json`（每个技能的评测用例 + 通过率） | 通过率持续 < 阈值（如 70%）的技能升级为 **重写/重组**（走 skill-creator TDD 循环）；回归信号阻断发布 |
| 用户反馈主题聚类 | `feedback-themes` | 收集的 issue/反馈文本，按主题聚类（如"难触发""输出错误"） | 聚类到具体技能后，把对应信号从 INFO/WARN 升级为 FAIL 级行动项 |
| 安装数统计 | `install-count` | 下载/安装计数（npm/registry 或仓库 release 统计） | 低安装 + 结构不佳 → **退役/合并**；高安装但结构恶化 → **优先重组** |

实施顺序（v2 里程碑）：

1. **v2.0** — `trigger-frequency` + `install-count`（纯计数探针，接现有
   `verify.mjs lifecycle` 管道，`--format json` 输出不变）。
2. **v2.1** — `eval-pass-rate`：读取 `evals/evals.json`，与 `pf-verify` 的测试
   覆盖检查联动（见 pf-verify VFY-2）。
3. **v2.2** — `feedback-themes`：主题聚类接入 `pf-analyze` 报告。

v1 承诺边界：**不得在 v1 假装运行这些探针**——信号数据源未接齐前，探针要么
跳过（输出 `INFO: 信号未启用`）要么由用户显式提供数据文件。建议在 v1 仅标注
"结构怀疑"，绝不冒充证据。

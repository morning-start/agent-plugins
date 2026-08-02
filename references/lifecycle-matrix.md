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

| 信号（纯结构） | 探针（`scripts/verify.mjs lifecycle`） | 严重度 | 如何度量 | 建议 |
|--------------------------|----------------|---------|----------------|----------------|
| 生命周期状态缺失 | `lifecycle-status` | WARN | 技能 frontmatter 无 `metadata.lifecycle` 字段，或 `status` 不是 active/deprecated/retired | **补充**生命周期元数据（status/version/created/updated） |
| 技能退役/弃用 | `lifecycle-status` | INFO | `lifecycle.status` 为 deprecated 或 retired | **清理**：退役技能应安排移除，弃用技能应标注替代方案 |
| 技能过大（重+厚） | `skill-too-large` | WARN | 行数 > ~300、标题层级 > 3 | **拆分**为聚焦技能，或**重组**：抽取 `references/` |
| 触发域重叠 | `trigger-overlap` | WARN（完全重叠 FAIL） | 归一化关键词 Jaccard ≥ 0.85；完全相同 → FAIL | **合并**为一个技能；保留场景并集 |
| 内容耦合 / 指导重复 | `repeated-guidance` | WARN | 同一 `##` 标题在 ≥3 个技能中重复 | **重组**：抽取共享 `references/` |
| 层级过深 | `nested-skill-tree` | WARN | 嵌套 `skills/` 深度 > 2 | **扁平化** / 重组为平铺命名空间 |
| 多端缺口 | `harness-gap` | WARN | 宣称 opencode 但无 `.opencode/skills/`（或 `.agents/skills/`） | **移植**（按适配器渲染，见 agent-adapters.md） |
| 僵尸技能 | `zombie-skill` | WARN | 无触发式 description 且无支持文件（references/tests/assets） | **退役**或**演进**（v2 重写） |
| 命名冲突 | `name-collision` | FAIL | 技能名跨位置重复（>1 处） | **改名**，加项目前缀 |
| 版本漂移 | `version-drift` | WARN | package.json / plugin.json / 技能 metadata 版本不一致 | **对齐**版本（单一事实来源） |
| 链路断裂 | `broken-handoff` | FAIL | 技能 body 的 route/handoff/next 引用不存在的技能 | **修复编排**（重新链接 / 重排） |
| 孤儿技能 | `orphan-skill` | WARN | 从任何入口/链均不可达（入口存在时） | **重组**：补入口链接，或合并 |
| 入口缺失 | `missing-entry-skill` | FAIL | 项目声明 `using-<plugin>` 路径但无入口技能 | **新增** `using-<plugin>` 入口技能 |

编排健康探针（链路断裂 / 孤儿技能 / 入口缺失）遵循
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

## 未来信号（v1 范围外）

触发频率、评测通过率、用户反馈主题、安装数。这些信号就位后，会把建议从
"结构怀疑"升级为"证据"。

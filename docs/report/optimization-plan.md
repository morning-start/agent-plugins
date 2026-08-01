# plugin-factory 优化规划

> 依据：`docs/report/superpowers-analysis.md`、`docs/report/ecc-analysis.md`（2026-08-01）
> 原则：**复制机制，不复制内容**；不动现有架构（单一入口 + 场景化生命周期 + 语言
> 分层 + 多端固化）；ECC 的 281 技能逐端副本模式不学；技能内容由 skill-creator 按需创作。

## 一、优化项合成（两报告去重合并）

| # | 优化项 | 来源 | 优先级 |
|---|--------|------|--------|
| O1 | **契约文档化**：`plugins/claude-code.md` 吸收 ECC 的 PLUGIN_SCHEMA_NOTES 实测约束（`version` 必填、`skills`/`commands`/`hooks` 必须数组、agent `tools` 用标量），消除 ⚠️ | ECC ② | 高 |
| O2 | **引导强制力**：`using-pf` 加 `<EXTREMELY-IMPORTANT>` 强约束块 + Red Flags 自我合理化拆穿表（"先检查技能再响应"） | SP ① | 高 |
| O3 | **发布叙事**：`pf-release` CHANGELOG 条目 = 加粗结论 + 问题→根因→方案→eval 证据 | SP ⑦ | 高 |
| O4 | **版本工程机械化**：实现 `scripts/bump-version.sh` + `.version-bump.json`（`--check` 漂移检测 / `--audit` 全仓审计），pf-release 接入 | SP ⑥ + ECC ⑥ | 高 |
| O5 | **工具映射层**：pf-build 生成 `<plugin>/references/<harness>-tools.md`；技能写作纪律改为"动作词汇、不点名工具" | SP ④ | 高 |
| O6 | **hooks 渲染增强**：端间适配器（Cursor→Claude 式 JSON 转换，共享脚本）+ profile 档位开关（minimal/standard/strict + 禁用列表）+ 逐端幂等注入（注入完整 `using-<plugin>`） | SP ② + ECC ①⑤ | 中 |
| O7 | **技能分档 + 选择性安装**：生成 manifest 带安装档位；技能按复杂度分 DAILY/LIBRARY 防膨胀 | ECC ③④ | 中 |
| O8 | **打包门禁 + 发布安全**：pf-release 加"工作区干净才可发布"；README 加"官方渠道唯一"警示 | SP ⑧ + ECC ⑦ | 中 |
| O9 | **每端验收场景**：pf-verify 加"干净会话自动触发"标准（生成插件后必须跑一次验证） | SP ③ | 中（M4） |
| O10 | **evals 行为评测分层**：接 skill-creator A/B 评测，与结构审计（validate 脚本）分层 | SP ⑤ | 中（M4） |

## 二、分阶段计划

### 阶段 A — 快速吸收（M1 收尾 · O1–O4 · 低投入高收益，无前置依赖）

| 步骤 | 内容 | 验收 |
|------|------|------|
| A1 | O1：`references/plugins/claude-code.md` 补契约约束章节 + 更新 `plugins-reference.md` 缺口清单 | 文档无 ⚠️；校验脚本可加"manifest 数组字段"检查 |
| A2 | O2：强化 `skills/using-pf/SKILL.md`（EXTREMELY-IMPORTANT + Red Flags 表 + 路由理由表） | 引导技能含强制约束块，validate 通过 |
| A3 | O3：`commands/pf-release.md` CHANGELOG 规则更新（结论+问题→根因→方案→证据） | 命令文档体现新叙事 |
| A4 | O4：新增 `scripts/bump-version.sh` + `.version-bump.json`（声明清单），pf-release 调用 `--check`/`--audit` | `bump-version.sh --check` 全 manifest 一致；漂移可检出 |

### 阶段 B — 生成器增强（M2 及之后 · O5–O8 · 依赖 hooks/plugins 固化与阶段 A）

| 步骤 | 内容 | 验收 |
|------|------|------|
| B1 | O5：pf-design/pf-build 加入"动作词汇 + 逐端工具映射"生成规则；模板含 `<harness>-tools.md` | 生成的插件带工具映射文件 |
| B2 | O6：hooks 模板/渲染加适配器层与 profile 档位；引导注入内容 = 完整引导技能 + 逐端幂等守卫 | 生成的 hooks 可裁剪（档位开关）、注入幂等 |
| B3 | O7：生成 manifest 带安装档位；技能按复杂度分档（DAILY/LIBRARY） | 大插件安装可选档位 |
| B4 | O8：发布门禁（dirty worktree 拒绝）+ README 安全警示 | pf-release 在脏工作区拒绝发布 |

### 阶段 C — 质量闭环（M3/M4 · O9–O10 + 既有 M3 引擎）

| 步骤 | 内容 | 验收 |
|------|------|------|
| C1 | O9：每端验收场景——生成插件后在干净会话验证自动触发 | 验收测试通过 |
| C2 | O10：evals 行为评测（skill-creator A/B），与结构审计分层 | 一次完整 dogfood（生成→安装→自动触发→评测） |
| C3 | 既有 M3：生命周期探针引擎（链路断裂/孤儿技能/入口缺失）实现 | 探针脚本可跑出建议 |

## 三、依赖与顺序

```
A（无依赖，立即可做）
 └→ B（依赖 A1 契约更新 + 已有固化）
     └→ C（依赖 B 完成 + skill-creator 已装 + dogfood 决策）
```

- 阶段 A 全部工作项可在现有 M1 产物上直接落地；
- 阶段 B 与 M2（pi/opencode/omp 适配器）可并行推进；
- 阶段 C 需要先定 dogfood 示例插件（默认候选：git-release 发布助手）。

## 四、不做清单（明确排除）

- ECC 的 11+ 语言 README、94 个 legacy shims、67 agents 模式；
- ECC 的 281 技能逐端副本路线（内容端无关是我们已选的正确路线）；
- 复制 superpowers 的技能内容（技能由 skill-creator 按需创作）；
- 引入新入口命令（保持 using-pf 单一入口）。

## 五、后续演进（与"编排更细分支"诉求衔接）

阶段 B/C 的产物（工具映射、hook 档位、技能分档）本身就是编排元数据的扩展点——
后续你细化流程分支时，改动集中在 `orchestration-patterns.md` 场景表与构件清单的
`orchestration` 段，不动流程主干。

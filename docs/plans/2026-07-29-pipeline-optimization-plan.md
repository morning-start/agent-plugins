# Plan: 管线优化 — 设计回溯 + 性能优化 + 重构循环

**日期**: 2026-07-29
**需求文档**: `docs/requirements-pipeline-optimization.md`
**核心变更**: 契约修改（设计回溯）+ 新增 2 个 skill（perform、refactor）

## 文件结构规划

### 新建文件（2）

```
skills/perform/SKILL.md           # 性能优化技能
skills/refactor/SKILL.md          # 重构技能
```

### 修改文件（15）

```
skills/plan/SKILL.md              # 新增"设计回溯"章节
skills/implement/SKILL.md         # 停止条件升级为设计回溯触发条件
skills/using-moonbit-skills/SKILL.md  # 路由表、Trigger Matrix、Available Skills、Pipeline
skills/code-review/SKILL.md       # 审查清单新增 perform/refactor 产出
skills/verify/SKILL.md            # S3 引用 perform，回落链新增 perform/refactor
skills/learn/SKILL.md             # 归类表新增 perf-pitfall、refactor-pitfall
skills/writing-plans/SKILL.md     # 任务结构引用 perform/refactor 可选阶段
AGENTS.md                         # 不变量 10→12，技能职责边界表
CLAUDE.md                         # 同 AGENTS.md
GEMINI.md                         # 检查同步
references/orchestration.md       # 管线图、技能全景、依赖关系图、回落链
README.md                         # 10→12，新增 perform/refactor 章节，工作流图
evals/evals.json                  # 新增评估场景
assets/readme/hero.svg            # "10 个" → "12 个"
assets/readme/section-skills.svg  # 技能列表新增 perform、refactor
assets/readme/workflow.svg        # 工作流图新增 perform、refactor、设计回溯
```

### 无需修改

- 8 个平台 plugin.json（不列具体 skill 名）
- `.opencode/opencode.json`、`.pi/extensions/moonbit-skills.ts`、`.gemini/settings.json`、`gemini-extension.json`
- `hooks/*`（不涉及 skill 路由）
- `references/patterns/performance.md`（已被 perform SKILL.md 引用，内容不变）

---

## 任务拆解

### Task 1: 创建 skills/perform/SKILL.md

**文件:**
- Create: `skills/perform/SKILL.md`

**接口:**
- 消费: `references/patterns/performance.md`（性能测量手段和原则）
- 产出: 性能优化技能定义
- 契约: 为 verify S3 提供性能基线；为 implement 提供性能边界（不改变功能行为）

**内容大纲:**

```markdown
---
name: moonbit-perform
description: "Use when optimizing performance, benchmarking, or analyzing bottlenecks — after implementation is functionally correct. Triggered by 'optimize performance', 'benchmark', 'profile', '性能优化', '性能瓶颈', '测量', '基线对比'. Do NOT use for functional implementation."
---

# Perform — 性能优化

## 职责

性能测量、瓶颈分析、优化实现、回归验证。**独立迭代循环，不改变功能行为，只改变性能特性。**

## The Iron Law

\`\`\`
NO OPTIMIZATION WITHOUT MEASUREMENT
\`\`\`

所有优化决策必须有测量数据支撑。无基线的优化无法验证，是噪声。

### 可机械化自检
- [ ] 已建立性能基线（before 测量值）
- [ ] 已定位具体瓶颈（不是"感觉慢"）
- [ ] 优化方案有数据支撑（不是凭直觉）
- [ ] 优化后有对比测量（after vs before）
- [ ] 功能测试仍全绿（无回归）

## Red Flags — STOP and Re-evaluate

- 无测量数据就"优化"（"这段代码看起来慢"）
- 单次测量（受系统噪声影响）
- 微基准神话（隔离环境的"快 3 倍"）
- 优化不可观察行为（编译器已自动处理的代码）
- 优化引入功能回归（越过边界到 implement）
- WASM 性能比较作为 native 依据

## 停止条件

- 性能目标达成（对比基线有可测量改进）→ 进入 verify 确认无回归
- 优化无收益（多次迭代后无改善）→ 报告瓶颈性质，建议接受现状或回到 plan
- 瓶颈是架构问题（局部优化无效）→ 触发设计回溯，回到 plan
- 优化引入功能回归 → 立即回滚，回到 implement 修复功能

## 性能优化循环

\`\`\`
┌─ MEASURE:    建立基线 → moon test -f "bench_" / time moon run .
│              （消费 references/patterns/performance.md 的测量手段）
├─ ANALYZE:    定位瓶颈 → 内联计时 + inspect! 输出中间状态
├─ OPTIMIZE:   改进实现 → 修改代码（不改变功能行为）
├─ RE-MEASURE: 对比验证 → diff before.txt after.txt
└─ 循环:       有改进 → 继续；无改进 → 停止条件
\`\`\`

## 测量手段（摘要）

详见 [`references/patterns/performance.md`](../../references/patterns/performance.md)。

| 手段 | 粒度 | 适用场景 |
|---|---|---|
| 系统级计时（time moon run .） | 粗 | 端到端耗时 |
| moon test -v | 中 | 测试级耗时分布 |
| 内联计时（@time.now()） | 细 | 阶段级耗时 |
| inspect! 输出 | 精细 | 集合大小、分配计数 |

## MoonBit 性能注意事项（摘要）

详见 [`references/patterns/performance.md`](../../references/patterns/performance.md)。

- 值类型 vs 引用类型：struct 值语义，enum/String/Array/Map 引用类型
- 闭包捕获引入隐式堆分配，热路径慎用
- String 拼接是常见瓶颈，大量拼接用 StringBuilder
- 错误处理无栈展开开销，但避免热循环频繁构造 Result::Err

## 与 implement 的契约

- perform 在 implement 之后（功能正确为前提）
- perform 不改变功能行为，只改变性能特性
- perform 修改的代码需通过 testing 产出的测试确认无回归
- 若优化需改变 API → 触发设计回溯，回到 plan

## 与 verify 的契约

- perform 产出的优化需通过 verify 确认无回归
- verify S3 提供粗粒度性能信号（测试执行时间）
- perform 的 bench 基线不纳入硬性门禁（避免环境噪声误报）

## 与 code-review 的契约

- perform 产出的变更由 code-review 审查性能改进有效性
- code-review 检查是否有"过早优化"反模式

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| Agent | 建立基线、定位瓶颈、实施优化、对比验证 |
| 用户 | 确认性能目标、判断优化收益是否值得、决定是否接受架构变更 |

## 输出

\`\`\`json
{
  "status": "optimized | no_gain | blocked",
  "baseline": { "scenario": "bench_sort", "before_ms": 120 },
  "after": { "scenario": "bench_sort", "after_ms": 85 },
  "improvement": "29%",
  "bottleneck": "String 拼接在循环中",
  "optimization": "改用 StringBuilder",
  "regression": false,
  "next": "verify | plan | implement"
}
\`\`\`

## 错误恢复

| 问题 | 诊断 | 修复 |
|---|---|---|
| 无测量数据 | 跳过 MEASURE 阶段 | 回到 MEASURE，建立基线 |
| 单次测量噪声大 | 只测一次 | 至少 5-10 次取最小值 |
| 微基准不反映真实 | 隔离环境测得"快 3 倍" | 结合实际场景验证 |
| 优化无收益 | 多次迭代后无改善 | 报告瓶颈性质，建议接受或回到 plan |
| 瓶颈是架构问题 | 局部优化无效 | 触发设计回溯，回到 plan |
| 优化引入回归 | 功能测试失败 | 立即回滚，回到 implement 修复 |

## 下一步

性能优化完成后，进入 `moonbit-verify` 确认无回归。若瓶颈是架构问题，触发设计回溯回到 `moonbit-plan`。
```

**验证:**
- frontmatter 格式正确
- Iron Law、Red Flags、停止条件完整
- 引用 references/patterns/performance.md 路径正确（../../references/）
- 与 implement/verify/code-review 契约清晰
- 无占位符

---

### Task 2: 创建 skills/refactor/SKILL.md

**文件:**
- Create: `skills/refactor/SKILL.md`

**接口:**
- 消费: testing 提供的测试保护
- 产出: 重构后的代码（不改变可观察行为）
- 契约: 为 verify 提供回归验证；为 implement 提供重构边界

**内容大纲:**

```markdown
---
name: moonbit-refactor
description: "Use when refactoring code, managing technical debt, or eliminating code smells — with existing tests green. Triggered by 'refactor', 'technical debt', 'code smell', '重构', '技术债务', '坏味', '清理代码'. Do NOT use for new features or bug fixes."
---

# Refactor — 重构

## 职责

技术债务识别、测试保护确认、小步重构、回归验证。**独立迭代循环，不改变可观察行为，只改善内部结构。**

## The Iron Law

\`\`\`
NO REFACTORING WITHOUT GREEN TESTS
\`\`\`

重构前测试必须全绿。无测试保护的代码不是重构，是赌博。

### 可机械化自检
- [ ] 重构前 `moon test` 全绿（已记录通过状态）
- [ ] 重构范围已识别（具体坏味类型和位置）
- [ ] 重构步幅小（每步可独立验证）
- [ ] 每步重构后 `moon test` 仍全绿
- [ ] 重构后 `moon fmt --check` + `moon check` 通过
- [ ] 可观察行为不变（公共 API 未变）

## Red Flags — STOP and Re-evaluate

- 测试不全就重构（"我先重构再补测试"）
- 大步重构（一次改多个坏味）
- 重构中改变公共 API（越界到 implement）
- 重构中修复 bug（越界到 implement，应先记录再单独修）
- 不运行测试就继续下一步
- "顺手优化性能"（越界到 perform）

## 停止条件

- 技术债务清零（识别的坏味全部消除）→ 进入 verify 确认无回归
- 重构无收益（代码已足够清晰）→ 停止，避免过度工程
- 需设计变更（坏味根因是设计缺陷）→ 触发设计回溯，回到 plan
- 测试失败（重构引入回归）→ 立即回滚该步，重新规划

## 重构循环

\`\`\`
┌─ IDENTIFY:      识别坏味 → 长函数、重复代码、复杂条件、神秘命名
├─ ENSURE TESTS:  确认测试覆盖 → moon test 全绿；覆盖不足先补测试（调用 testing）
├─ REFACTOR:      小步重构 → 单一坏味，单一手法
├─ VERIFY:        回归验证 → moon test + moon check + moon fmt --check
└─ 循环:          还有坏味 → 继续；无坏味 → 停止
\`\`\`

## 坏味分类与重构手法

| 坏味 | 症状 | 手法 |
|---|---|---|
| 神秘命名 | 变量名无意义 | 重命名（moon ide rename） |
| 重复代码 | 相同逻辑多处 | 提取函数 |
| 长函数 | 函数 > 50 行 | 提取函数、分解条件 |
| 长参数列表 | 参数 > 4 个 | 引入参数对象 |
| 复杂条件 | 嵌套 if/match | 分解条件、守卫子句 |
| 可变数据 | 不必要的 mut | 不可变化、提取不可变视图 |
| 发散式变化 | 一个类多方向变化 | 提取模块 |
| 霰弹式修改 | 一个改动多处 | 搬移函数 |
| 数据泥团 | 多处相同字段组 | 提取对象 |
| 基本类型偏执 | 用 String/Int 表示概念 | 提取类型 |

## MoonBit 特有重构注意

- `moon ide rename`：语义重命名，安全
- `moon ide peek-def`：查看定义，辅助理解
- `pub` 可见性：重构中不改变公共 API
- `enum` 构造器：跨包需 `pub(all) enum`，重构中注意
- `struct` 字段：跨包字面量需 `pub` 字段，重构中注意

## 与 implement 的契约

- refactor 在 implement 之后（功能正确为前提）
- refactor 不改变可观察行为，只改善内部结构
- refactor 中发现 bug → 记录，不在此修复（回到 implement）
- refactor 中需要新功能 → 记录，不在此实现（回到 plan/implement）

## 与 testing 的契约

- refactor 前确认测试覆盖充分
- 覆盖不足时调用 testing 补测试，再重构
- testing 提供的测试是 refactor 的安全网

## 与 verify 的契约

- refactor 产出的变更需通过 verify 确认无回归
- verify 确认公共 API 未变（H5）

## 与 perform 的契约

- refactor 不优化性能（不越界到 perform）
- 若重构后发现性能问题 → 调用 perform

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| Agent | 识别坏味、确认测试、小步重构、回归验证 |
| 用户 | 确认重构范围、判断是否值得重构、决定停止时机 |

## 输出

\`\`\`json
{
  "status": "completed | no_gain | blocked",
  "smells_identified": 5,
  "smells_resolved": 5,
  "refactor_steps": [
    { "smell": "长函数", "method": "提取函数", "verified": true },
    { "smell": "重复代码", "method": "提取函数", "verified": true }
  ],
  "api_changed": false,
  "regression": false,
  "next": "verify | plan | implement"
}
\`\`\`

## 错误恢复

| 问题 | 诊断 | 修复 |
|---|---|---|
| 测试不全就重构 | 跳过 ENSURE TESTS | 回到 ENSURE TESTS，补测试后重构 |
| 大步重构引入回归 | 一次改多个坏味 | 回滚，拆为小步逐一重构 |
| 重构改变公共 API | 越界到 implement | 回滚 API 变更，保持 API 不变 |
| 重构中修 bug | 越界到 implement | 记录 bug，继续重构，bug 单独修 |
| 测试失败 | 重构引入回归 | 立即回滚该步，重新规划 |
| 坏味根因是设计缺陷 | 局部重构无效 | 触发设计回溯，回到 plan |

## 下一步

重构完成后，进入 `moonbit-verify` 确认无回归。若坏味根因是设计缺陷，触发设计回溯回到 `moonbit-plan`。
```

**验证:**
- frontmatter 格式正确
- Iron Law、Red Flags、停止条件完整
- 坏味分类表完整
- 与 implement/testing/verify/perform 契约清晰
- 无占位符

---

### Task 3: 更新 skills/plan/SKILL.md（新增设计回溯章节）

**文件:**
- Modify: `skills/plan/SKILL.md`

**修改点:**

在"## 下一步"章节之前，新增"## 设计回溯"章节:

```markdown
## 设计回溯

当 implement/perform/refactor 发现以下问题时，回到 plan 重新设计：

| 触发场景 | 来源技能 | 回溯动作 |
|---|---|---|
| API 不可测试 | implement | 重新设计 API，简化可测性 |
| 架构假设错误 | implement | 重新评估架构模式 |
| 依赖不兼容 | implement | 重新选择依赖或架构 |
| 性能瓶颈是架构问题 | perform | 重新设计性能关键路径 |
| 技术债务是设计缺陷 | refactor | 重新设计模块边界 |

### 设计回溯流程

1. 来源技能报告设计问题（停止条件触发）
2. 进入 plan 的"设计修正"模式
3. 重新评估架构决策（与用户确认）
4. 更新 `docs/requirements.md`
5. 进入 writing-plans 重新拆解任务
6. 继续 implement

### 设计回溯的输出

\`\`\`json
{
  "status": "design_revision",
  "trigger": "api_untestable",
  "source_skill": "implement",
  "original_design": "...",
  "revised_design": "...",
  "user_confirmed": true,
  "next": "writing-plans"
}
\`\`\`
```

**验证:**
- 设计回溯章节完整
- 触发场景表含 5 行（覆盖 implement/perform/refactor）
- 流程清晰

---

### Task 4: 更新 skills/implement/SKILL.md（停止条件升级）

**文件:**
- Modify: `skills/implement/SKILL.md`

**修改点:**

1. **停止条件**章节，第 4 项升级:

原:
```
- 测试无法编写（设计缺陷导致不可测试）→ 报告问题，建议回到 plan 重新设计 API
```

新:
```
- 测试无法编写（设计缺陷导致不可测试）→ **触发设计回溯**，回到 `moonbit-plan` 重新设计 API（详见 [plan 的设计回溯章节](../plan/SKILL.md#设计回溯)）
```

2. **错误恢复**表最后一行升级:

原:
```
| 测试无法编写（设计缺陷） | 不可测试的 API 设计 | 报告问题，建议回到 `moonbit-plan` 简化 API |
```

新:
```
| 测试无法编写（设计缺陷） | 不可测试的 API 设计 | **触发设计回溯**，回到 `moonbit-plan` 重新设计 API |
```

3. **TDD 循环**章节，VERIFY 步骤后新增说明:
```
└─ 失败 → 自动诊断 (debug 内置, 3 次上限 → 问用户)

设计回溯触发条件: API 不可测、架构假设错误、依赖不兼容 → 回到 plan（详见 [plan 设计回溯](../plan/SKILL.md#设计回溯)）
```

**验证:**
- 停止条件含"触发设计回溯"明确表述
- 错误恢复表同步
- 引用 plan 设计回溯章节链接正确

---

### Task 5: 更新 skills/using-moonbit-skills/SKILL.md

**文件:**
- Modify: `skills/using-moonbit-skills/SKILL.md`

**修改点:**

1. **Skill Priority 表**新增 2 行:
```
| 性能优化、瓶颈分析 | `moonbit-perform` |
| 重构、技术债务、坏味 | `moonbit-refactor` |
```

2. **Trigger Matrix** 新增 2 行:
```
| "optimize performance", "benchmark", "profile" | "性能优化", "性能瓶颈", "测量", "基线对比" | `moonbit-perform` |
| "refactor", "technical debt", "code smell" | "重构", "技术债务", "坏味", "清理代码" | `moonbit-refactor` |
```

3. **Available Skills 表**新增 2 行:
```
| `moonbit-perform` | Optimize performance with measurement-driven cycle |
| `moonbit-refactor` | Refactor code with test protection, eliminate code smells |
```

4. **Pipeline 流程**更新:
```
Plan → [Writing-Plans] → Scaffold → [Testing ↔] Implement → [Code-Review] → [Perform ↔] → [Refactor ↔] → Verify → Evaluate
                                       ↑                  │
                                       └── 设计回溯 ───────┘
```

注: Perform 和 Refactor 为可选双向步骤，在 implement 之后、verify 之前。设计回溯可从 implement/perform/refactor 回到 plan。

**验证:**
- 路由表、Trigger Matrix、Available Skills、Pipeline 四处一致
- 设计回溯在管线图中有体现

---

### Task 6: 更新 skills/code-review/SKILL.md

**文件:**
- Modify: `skills/code-review/SKILL.md`

**修改点:**

审查清单表新增 2 行:
```
| perform 产出审查 | 优化有测量数据支撑，无过早优化 | 报告无基线的优化 |
| refactor 产出审查 | 可观察行为不变，公共 API 未变 | 报告 API 变更 |
```

**验证:**
- 审查清单含 perform/refactor 产出审查
- 与 perform/refactor 的契约一致

---

### Task 7: 更新 skills/verify/SKILL.md

**文件:**
- Modify: `skills/verify/SKILL.md`

**修改点:**

1. **S3 性能基线**章节加注:
```
### S3. 性能基线

> 性能优化详见 [`moonbit-perform`](../perform/SKILL.md)。S3 提供粗粒度信号，perform 提供独立优化循环。
```

2. **错误恢复**表新增 2 行:
```
| 性能退化 | S3 检测到耗时显著增加 | 建议调用 `moonbit-perform` 优化 |
| 重构回归 | refactor 后测试失败 | 回滚重构步骤，回到 `moonbit-refactor` |
```

3. **下一步**章节更新:
```
验证通过后，进入 `moonbit-evaluate` 做最终验收和发布准备。如果硬性检查失败，回到 `moonbit-implement` 修复问题。性能问题建议调用 `moonbit-perform`，技术债务建议调用 `moonbit-refactor`。
```

**验证:**
- S3 引用 perform
- 错误恢复含 perform/refactor 回落
- 下一步引用 perform/refactor

---

### Task 8: 更新 skills/learn/SKILL.md

**文件:**
- Modify: `skills/learn/SKILL.md`

**修改点:**

1. **归类**章节新增 2 类:
```
├─ perf-pitfall     → 性能陷阱     → 更新 perform 常见错误速查表
├─ refactor-pitfall → 重构陷阱     → 更新 refactor 常见错误速查表
```

2. **直接更新技能文件**表新增 2 行:
```
| perf-pitfall | `skills/perform/SKILL.md` → 错误恢复表 | 追加新行 |
| refactor-pitfall | `skills/refactor/SKILL.md` → 错误恢复表 | 追加新行 |
```

**验证:**
- 归类表和更新目标表一致
- 新增类别无遗漏

---

### Task 9: 更新 skills/writing-plans/SKILL.md

**文件:**
- Modify: `skills/writing-plans/SKILL.md`

**修改点:**

任务结构说明中新增可选阶段:
```markdown
任务结构支持可选阶段:
- implement 完成后，可选进入 `moonbit-perform` 性能优化
- implement 完成后，可选进入 `moonbit-refactor` 重构
- 任一阶段发现设计问题，可触发设计回溯回到 plan
```

**验证:**
- 引用 perform/refactor 作为可选阶段
- 设计回溯提及

---

### Task 10: 更新 AGENTS.md + CLAUDE.md

**文件:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

**修改点:**

1. **技能职责边界表**新增 2 行（在 implement 行之后）:
```
| `moonbit-perform` | 性能测量、瓶颈分析、优化实现 | 不改变功能行为，不替代 verify 门禁 |
| `moonbit-refactor` | 技术债务识别、小步重构、回归验证 | 不改变可观察行为，不替代 testing 测试设计 |
```

2. **维护不变量**章节:
- 原: `skills/` 当前包含 10 个核心技能 + 1 个引导入口
- 新: `skills/` 当前包含 12 个核心技能 + 1 个引导入口

3. **请求路由**章节"推荐的新项目路径":
- 原: `plan → writing-plans → scaffold → [testing ↔] implement ↔ code-review → verify → evaluate`
- 新: `plan ↔ writing-plans → scaffold → [testing ↔] implement ↔ code-review → [perform ↔] → [refactor ↔] → verify → evaluate`
- 注: `↔` 表示可触发设计回溯回到 plan

**验证:**
- AGENTS.md 和 CLAUDE.md 内容一致
- "10 个"全部替换为"12 个"
- 职责边界表含 12 行

---

### Task 11: 检查并更新 GEMINI.md

**文件:**
- Modify: `GEMINI.md`

**修改点:**
- 检查是否含"10 个"或技能列表，按 AGENTS.md 同步

**验证:**
- 与 AGENTS.md/CLAUDE.md 事实一致

---

### Task 12: 更新 references/orchestration.md

**文件:**
- Modify: `references/orchestration.md`

**修改点:**

1. **技能全景图**新增 perform 和 refactor 节点（在 implement 之后、verify 之前）:
```
┌─────────────────────────────────────────────────────┐
│ moonbit-perform — 性能优化                            │
│ 输出: 性能基线 + 优化实现 + 对比验证                    │
│ 路由: ↔ implement（双向）；→ verify                    │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-refactor — 重构                               │
│ 输出: 重构后的代码（可观察行为不变）                     │
│ 路由: ↔ implement（双向）；→ verify                    │
└─────────────────┬───────────────────────────────────┘
```

2. **独立技能表**新增 2 行:
```
| `moonbit-perform` | 性能测量、瓶颈分析、优化实现 | 管线并行 |
| `moonbit-refactor` | 技术债务识别、小步重构、回归验证 | 管线并行 |
```

3. **技能间依赖关系图**新增 perform/refactor:
```
│    │    │    │    └── moonbit-implement
│    │    │    │         │
│    │    │    │         ├── → moonbit-code-review（每任务后）
│    │    │    │         │
│    │    │    │         ├── → moonbit-perform（可选，性能优化循环）
│    │    │    │         │
│    │    │    │         ├── → moonbit-refactor（可选，重构循环）
│    │    │    │         │
│    │    │    │         └── → moonbit-verify（全量后）
```

4. **管线状态 JSON** 新增字段:
```json
"perform": "pending",
"refactor": "pending",
```

5. **回落链**新增设计回溯:
```
设计回溯触发
    │
    ├── implement 发现 API 不可测 → 回到 plan
    ├── perform 发现瓶颈是架构问题 → 回到 plan
    └── refactor 发现坏味是设计缺陷 → 回到 plan
```

**验证:**
- 全景图、独立技能表、依赖关系图三处一致
- 管线状态 JSON 格式正确
- 回落链含设计回溯

---

### Task 13: 更新 README.md

**文件:**
- Modify: `README.md`

**修改点:**

1. **hero 标语**: "10 个 AI Agent 技能" → "12 个 AI Agent 技能"

2. **workflow.svg 说明**: 更新流程描述含 perform/refactor 和设计回溯

3. **快速开始示例**新增:
```
"性能优化"                                        → 自动触发 moonbit-perform
"重构这段代码"                                    → 自动触发 moonbit-refactor
```

4. **"装完即用"章节**: "10 个技能自动注册" → "12 个技能自动注册"

5. **"十个技能详解"** → "十二个技能详解"，新增 perform 和 refactor 章节（在 implement 之后、verify 之前）:
```markdown
### 6. moonbit-perform — 性能优化

**能力**：测量性能基线、定位瓶颈、优化实现、对比验证。独立迭代循环，不改变功能行为。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| 功能正确但性能不达标；需要对比优化方案；性能回归排查 | 功能还未实现（用 implement）；只跑测试（用 verify） | 先建立基线再优化；至少 5-10 次测量取最小值 | MoonBit 官方 bench 工具未发布，当前用计时手段 |

### 7. moonbit-refactor — 重构

**能力**：识别技术债务、确认测试覆盖、小步重构、回归验证。独立迭代循环，不改变可观察行为。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| 代码能跑但质量差；技术债务积累；坏味识别 | 新功能（用 implement）；性能优化（用 perform） | 测试全绿才能重构；每步独立验证 | 重构中可能发现 bug，记录后单独修 |
```

6. **原 6-10 节编号** 顺延为 8-12

7. **FAQ "必须按顺序走完所有技能吗"** 更新流程:
```
Plan → [Writing-Plans] → Scaffold → [Testing ↔] Implement → [Code-Review] → [Perform ↔] → [Refactor ↔] → Verify → Evaluate
```

8. **新增 FAQ**:
```
**Q: 发现设计问题怎么办？**
A: 触发设计回溯，回到 plan 重新设计。implement/perform/refactor 都可触发。
```

**验证:**
- "10 个"全部替换为"12 个"
- 技能详解含 12 节
- 编号连续
- 流程图含 perform/refactor 和设计回溯

---

### Task 14: 重新生成 SVG 资产

**文件:**
- Modify: `assets/readme/hero.svg`
- Modify: `assets/readme/section-skills.svg`
- Modify: `assets/readme/workflow.svg`

**修改点:**
- hero.svg: "10 个" → "12 个"
- section-skills.svg: 技能列表新增 moonbit-perform、moonbit-refactor
- workflow.svg: 工作流图新增 perform、refactor 节点和设计回溯箭头

**验证:**
- SVG 文件可正常渲染
- 文本内容与 README 一致

---

### Task 15: 更新 evals/evals.json

**文件:**
- Modify: `evals/evals.json`

**修改点:**

新增 4 个评估场景:

```json
{
  "id": 16,
  "name": "perform-bottleneck-analysis",
  "prompt": "My MoonBit CLI is slow. Help me optimize performance.",
  "expected_output": "Route to moonbit-perform. Establish baseline, analyze bottleneck, optimize with measurement.",
  "assertions": [
    "routes to perform not implement",
    "establishes baseline before optimization",
    "uses measurement-driven approach",
    "does not change functional behavior"
  ],
  "should_trigger": true,
  "files": [],
  "skills": ["perform"]
},
{
  "id": 17,
  "name": "refactor-code-smells",
  "prompt": "This function is 80 lines long and has duplicated logic. Help me refactor.",
  "expected_output": "Route to moonbit-refactor. Ensure tests green, identify smells, small-step refactor.",
  "assertions": [
    "routes to refactor not implement",
    "checks tests are green before refactoring",
    "uses small-step refactoring",
    "does not change public API"
  ],
  "should_trigger": true,
  "files": [],
  "skills": ["refactor"]
},
{
  "id": 18,
  "name": "design-backtrack-from-implement",
  "prompt": "I'm implementing but the API I designed is impossible to test. What should I do?",
  "expected_output": "Trigger design backtrack. Report to plan, redesign API for testability.",
  "assertions": [
    "triggers design backtrack to plan",
    "does not force implementation",
    "suggests API redesign"
  ],
  "should_trigger": true,
  "files": [],
  "skills": ["implement", "plan"]
},
{
  "id": 19,
  "name": "perform-architecture-bottleneck",
  "prompt": "I've been optimizing this function but it's still slow. The bottleneck seems to be the overall architecture.",
  "expected_output": "Trigger design backtrack from perform to plan. Report architecture issue.",
  "assertions": [
    "triggers design backtrack to plan",
    "does not continue local optimization",
    "reports architecture-level bottleneck"
  ],
  "should_trigger": true,
  "files": [],
  "skills": ["perform", "plan"]
}
```

**验证:**
- JSON 语法正确
- 新增场景 assertions 清晰
- skills 数组含对应 skill 名

---

### Task 16: 全量验证

**文件:**
- 无文件修改

**验证命令:**

```bash
# 1. 插件元数据一致性
python scripts/check-plugin-metadata.py

# 2. JSON 语法验证
python -c "import json; data=json.load(open('evals/evals.json', encoding='utf-8')); print(f'JSON valid, evals count: {len(data[\"evals\"])}')"

# 3. 跨文件事实一致性（"10 个" → "12 个"）
grep -r "10 个" skills/ references/ README.md AGENTS.md CLAUDE.md GEMINI.md
# 预期: 无匹配

# 4. 链接和路径检查
grep -r "references/patterns/performance.md" skills/perform/
grep -r "../plan/SKILL.md#设计回溯" skills/implement/
# 预期: 所有引用路径正确

# 5. 技能数量验证
ls skills/ | grep -v using-moonbit-skills | wc -l
# 预期: 12

# 6. 无占位符检查
grep -rE "TODO|TBD|XXX|FIXME" skills/perform/ skills/refactor/
# 预期: 无匹配

# 7. 设计回溯回路完整性
grep -r "设计回溯" skills/plan/ skills/implement/ references/orchestration.md
# 预期: plan 有章节，implement 有引用，orchestration 有回路
```

**判定标准:**
- 所有验证命令通过
- 无残留"10 个"措辞
- 技能目录含 12 个子目录（不含 using-moonbit-skills）
- 设计回溯回路三处一致（plan 章节、implement 引用、orchestration 回路）
- 所有引用路径存在

---

## 任务依赖关系

```
Task 1 (perform/SKILL.md) ─┐
Task 2 (refactor/SKILL.md) ┤
                            ├── Task 3 (plan 设计回溯)
                            ├── Task 4 (implement 停止条件升级)
                            ├── Task 5 (路由表更新)
                            ├── Task 6 (code-review 微调)
                            ├── Task 7 (verify 微调)
                            ├── Task 8 (learn 微调)
                            ├── Task 9 (writing-plans 微调)
                            ├── Task 10 (AGENTS/CLAUDE 不变量)
                            ├── Task 11 (GEMINI 检查)
                            ├── Task 12 (orchestration 编排)
                            ├── Task 13 (README 更新)
                            ├── Task 14 (SVG 重新生成)
                            └── Task 15 (evals 更新)
                                 │
                                 └── Task 16 (全量验证)
```

Task 1-2 必须先完成（核心创建），Task 3-15 可并行（依赖 Task 1-2 产出），Task 16 必须最后（全量验证）。

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 执行所有任务，产出文件，运行验证 |
| **用户** | 审查计划，确认执行，最终验证 |

## 输出

```json
{
  "status": "planned",
  "total_tasks": 16,
  "total_files": 17,
  "new_skills": ["moonbit-perform", "moonbit-refactor"],
  "plan_file": "docs/plans/2026-07-29-pipeline-optimization-plan.md",
  "next": "implement"
}
```

## 风险

1. **skill 数量膨胀**: 12+1，但每个 skill 有清晰职责边界和 Iron Law
2. **SVG 重新生成**: 需保持原有视觉风格，workflow.svg 需新增设计回溯箭头
3. **设计回溯回路一致性**: plan 章节、implement 引用、orchestration 回路三处必须一致
4. **perform 与 verify S3 边界**: perform 是独立循环，S3 是粗粒度信号，避免职责重叠

---
name: moonbit-learn
description: "Use ONLY in a MoonBit project (moon.mod / *.mbt present); do NOT use outside one. Use when learning from bugs and updating the MoonBit skill system. Triggered by user phrases like 'learn', 'remember this', 'update the skill', or after moonbit-implement encounters a bug that required human intervention."
---

# Learn — 吸收错误，自我优化

## 职责

遇到 bug 时不存档，而是**直接更新技能文件**，让 skill 系统从错误中吸取教训、不断进化。

**Agent 分析 bug → 归类 → 直接更新技能文件 → 验证。**

## 触发时机

| 触发条件 | 说明 |
|---------|------|
| 用户说"记住这个"、"更新一下 skill"、"学一下这个" | 手动触发 |
| `moonbit-implement` 中 Bug Fix 验证通过后 | 自动触发 |
| `moonbit-implement` 中 3 次自动修复全部失败，用户介入解决 | 自动触发 |
| 用户指出一个之前没见过的 MoonBit 陷阱 | 手动触发 |
| 发现技能文档有遗漏或错误 | 手动触发 |
| 生产事故发生后，用户说"复盘"、"RCA"、"事故分析" | 手动触发（RCA 模式） |
| 用户完成回滚后要求分析事故根因 | 手动触发（RCA 模式） |

## The Iron Law

```
NO MEMORY WITHOUT ROOT CAUSE
```

记录知识前必须确认根因。未复现、未确认根因、未去重的知识点不得写入技能文件。每条知识带来源、验证命令、工具链版本和适用范围。

### 可观察信号（机械化自检）

"已确认根因"必须满足以下全部可观察信号，否则视为未确认：

- [ ] **已复现**：bug 可通过具体命令重新触发（记录命令与输出片段）
- [ ] **已定位**：能指出导致 bug 的具体文件/函数/行号或 MoonBit 错误码（如 `E0123`）
- [ ] **已去重**：在目标文件中搜索关键词，确认无相同知识点（记录搜索命令）
- [ ] **已验证修复**：修复后原复现命令不再触发 bug（记录修复前后对比）

未满足以上任一信号 → Iron Law 触发：停止，等待更多信息，不猜测写入。

## Red Flags — STOP and Re-evaluate

If you catch yourself doing any of these, you are violating the learn contract:

- 未复现就记录（"大概是因为 X"）
- 不检查去重就直接追加（"先记下来再说"）
- 项目专属知识写入全局 skills（应写在项目 CLAUDE.md）
- 不生成 learning proposal 就直接落盘
- 更新后不验证目标文件格式

**All of these mean: Stop. Confirm root cause first.**

## 停止条件

- 知识点已存在且无补充价值 → 跳过，不重复创建
- 根因未确认 → 等待更多信息，不猜测写入
- 更新目标文件不存在 → 检查路径，不创建新文件
- 更新破坏文件格式 → 回滚，重新编辑
- 用户拒绝 learning proposal → 跳过

## 执行流程

### 1. 分析

确认以下信息：

- **症状**：Agent 或用户看到了什么错误？
- **原因**：根本原因是什么？
- **修复**：最终怎么修好的？
- **类别**：type-error | api-misuse | logic-error | ffi-pitfall | wasm-pitfall | toolchain | idiom
- **影响范围**：哪个技能文件需要更新？哪个参考文件需要补充？

### 2. 归类

```
类别
├─ type-error      → 类型系统陷阱 → 更新 implement 常见错误速查表
├─ api-misuse      → API 误用     → 更新 idioms.md 对应章节
├─ idiom           → 惯用写法     → 更新 idioms.md
├─ test-pitfall    → 测试陷阱     → 更新 testing 常见错误速查表
├─ perf-pitfall     → 性能陷阱     → 更新 perform 常见错误速查表
├─ refactor-pitfall → 重构陷阱     → 更新 refactor 常见错误速查表
├─ ffi-pitfall     → FFI 陷阱     → 更新 patterns/ffi.md
├─ wasm-pitfall    → WASM 陷阱    → 更新 patterns/wasm.md
├─ toolchain       → 工具链问题   → 更新 commands.md 或 error-codes.json
├─ logic-error     → 逻辑错误     → 更新 implement TDD 策略
├─ incident        → 生产事故     → 更新 skills/learn/SKILL.md（RCA 记录）
└─ practice-gap    → 实践差距     → 更新对应技能文件的常见陷阱/错误恢复表
```

### 3. 直接更新技能文件

根据类别，更新对应的技能文件。**不存档，直接改。**

| 类别 | 更新目标 | 更新方式 |
|------|---------|---------|
| type-error | `skills/implement/SKILL.md` → 常见类型错误速查表 | 追加新行 |
| api-misuse | `references/idioms.md` → 对应 API 章节 | 追加陷阱说明 |
| idiom | `references/idioms.md` → 惯用写法章节 | 追加示例 |
| ffi-pitfall | `references/patterns/ffi.md` | 追加注意事项 |
| test-pitfall | `skills/testing/SKILL.md` → 测试陷阱速查表 | 追加新行 |
| perf-pitfall | `skills/perform/SKILL.md` → 错误恢复表 | 追加新行 |
| refactor-pitfall | `skills/refactor/SKILL.md` → 错误恢复表 | 追加新行 |
| wasm-pitfall | `references/patterns/wasm.md` | 追加注意事项 |
| toolchain | `references/commands.md` 或 `references/error-codes.json` | 追加命令说明或错误码 |
| logic-error | `skills/implement/SKILL.md` → 各类型 TDD 策略 | 追加验证重点 |

**更新原则**：
- 遵循知识准入门：观察 → 复现 → 根因确认 → 适用范围判断 → 去重 → 用户批准 → 最小更新 → 验证
- 用户修正优先于 Agent 推断
- 项目专属知识不能写进全局 MoonBit 规则（写在项目 CLAUDE.md 中）
- 可以更新、合并、删除旧条目，不得"只追加"
- 先生成 learning proposal，再决定是否落盘
- 每条知识带来源、验证命令、工具链版本和适用范围
- 保持目标文件的原有结构和格式
- 更新后立即验证目标文件格式正确

### 4. 可选：记录错误码

如果 bug 来自 `moon check` 编译器报错，且该错误码尚未记录，追加到 `references/error-codes.json`。

**格式规范详见** [`references/error-codes-schema.md`](../../references/error-codes-schema.md)（字段定义、category 可选值、维护流程、JSON 验证命令）。

此处不再重复格式规范，避免与 references 漂移。

### 5. 验证

```bash
# 确保更新后的技能文件结构完整
# 检查 JSON 格式正确（如果更新了 error-codes.json）
# 确认没有破坏原有内容
```

---

## 生产事故 RCA 模式

当触发条件为**生产事故**时，Agent 进入 RCA（Root Cause Analysis）模式。此模式在标准 learn 流程之上增加事故层面的复盘步骤。

### RCA 铁律（扩展自 Iron Law）

```
NO MEMORY WITHOUT ROOT CAUSE — 事故复盘同样适用
```

代码 bug 和生产事故的根因确认门槛一致。未确认根因的事故复盘不得写入知识库。

### RCA 执行流程

#### 1. 收集事故信息

在介入 RCA 前，收集以下信息：

- **事故时间**：发生时间和持续时间
- **事故影响**：影响范围、用户可见的影响、损失估算
- **事故证据**：日志片段、指标异常、用户报告
- **变更记录**：事故前的最近变更（`git log --oneline -10`）
- **回滚状态**：是否已回滚（`git status` + `git log --oneline -3`）

```bash
# 检查变更历史
echo "=== 最近 10 次提交 ==="
git log --oneline -10

# 检查未提交变更
echo "=== 工作区状态 ==="
git status --short

# 检查最近的 tag/发布
echo "=== 最近 tag ==="
git describe --tags --abbrev=0 2>/dev/null || echo "No tags"
```

#### 2. RCA 模板

按以下模板进行事故分析：

```markdown
## RCA: {事故标题}

### 事故概要
- **日期**: {YYYY-MM-DD}
- **影响范围**: {受影响的用户/模块}
- **严重度**: P0(严重) | P1(高) | P2(中) | P3(低)
- **状态**: 已解决 | 复盘中
- **涉及技能**: {涉及的技能列表}

### 时间线
- {T0} 事故开始: {描述}
- {T1} 发现: {如何发现的}
- {T2} 定位: {如何定位根因}
- {T3} 修复/回滚: {如何恢复}
- {T4} 验证: {如何确认已恢复}

### 根因分析（5 Whys）
1. 为什么出现问题？→ {第一层原因}
2. 为什么{第一层原因}发生？→ {第二层原因}
3. 为什么{第二层原因}发生？→ {第三层原因}
4. 为什么{第三层原因}发生？→ {第四层原因}
5. 为什么{第四层原因}发生？→ {根因}

### 根因归类
- {type-error | api-misuse | practice-gap | toolchain | design-flaw | ops-failure}

### 缓解措施（已实施）
- {已应用的修复}

### 预防措施（避免再次发生）
- {需技能更新的部分}
- {需流程改进的部分}
- {需工具支持的部分}

### 需更新的技能/参考文件
- {目标文件路径} → {更新内容描述}
```

#### 3. 根因归类与更新

| 事故根因归类 | 说明 | 更新目标 |
|-------------|------|---------|
| `type-error` | 类型系统相关的生产故障 | `skills/implement/SKILL.md` 常见错误速查表 |
| `api-misuse` | API 误用导致的问题 | `references/idioms.md` 对应章节 |
| `practice-gap` | 实践差距（缺少某个检查/测试/验证） | 对应技能文件的常见陷阱/错误恢复表 |
| `toolchain` | 工具链 bug 或行为异常 | `references/commands.md` 或 `error-codes.json` |
| `design-flaw` | 架构设计缺陷 | `moonbit-plan` 的设计建议；记录 ADR |
| `ops-failure` | 部署/运维错误 | `moonbit-cd` 的错误恢复表或 `references/collaboration.md` |

#### 4. 生成 RCA 报告

将 RCA 记录追加到事故复盘知识库 `docs/incidents/` 目录（如不存在则创建）：

```bash
mkdir -p docs/incidents
```

RCA 报告文件名格式：`docs/incidents/{YYYY-MM-DD}-{简短描述}.md`

#### 5. 更新相关技能/参考文件

根据归类结果，更新对应的技能文件或参考文件（同标准 learn 流程的"直接更新技能文件"步骤）。

#### 6. 验证

```bash
# 验证 RCA 报告格式正确
head -5 docs/incidents/*.md 2>/dev/null

# 验证更新的技能文件仍然有效
# 如适用：检查 JSON 格式
```

### RCA 模式特有 Red Flags

- 未确认根因就写 RCA 报告（"看起来像是 X 导致的"）
- 使用"人为失误"作为根因（总有可改进的系统性预防措施）
- 不分类就直接更新技能（"先记下来再说"）
- 不回看过去 RCA 是否已有相同根因（去重检查）
- RCA 只记录修复，不记录预防措施

### RCA 模式停止条件

- 事故尚未回滚/恢复 → 先回到 `moonbit-cd` 执行回滚
- 根因信息不足（无日志、无监控数据）→ 等待更多信息
- 用户说"不写 RCA" → 标记为 skipped
- 相同根因的 RCA 已存在 → 补充新信息，不重复创建
- 归类无法确定 → 归入 `practice-gap`，继续

### RCA 输出

```json
{
  "status": "rca_completed | skipped",
  "category": "ops-failure",
  "summary": "生产环境因 mooncakes token 过期导致部署失败",
  "severity": "P1",
  "root_cause": "mooncakes token 未设置过期提醒，部署脚本无 token 有效性预检",
  "prevention": ["skills/cd/SKILL.md 新增部署前 token 有效性检查步骤"],
  "rca_file": "docs/incidents/2026-07-30-token-expiry-deployment-failure.md",
  "next": "implement | cd"
}
```

---

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 分析、归类、更新技能文件、验证；RCA 模式下收集事故信息、按模板生成 RCA 报告 |
| **用户** | 确认值得记录、审查更新内容、确认 RCA 根因和预防措施 |

## 输出

```json
{
  "status": "updated | skipped",
  "category": "type-error",
  "summary": "String[i] 返回 UInt16 不是 Char",
  "updated_files": ["skills/implement/SKILL.md"],
  "update_detail": "在常见类型错误速查表中追加一行",
  "error_code_added": "E0123"
}
```

```json
{
  "status": "rca_completed | skipped",
  "category": "ops-failure",
  "summary": "生产环境因 mooncakes token 过期导致部署失败",
  "severity": "P1",
  "root_cause": "mooncakes token 未设置过期提醒，部署脚本无 token 有效性预检",
  "prevention": ["skills/cd/SKILL.md 新增部署前 token 有效性检查步骤"],
  "rca_file": "docs/incidents/2026-07-30-token-expiry-deployment-failure.md",
  "next": "implement | cd"
}
```

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| 知识点已存在 | 目标文件中已有相同内容 | 补充细节，不重复创建 |
| 更新目标文件不存在 | 文件路径错误 | 检查 `references/` 目录结构 |
| 更新破坏文件格式 | 手动检查 | 回滚更新，重新编辑 |
| 分类不确定 | 跨多个类别 | 选最主要类别，必要时更新多个文件 |

## 下一步

学习完成后，回到之前的技能继续工作（通常是 `moonbit-implement` 或 `moonbit-verify`）。
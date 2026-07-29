---
name: moonbit-learn
description: "Use when learning from bugs and updating the MoonBit skill system. Triggered by user phrases like 'learn', 'remember this', 'update the skill', or after moonbit-implement encounters a bug that required human intervention."
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
├─ ffi-pitfall     → FFI 陷阱     → 更新 patterns/c-ffi.md
├─ wasm-pitfall    → WASM 陷阱    → 更新 patterns/wasm.md
├─ toolchain       → 工具链问题   → 更新 commands.md 或 error-codes.json
└─ logic-error     → 逻辑错误     → 更新 implement TDD 策略
```

### 3. 直接更新技能文件

根据类别，更新对应的技能文件。**不存档，直接改。**

| 类别 | 更新目标 | 更新方式 |
|------|---------|---------|
| type-error | `skills/implement/SKILL.md` → 常见类型错误速查表 | 追加新行 |
| api-misuse | `references/idioms.md` → 对应 API 章节 | 追加陷阱说明 |
| idiom | `references/idioms.md` → 惯用写法章节 | 追加示例 |
| ffi-pitfall | `references/patterns/c-ffi.md` | 追加注意事项 |
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

**格式规范详见** [`references/error-codes-schema.md`](../references/error-codes-schema.md)（字段定义、category 可选值、维护流程、JSON 验证命令）。

此处不再重复格式规范，避免与 references 漂移。

### 5. 验证

```bash
# 确保更新后的技能文件结构完整
# 检查 JSON 格式正确（如果更新了 error-codes.json）
# 确认没有破坏原有内容
```

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 分析、归类、更新技能文件、验证 |
| **用户** | 确认值得记录、审查更新内容 |

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

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| 知识点已存在 | 目标文件中已有相同内容 | 补充细节，不重复创建 |
| 更新目标文件不存在 | 文件路径错误 | 检查 `references/` 目录结构 |
| 更新破坏文件格式 | 手动检查 | 回滚更新，重新编辑 |
| 分类不确定 | 跨多个类别 | 选最主要类别，必要时更新多个文件 |

## 下一步

学习完成后，回到之前的技能继续工作（通常是 `moonbit-implement` 或 `moonbit-verify`）。
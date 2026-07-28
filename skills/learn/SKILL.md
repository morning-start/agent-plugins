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
| `moonbit-implement` 中 3 次自动修复全部失败，用户介入解决 | 自动触发 |
| 用户指出一个之前没见过的 MoonBit 陷阱 | 手动触发 |
| 发现技能文档有遗漏或错误 | 手动触发 |

## The Iron Law

```
NO MEMORY WITHOUT ROOT CAUSE
```

记录知识前必须确认根因。未复现、未确认根因、未去重的知识点不得写入技能文件。每条知识带来源、验证命令、工具链版本和适用范围。

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

如果 bug 来自 `moon check` 编译器报错，且该错误码尚未记录，追加到 `references/error-codes.json`：

```json
{
  "code": "E0123",
  "warning_name": "错误的英文标识名",
  "category": "type-error",
  "severity": "error",
  "desc": "两句话描述错误含义",
  "fix": "一句话修复方案",
  "url": "https://docs.moonbitlang.cn/language/error_codes/E0123.html",
  "example": "简短的代码示例（可选）"
}
```

**error-codes.json 格式规范**：
- 数组结构，每个元素是一个错误码对象
- 按 `code` 字段排序（新错误码追加到对应位置，保持升序）
- `code`：编译器错误码（如 E0001、E0101）
- `warning_name`：错误的英文标识名（如 unused_function、type_mismatch）
- `category`：错误类别，可选值（完整列表见 `references/error-codes.json` 现有条目）：
  - `unused`：未使用相关警告
  - `type-error`：类型错误
  - `type-inference`：类型推断相关
  - `pattern-matching`：模式匹配相关
  - `syntax`：语法错误
  - `name-resolution`：名称解析错误
  - `visibility`：可见性错误
  - `module`：模块相关错误
  - `ffi`：FFI 相关错误
  - `wasm`：WASM 相关错误
  - `style`：代码风格警告
  - `logic`：逻辑警告
  - `compatibility`：兼容性警告
- `severity`：严重程度，`error` 或 `warning`
- `desc`：错误描述（中文，简洁清晰）
- `fix`：修复方案（一句话，可操作）
- `url`：官方文档链接（可选，优先补充）
- `example`：简短的错误示例代码（可选）

**目的**：下次遇到相同错误码时，Agent 可以快速查表定位修复，而不需要重新分析。非编译器报错（逻辑错误、API 误用等）不需要记录错误码。

**更新流程**：
1. 检查错误码是否已存在（按 `code` 字段查找）
2. 若不存在，按上述格式追加新条目
3. 若已存在但信息不完整，补充缺失字段
4. 更新后用 Python 验证 JSON 格式：
   ```bash
   python -c "import json; json.load(open('references/error-codes.json', encoding='utf-8'))"
   ```
   Windows PowerShell 中若单引号不兼容，使用：
   ```powershell
   python -c "import json; json.load(open('references/error-codes.json', encoding='utf-8'))"
   ```

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
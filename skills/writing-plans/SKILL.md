---
name: moonbit-writing-plans
description: "Use when transitioning from design to implementation — after moonbit-plan completes and the architecture/API are decided, but before moonbit-implement starts. Breaks the design into bite-sized implementation tasks."
---

# Writing Plans — MoonBit 实现计划

## 职责

将设计文档拆解为可执行的实现任务列表。**每任务 2-5 分钟，一次一个文件变更。**

**核心原则：** 假设执行者对你代码库零上下文、品味堪忧。文档写清楚每一步。

## The Iron Law

```
NO IMPLEMENTATION WITHOUT A WRITTEN PLAN FIRST
```

设计完成后直接跳进实现？**停下来。先写计划。**

## 输入

从 `moonbit-plan` 输出获取：
- `project_type` — lib/cli/c-ffi/wasm/parser/async
- `architecture` — 架构模式
- `api_surface` — API 签名列表
- 需求文档（`docs/requirements.md`）

## 执行流程

### 1. 文件结构规划

列出将要创建或修改的所有文件，以及每个文件的职责：

```
src/
├── lib.mbt          # 公共 API 入口
├── tokenize.mbt     # Tokenizer 实现
├── parser.mbt       # 解析器
└── lib_test.mbt     # 测试
```

### 2. 任务拆解

每个任务以 **TDD 循环**为粒度：一个任务 = 一个完整的 Red-Green-Verify。

### 3. 输出计划文档

保存到 `docs/plans/YYYY-MM-DD-{feature}-plan.md`

## 任务结构

```markdown
### Task N: [组件名]

**文件：**
- Create: `src/xxx.mbt`
- Modify: `src/lib.mbt:10-25`
- Test: `src/lib_test.mbt`

**接口：**
- 消费: 依赖上游 Task 的输出
- 产出: 函数签名、类型定义

- [ ] **Step 1: 写会失败的测试**
  ```moonbit
  test "描述" {
    let result = function(input)
    inspect!(result, content="expected")
  }
  ```

- [ ] **Step 2: 确认测试失败**
  Run: `moon test -f "test_name"` (预期: FAIL)

- [ ] **Step 3: 写最小实现**
  ```moonbit
  pub fn function(input: Type) -> Result[Output, Error] {
    // 最小实现
  }
  ```

- [ ] **Step 4: 确认测试通过**
  Run: `moon test -f "test_name"` (预期: PASS)

- [ ] **Step 5: 全量验证**
  Run: `moon fmt --check && moon check --warn-list +73 && moon test`

- [ ] **Step 6: 提交**
  ```bash
  git add -A && git commit -m "feat: add function"
  ```
```

## 任务粒度规则

| 规则 | 说明 | 反例 |
|------|------|------|
| 每个任务独立可验证 | 做完后能独立跑测试 | "实现整个解析器"（太大） |
| 单次变更 3 个文件以内 | Create + Modify + Test | "改 8 个文件"（拆分） |
| 每个任务含完整代码 | 不写 "类似上面" | "参照 task 2 写"（模棱两可） |
| 无占位符 | 每行代码都实际写成 | "TODO: 加错误处理"（不可执行） |

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 拆解任务、编写计划文档、确保可执行 |
| **用户** | 审查计划、调整任务粒度、确认执行顺序 |

## 输出

```json
{
  "status": "planned | blocked",
  "total_tasks": 7,
  "total_files": 5,
  "plan_file": "docs/plans/2026-07-28-parser-plan.md",
  "next": "implement"
}
```

## 下一步

计划确认后，进入 `moonbit-implement` 开始逐个任务实现。

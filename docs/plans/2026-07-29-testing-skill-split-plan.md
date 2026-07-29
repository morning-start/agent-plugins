# Plan: 拆分 moonbit-testing 独立技能

**日期**: 2026-07-29
**需求文档**: `docs/requirements.md`
**迁移策略**: 一次性完成（单一 PR 覆盖所有同步项）

## 文件结构规划

### 新建文件（2）

```
skills/testing/SKILL.md          # 新技能定义
references/testing.md             # 测试参考单一权威
```

### 修改文件（17）

```
skills/using-moonbit-skills/SKILL.md   # 路由表、Trigger Matrix、Available Skills、Pipeline
skills/implement/SKILL.md               # Iron Law 补充约束、引用 testing
skills/writing-plans/SKILL.md           # Step 1 引用 testing
skills/code-review/SKILL.md             # 审查清单引用 testing
skills/learn/SKILL.md                   # 归类表新增 test-pitfall
skills/scaffold/SKILL.md                # 生成 test.mbt 时引用 testing
AGENTS.md                               # 不变量 9→10，技能职责边界表
CLAUDE.md                               # 同 AGENTS.md（同一份内容）
GEMINI.md                               # 检查并同步不变量
references/orchestration.md             # 技能全景、独立技能表、依赖关系图
references/patterns/lib.md              # 测试章节改引用
references/patterns/cli.md              # 测试章节改引用
references/patterns/wasm.md             # 测试章节改引用
references/patterns/c-ffi.md            # 测试章节改引用
references/patterns/parser.md           # 测试章节改引用
references/patterns/performance.md      # 测试章节改引用
README.md                               # 9→10，新增 testing 章节，工作流图
evals/evals.json                        # 新增 testing 评估场景
```

### 资产重新生成（3 个 SVG）

```
assets/readme/hero.svg              # "9 个" → "10 个"
assets/readme/section-skills.svg    # 技能列表新增 testing
assets/readme/workflow.svg          # 工作流图新增 testing
```

### 无需修改

- 8 个平台 plugin.json（不列具体 skill 名）
- `.opencode/opencode.json`（仅注入 using-moonbit-skills）
- `.pi/extensions/moonbit-skills.ts`（仅注入 using-moonbit-skills）
- `.gemini/settings.json`（仅 hooks 配置）
- `gemini-extension.json`（仅 contextFileName）
- `hooks/*`（不涉及 skill 路由）

---

## 任务拆解

### Task 1: 创建 references/testing.md

**文件:**
- Create: `references/testing.md`

**接口:**
- 消费: `references/patterns/*.md` 中散落的测试内容
- 产出: 测试参考单一权威文档

**内容大纲:**

```markdown
# 测试参考

## 官方测试机制
- 测试块: `test "name" { ... }`，类型 `() -> Unit raise Error`
- moon test 以模块根目录为 CWD
- `"panic"` 前缀测试预期触发 panic
- `moon test --update` 自动更新快照

## 黑盒 vs 白盒测试
| 后缀 | 访问范围 | moon.pkg 字段 |
|---|---|---|
| `_test.mbt` | 黑盒（仅公开成员） | `import` + `test-import` |
| `_wbtest.mbt` | 白盒（全部成员） | `import` + `wbtest-import` |
| 内联 `test` 块 | 白盒（与所在文件一致） | 无需单独文件 |

## 快照测试
- Show 快照: `debug_inspect(x, content="...")`
- JSON 快照: `json_inspect(x, content=[...])`
- 任意快照: `t.write()` + `t.snapshot(filename="...")`
- 快照存于 `__snapshot__/` 目录

## 按项目类型的测试组织
| 类型 | 测试文件组织 |
|---|---|
| lib / cli / wasm / c-ffi | `lib_test.mbt`（黑盒单元测试） |
| parser | `lib_test.mbt` + `lib_valid_test.mbt` + `lib_invalid_test.mbt` |
| performance | `lib_test.mbt` + `bench_test.mbt`（命名前缀 `bench_`） |

## 测试文件命名约定
- 默认: `<lib>_test.mbt`
- 按类别: `<lib>_<category>_test.mbt`（如 `valid`/`invalid`/`edge`）
- 性能: `bench_test.mbt`，测试名 `bench_<scenario>_<variant>`
- 白盒: `<lib>_wbtest.mbt`

## 决策路径
| 场景 | 推荐做法 |
|---|---|
| 新项目起步 | 单个 `lib_test.mbt`，内联 `test` 块 |
| 测试 > 200 行或类别明显 | 按类别拆 `<lib>_<category>_test.mbt` |
| 需要性能回归保护 | 加 `bench_test.mbt`，命名前缀隔离 |
| 必须验证私有实现 | 谨慎使用 `_wbtest.mbt`，优先重构 |
| 跨平台项目 | 同一文件用 `moon test --target native/wasm` |

## 过滤运行
moon test src/parser/ --filter 'valid*'
moon test --target native -f "bench_"
moon test --index 0-2
moon test --outline

## 核心原则
- 不使用单独 `tests/` 目录，测试文件与被测代码同包同目录
- 单一 `lib_test.mbt` 是默认值，类别差异显著时才分文件
- 黑盒测试优先（验证用户视角），白盒测试克制使用
```

**验证:**
- 文件存在且结构完整
- 无占位符
- 与官方文档一致（https://docs.moonbitlang.cn/language/tests.html）

---

### Task 2: 创建 skills/testing/SKILL.md

**文件:**
- Create: `skills/testing/SKILL.md`

**接口:**
- 消费: `references/testing.md`（测试参考）
- 产出: 测试设计与编写技能定义
- 契约: 为 implement 提供 TDD Red 阶段组织决策；为 code-review 提供测试审查标准

**内容大纲:**

```markdown
---
name: moonbit-testing
description: "Use when designing tests, writing test code, or iterating on test organization — before or alongside implementation. Triggered by 'how to test', 'write tests', 'test organization', '测试架构', '写测试', '测试组织', '补测试', '测试重构'."
---

# Testing — 测试设计与编写

## 职责

测试策略选择、文件组织、命名约定、重构迭代。**产出测试代码，不写实现。** 覆盖 TDD Red 阶段决策、补测试、测试重构三类场景。

## The Iron Law

NO TEST CODE WITHOUT TEST STRATEGY

测试代码必须有明确策略：覆盖目标、文件组织、命名约定。无策略的测试是噪声。

### 可机械化自检
- [ ] 已确认测试覆盖目标（公共 API / 私有实现 / 边界 / 性能）
- [ ] 已决定测试文件组织（单文件 / 按类别拆分 / 白盒）
- [ ] 已确认命名约定（如 bench_ 前缀过滤）
- [ ] 已检查现有测试，避免重复

## Red Flags — STOP and Re-evaluate

- 不确认策略就写测试（"先写再说"）
- 测试组织与项目类型不匹配（parser 不用 valid/invalid 分类）
- 白盒测试滥用（能用黑盒却用 _wbtest.mbt）
- 测试无法编写（设计缺陷）却不报告
- 替代 implement 写实现代码

## 停止条件

- 测试策略未确认 → 与用户确认覆盖目标和组织方式
- 测试无法编写（API 不可测）→ 报告设计缺陷，建议回到 plan
- 现有测试已充分覆盖 → 跳过，不重复
- 测试运行失败但属于实现问题 → 移交 implement，不自行修复实现

## 场景路由

| 场景 | 流程 |
|---|---|
| TDD（测试先） | testing 产出失败测试 → implement 写实现 → verify |
| 补测试（实现先） | testing 分析现有实现 → 补充测试 → verify |
| 测试重构 | testing 重构测试代码 → verify 确认无回归 |
| 非 TDD 流程 | 用户指定流程，testing 仅负责测试部分 |

## 各项目类型测试策略

| 类型 | 测试文件 | 分类 | 特殊关注 |
|---|---|---|---|
| lib | `lib_test.mbt` | valid/invalid/edge | 公共 API 覆盖 |
| cli | `lib_test.mbt` | 单元+集成 | 命令解析、stdout |
| c-ffi | `lib_test.mbt` | 内存安全 | alloc/free 对 |
| wasm | `lib_test.mbt` | 内存操作 | WASI 调用边界 |
| parser | `lib_valid_test.mbt` + `lib_invalid_test.mbt` | valid/invalid/edge | 官方测试套件 |
| async | `lib_test.mbt` | 并发/超时 | 协程取消 |
| performance | `bench_test.mbt` | 性能基线 | bench_ 前缀过滤 |

## 测试文件组织决策树

1. 新项目 → 单个 `lib_test.mbt`
2. 测试 > 200 行或类别明显 → 按类别拆 `<lib>_<category>_test.mbt`
3. 需要性能回归保护 → 加 `bench_test.mbt`
4. 必须验证私有实现 → 谨慎使用 `_wbtest.mbt`
5. 跨平台项目 → 同一文件用 `--target` 分别跑

## 与 implement 的契约

- testing 产出测试组织决策（文件、命名、分类）
- implement 在 TDD Red 阶段遵循 testing 决策
- implement 可在 Red 阶段写具体测试代码（遵循 testing 组织）
- testing 不接管 implement 的 TDD 循环执行

## 与 verify 的契约

- testing 不运行门禁判定
- verify H3 运行测试并判定功能完整性
- testing 产出的测试由 verify 验证有效性

## 与 code-review 的契约

- testing 提供测试审查标准（覆盖目标、组织、命名）
- code-review 审查测试质量时引用 testing 决策

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| Agent | 设计测试策略、组织文件、编写测试代码、迭代重构 |
| 用户 | 确认测试覆盖目标、审查测试质量、决定测试范围 |

## 输出

{
  "status": "designed | blocked",
  "project_type": "parser",
  "test_strategy": "valid/invalid/edge 分类",
  "test_files": ["lib_test.mbt", "lib_valid_test.mbt", "lib_invalid_test.mbt"],
  "naming_convention": "<lib>_<category>_test.mbt",
  "coverage_targets": ["公共 API", "边界条件", "错误路径"],
  "next": "implement | verify"
}

## 错误恢复

| 问题 | 诊断 | 修复 |
|---|---|---|
| 测试策略未确认 | 用户未指定覆盖目标 | 展示项目类型策略表，让用户选择 |
| 测试无法编写 | API 不可测 | 报告设计缺陷，建议回到 plan |
| 现有测试已充分 | 重复覆盖 | 跳过，不重复创建 |
| 测试运行失败 | 实现问题 | 移交 implement，不自行修复 |
| 白盒测试滥用 | 能用黑盒却用白盒 | 优先重构为黑盒 |

## 下一步

测试设计完成后，进入 `moonbit-implement` 开始 TDD 实现（遵循测试组织决策），或进入 `moonbit-verify` 验证现有测试有效性。
```

**验证:**
- frontmatter 格式正确（name, description）
- Iron Law、Red Flags、停止条件完整
- 与 implement/verify/code-review 契约清晰
- 无占位符

---

### Task 3: 更新 skills/using-moonbit-skills/SKILL.md

**文件:**
- Modify: `skills/using-moonbit-skills/SKILL.md`

**修改点:**

1. **Skill Priority 表**新增一行:
   ```
   | 测试设计、组织、写法 | `moonbit-testing` |
   ```

2. **Trigger Matrix** 新增行:
   ```
   | "how to test", "write tests", "test organization" | "如何测试", "写测试", "测试组织", "补测试", "测试重构" | `moonbit-testing` |
   ```

3. **Available Skills 表**新增一行:
   ```
   | `moonbit-testing` | Design tests, organize test files, iterate on test code |
   ```

4. **Pipeline 流程**更新:
   ```
   Plan → [Writing-Plans] → Scaffold → [Testing ↔] Implement → [Code-Review] → Verify → Evaluate
   ```
   注: Testing 为可选双向步骤，与 implement 并行或先于 implement

**验证:**
- 路由表、Trigger Matrix、Available Skills、Pipeline 四处一致
- 无遗漏的"9 个"措辞

---

### Task 4: 更新 AGENTS.md + CLAUDE.md

**文件:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`（同一份内容）

**修改点:**

1. **技能职责边界表**新增一行（在 implement 行之后）:
   ```
   | `moonbit-testing` | 测试设计、组织、写法、迭代 | 不写实现代码，不运行门禁判定，不接管 implement 的 TDD Red 阶段执行 |
   ```

2. **维护不变量**章节:
   - 原: `skills/` 当前包含 9 个核心技能 + 1 个引导入口（`using-moonbit-skills`）
   - 新: `skills/` 当前包含 10 个核心技能 + 1 个引导入口（`using-moonbit-skills`）

3. **请求路由**章节"推荐的新项目路径":
   - 原: `plan → writing-plans → scaffold → implement ↔ code-review → verify → evaluate`
   - 新: `plan → writing-plans → scaffold → [testing ↔] implement ↔ code-review → verify → evaluate`

**验证:**
- AGENTS.md 和 CLAUDE.md 内容一致（同一份）
- "9 个"全部替换为"10 个"
- 职责边界表含 10 行

---

### Task 5: 检查并更新 GEMINI.md

**文件:**
- Modify: `GEMINI.md`（如需）

**修改点:**
- 检查是否含"9 个"或技能列表，按 AGENTS.md 同步

**验证:**
- 与 AGENTS.md/CLAUDE.md 事实一致

---

### Task 6: 更新 references/orchestration.md

**文件:**
- Modify: `references/orchestration.md`

**修改点:**

1. **技能全景图**新增 testing 节点（在 implement 之前）:
   ```
   ┌─────────────────────────────────────────────────────┐
   │ moonbit-testing — 测试设计与编写                      │
   │ 输出: 测试策略 + 文件组织 + 测试代码                   │
   │ 路由: ↔ implement（双向）                             │
   └─────────────────┬───────────────────────────────────┘
   ```

2. **独立技能表**新增一行:
   ```
   | `moonbit-testing` | 测试设计、组织、写法、迭代 | 管线并行 |
   ```

3. **技能间依赖关系图**新增 testing:
   ```
   ├── moonbit-testing（与 implement 双向依赖）
   │    │
   │    └── moonbit-implement（testing 提供组织决策，implement 遵循）
   ```

4. **管线状态 JSON** 新增 testing 字段:
   ```json
   "testing": "completed"
   ```

**验证:**
- 全景图、独立技能表、依赖关系图三处一致
- 管线状态 JSON 格式正确

---

### Task 7: 更新 skills/implement/SKILL.md

**文件:**
- Modify: `skills/implement/SKILL.md`

**修改点:**

1. **The Iron Law** 章节补充约束:
   ```
   NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST

   测试组织决策必须遵循 `moonbit-testing` 契约。详见 [`testing/SKILL.md`](../skills/testing/SKILL.md) 和 [`references/testing.md`](../references/testing.md)。
   ```

2. **TDD 循环** 章节更新:
   ```
   ┌─ RED:    写一个会失败的测试 → moon test -f "test_name" (预期: 失败)
   │          （测试组织遵循 moonbit-testing 决策）
   ├─ GREEN:  写最小实现 → moon test -f "test_name" (预期: 通过)
   └─ VERIFY: 全量验证 → moon fmt --check + moon check --warn-list +73 + moon test
   ```

3. **各类型 TDD 策略表** 保留，但加注:
   ```
   > 测试文件组织和命名约定详见 `references/testing.md`，此处仅列出验证重点。
   ```

**验证:**
- Iron Law 保留原文，仅追加约束说明
- TDD 循环完整性不变
- 引用链接正确

---

### Task 8: 更新 skills/writing-plans/SKILL.md

**文件:**
- Modify: `skills/writing-plans/SKILL.md`

**修改点:**

1. **任务结构 Step 1** 补充引用:
   ```markdown
   #### Step 1: 写会失败的测试
     （测试组织决策遵循 `moonbit-testing` 契约，详见 [`references/testing.md`](../references/testing.md)）
   ```

**验证:**
- Step 1-5 结构不变
- 引用链接正确

---

### Task 9: 更新 skills/code-review/SKILL.md

**文件:**
- Modify: `skills/code-review/SKILL.md`

**修改点:**

1. **审查清单** "测试覆盖" 行更新:
   ```
   | 测试覆盖 | 新增功能有对应单元测试，组织遵循 testing 契约 | 报告缺失的测试和不符合的组织 |
   ```

**验证:**
- 审查清单完整
- 引用 testing 契约

---

### Task 10: 更新 skills/learn/SKILL.md

**文件:**
- Modify: `skills/learn/SKILL.md`

**修改点:**

1. **归类** 章节新增类别:
   ```
   ├─ test-pitfall    → 测试陷阱     → 更新 testing 常见错误速查表
   ```

2. **直接更新技能文件** 表新增行:
   ```
   | test-pitfall | `skills/testing/SKILL.md` → 测试陷阱速查表 | 追加新行 |
   ```

**验证:**
- 归类表和更新目标表一致
- 新增类别无遗漏

---

### Task 11: 更新 skills/scaffold/SKILL.md

**文件:**
- Modify: `skills/scaffold/SKILL.md`

**修改点:**

1. **生成 test.mbt** 时加注:
   ```
   // test.mbt
   ///|
   /// {package_name} — 测试
   /// 测试组织决策遵循 moonbit-testing 契约，详见 references/testing.md
   test "hello" {
     ...
   }
   ```

**验证:**
- 注释正确
- 不破坏现有生成逻辑

---

### Task 12-17: 更新 references/patterns/*.md（6 个文件）

**文件:**
- Modify: `references/patterns/lib.md`
- Modify: `references/patterns/cli.md`
- Modify: `references/patterns/wasm.md`
- Modify: `references/patterns/c-ffi.md`
- Modify: `references/patterns/parser.md`
- Modify: `references/patterns/performance.md`

**修改点（每个文件相同模式）:**

将"测试策略"章节内容替换为引用:
```markdown
## 测试策略

测试文件组织和命名约定详见 [`references/testing.md`](../testing.md)。

本项目类型要点:
- <类型特定要点，1-2 行>

示例结构:
<保留原有的目录结构示例>
```

**各文件保留的类型特定要点:**
- lib.md: "单个 `lib_test.mbt` 覆盖公共 API"
- cli.md: "`lib_test.mbt` 含单元和集成测试"
- wasm.md: "`moon test --target wasm` 为主"
- c-ffi.md: "内存安全测试，alloc/free 对验证"
- parser.md: "`lib_valid_test.mbt` + `lib_invalid_test.mbt` 按输入类别分文件"
- performance.md: "`bench_test.mbt` 独立性能测试，`bench_` 前缀过滤"

**验证:**
- 6 个文件测试章节一致引用 references/testing.md
- 类型特定要点保留
- 目录结构示例保留

---

### Task 18: 更新 README.md

**文件:**
- Modify: `README.md`

**修改点:**

1. **hero 标语**: "9 个 AI Agent 技能" → "10 个 AI Agent 技能"

2. **workflow.svg 说明**: 更新流程描述含 testing

3. **快速开始示例**新增:
   ```
   "如何写测试"                                     → 自动触发 moonbit-testing
   ```

4. **"装完即用"章节**: "9 个技能自动注册" → "10 个技能自动注册"

5. **"九个技能详解"** → "十个技能详解"，新增 testing 章节（在 implement 之前）:
   ```markdown
   ### 5. moonbit-testing — 测试设计与编写

   **能力**：设计测试策略、组织测试文件、编写测试代码。支持 TDD（测试先）、补测试（实现先）、测试重构三类场景。

   | 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
   |-----------|---------------|-----------|---------|
   | 新项目设计测试策略；补测试；测试重构；不确定测试怎么组织 | 只想跑测试（用 verify）；还在实现中（用 implement） | 与 implement 配合：testing 设计 → implement 实现 | 不替代 implement 的 TDD Red 阶段执行 |
   ```

6. **原 5-9 节编号** 顺延为 6-10

7. **各类型 TDD 策略表** 保留在 implement 章节，加注"详见 references/testing.md"

8. **FAQ "必须按顺序走完所有技能吗"** 更新流程:
   ```
   Plan → [Writing-Plans] → Scaffold → [Testing ↔] Implement → [Code-Review] → Verify → Evaluate
   ```

**验证:**
- "9 个"全部替换为"10 个"
- 技能详解含 10 节
- 编号连续
- 流程图含 testing

---

### Task 19: 重新生成 SVG 资产

**文件:**
- Modify: `assets/readme/hero.svg`
- Modify: `assets/readme/section-skills.svg`
- Modify: `assets/readme/workflow.svg`

**修改点:**
- hero.svg: "9 个" → "10 个"
- section-skills.svg: 技能列表新增 moonbit-testing
- workflow.svg: 工作流图新增 testing 节点

**验证:**
- SVG 文件可正常渲染
- 文本内容与 README 一致

---

### Task 20: 更新 evals/evals.json

**文件:**
- Modify: `evals/evals.json`

**修改点:**

新增 2 个评估场景:

```json
{
  "id": 14,
  "name": "test-organization-design",
  "prompt": "I'm starting a MoonBit parser project. How should I organize my tests?",
  "expected_output": "Route to moonbit-testing. Design test strategy with valid/invalid/edge classification, recommend lib_test.mbt + lib_valid_test.mbt + lib_invalid_test.mbt structure.",
  "assertions": [
    "routes to testing not implement",
    "recommends valid/invalid/edge classification for parser",
    "references _test.mbt file convention",
    "does not write implementation code"
  ],
  "should_trigger": true,
  "files": [],
  "skills": ["testing"]
},
{
  "id": 15,
  "name": "test-refactor-existing",
  "prompt": "I have a 500-line lib_test.mbt that's hard to maintain. Help me reorganize the tests.",
  "expected_output": "Route to moonbit-testing for test refactoring. Analyze existing tests, propose category-based split, maintain coverage.",
  "assertions": [
    "routes to testing not implement",
    "proposes category-based file split",
    "maintains test coverage during refactor",
    "does not modify implementation code"
  ],
  "should_trigger": true,
  "files": [],
  "skills": ["testing"]
}
```

**验证:**
- JSON 语法正确
- 新增场景 assertions 清晰
- skills 数组含 "testing"

---

### Task 21: 全量验证

**文件:**
- 无文件修改

**验证命令:**

```bash
# 1. 插件元数据一致性
python scripts/check-plugin-metadata.py

# 2. JSON 语法验证
python -c "import json; json.load(open('evals/evals.json'))"

# 3. 跨文件事实一致性（"9 个" → "10 个"）
grep -r "9 个" skills/ references/ README.md AGENTS.md CLAUDE.md GEMINI.md
# 预期: 无匹配

# 4. 链接和路径检查
grep -r "references/testing.md" skills/ references/
# 预期: 所有引用路径正确

# 5. 技能数量验证
ls skills/ | grep -v using-moonbit-skills | wc -l
# 预期: 10

# 6. 无占位符检查
grep -rE "TODO|TBD|XXX|FIXME" skills/testing/ references/testing.md
# 预期: 无匹配
```

**判定标准:**
- 所有验证命令通过
- 无残留"9 个"措辞
- 技能目录含 10 个子目录（不含 using-moonbit-skills）
- 所有引用路径存在

---

## 任务依赖关系

```
Task 1 (references/testing.md) ← Task 2 (testing/SKILL.md 引用 references)
    │
    ├── Task 3 (路由表更新)
    ├── Task 4 (AGENTS/CLAUDE 不变量)
    ├── Task 5 (GEMINI 检查)
    ├── Task 6 (orchestration 编排)
    ├── Task 7 (implement 微调)
    ├── Task 8 (writing-plans 微调)
    ├── Task 9 (code-review 微调)
    ├── Task 10 (learn 微调)
    ├── Task 11 (scaffold 微调)
    ├── Task 12-17 (patterns 提取，可并行)
    ├── Task 18 (README 更新)
    ├── Task 19 (SVG 重新生成)
    └── Task 20 (evals 更新)
         │
         └── Task 21 (全量验证)
```

Task 1-2 必须先完成（核心创建），Task 3-20 可并行（依赖 Task 1-2 产出），Task 21 必须最后（全量验证）。

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 执行所有任务，产出文件，运行验证 |
| **用户** | 审查计划，确认执行，最终验证 |

## 输出

```json
{
  "status": "planned",
  "total_tasks": 21,
  "total_files": 19,
  "plan_file": "docs/plans/2026-07-29-testing-skill-split-plan.md",
  "next": "implement"
}
```

## 风险

1. **SVG 重新生成**: 需要保持原有视觉风格，可能需要手动编辑 SVG XML
2. **跨文件一致性**: 19 个文件修改，需仔细检查引用路径和措辞
3. **patterns 提取**: 6 个文件的测试章节需保留类型特定要点，仅替换通用内容
4. **evals 新增**: 评估场景需与实际 skill 行为匹配，可能需迭代调整

---
name: moonbit-plan
description: "Use ONLY in a MoonBit project (moon.mod / *.mbt present) or when the user explicitly asks to build a MoonBit tool/lib/parser/CLI; do NOT use outside one. Use FIRST before any MoonBit implementation work — when the user says 'I want to build X', 'create a new project', 'write a parser/CLI/lib', 'make a MoonBit tool', or any project initiation request. Do NOT skip to implementation — always plan first."
---

# Plan — 需求澄清 + 设计决策

## 职责

Agent 提问→用户描述→Agent 展示方案→用户决策。**产出需求文档 + 架构决策 + 模块划分 + 设计规则。**

设计要**宏观、清晰、能承载规则**：不只决定"做什么"，还要定下"模块边界"和"实现时必须遵守的规则"，让后续 writing-plans / testing / implement / task 有统一的约束来源，避免每个技能各自猜测。

## 项目类型分类

```
用户说"我要做 X"
    │
    ▼
关键词匹配:
├─ "CLI" "命令行" "工具"          → cli
├─ "FFI" "C 绑定" "extern"        → ffi
├─ "WASM" "WASI" "wasm"           → wasm
├─ "解析" "parser" "TOML" "JSON"  → parser
├─ "异步" "HTTP" "网络"           → async
├─ "库" "lib" "package" "包"      → lib
└─ 其他                            → 问用户
```

## 各类型追问清单

| 类型 | 追问 |
|------|------|
| cli | 命令/子命令？参数格式？标准 I/O？目标 native-only |
| ffi | 链接哪个 C 库？API 数量？alloc/free 对？目标 native-only |
| wasm | WASI 版本？需要哪些 WASI 调用？目标 wasm/wasm-gc |
| parser | 解析什么格式？版本？需要序列化？有官方测试套件？ |
| async | 需要哪些高层服务(HTTP/WebSocket/fs)？需要 TLS？目标 native-only |
| lib | 核心功能？API 最小表面？目标 native,wasm,js |

项目可以同时具备多个能力，不要强行压缩成单一类型。记录：

```json
{
  "primary_type": "cli",
  "capabilities": ["parser", "async"],
  "targets": ["native"]
}
```

`primary_type` 决定脚手架；`capabilities` 决定依赖、目录和测试；`targets` 决定验证矩阵。

## The Iron Law

```
NO CODE WITHOUT APPROVED DESIGN
```

设计未获用户批准前，不得写任何实现代码。架构决策、API 签名、目标平台必须由用户确认。

### 可机械化自检

- [ ] 已生成 `docs/requirements.md` 需求文档
- [ ] 用户已明确确认 `primary_type`、`targets`、`api_surface`（记录确认来源）
- [ ] 已定义**模块划分**（每个模块的职责与边界、模块间依赖方向）
- [ ] 已定义**设计规则**（命名约定、错误处理策略、验证/测试约束、验收标准来源）
- [ ] 当前阶段未产出任何 `.mbt` 实现代码文件
- [ ] 若已进入 implement，回头检查是否有 plan 跳过证据

未满足以上任一 → Iron Law 触发：停止，先完成设计或回到 plan。

## Red Flags — STOP and Re-evaluate

If you catch yourself doing any of these, you are violating the plan contract:

- 跳过分类直接给方案（"看起来就是个 CLI 工具"）
- 替用户做架构决策（"我帮你选了递归下降"）
- 不展示选项对比，只给一个方案
- 用户说"随便"就直接决定
- 需求模糊时不追问，凭猜测填充

**All of these mean: Stop. Ask the user.**

## 停止条件

- 需求完全无法分类（不属于 cli/ffi/wasm/parser/async/lib 任一类型）→ 展示类型矩阵，让用户选择
- 用户无法决定架构方向 → 列出每个选项的优缺点，等待用户决策
- 用户描述的 API 自相矛盾 → 指出矛盾点，请求澄清
- 缺少关键信息（如包名、目标平台）且用户无法提供 → 标记为 blocked

## 可维护性设计原则

**可维护性是设计的一等公民**——代码写出来是要被长期维护的，不只是"能跑"。以下原则在架构和 API 设计时强制考虑：

| 原则 | 含义 | 设计时怎么做 |
|------|------|-------------|
| **模块职责单一** | 每个模块只做一件事 | 模块划分时按职责切分，避免"上帝模块" |
| **依赖方向单向** | 依赖只朝一个方向，不循环 | 模块依赖表必须无环，必要时增加抽象层 |
| **公共 API 稳定** | 对外接口不轻易变 | 公共 API 最小化；内部实现可替换，外部签名不破坏 |
| **可测试性** | 每个功能可被独立测试 | 设计时预演测试：写不出测试的设计要重设计 |
| **错误处理统一** | 错误类型和策略全局一致 | 设计规则区定义错误策略，所有模块遵守 |
| **演进有缓冲** | 预留升级和扩展空间 | 明确哪些是稳定契约、哪些是内部实现 |
| **文档随代码维护** | 文档与代码同源更新 | pub fn 必须有 docstring；需求文档→计划→实现的链路可追溯 |

**可维护性检查点**（架构方案展示后、用户确认前自检）：
- [ ] 模块划分是否职责单一、依赖无环？
- [ ] 公共 API 是否最小且稳定？内部实现可否替换而不破坏外部？
- [ ] 每个模块的每个功能点，是否都能写出独立测试？
- [ ] 错误处理策略是否全局统一？
- [ ] 长期维护规划是否明确（升级兼容策略、测试/文档/CI 持续维护）？

未满足 → 调整设计方案后再请用户确认。

## 执行流程

### 1. 需求分析五问（先于任何设计决策）

做需求分析时，先搞清楚以下五点，答案写入需求文档，作为后续所有设计的依据。**五问未答完之前，不进入架构和 API 设计。**

| # | 问题 | 要搞清楚的内容 | 影响的设计决策 |
|---|------|---------------|---------------|
| 1 | **用户的主要目标是什么？** | 用户想解决什么问题？成功标准是什么（怎样算"做成"）？ | 功能优先级、验收标准 |
| 2 | **核心的使用场景是什么？** | 在什么场景下使用？输入/输出是什么？调用频率、性能要求？ | 架构模式、性能约束 |
| 3 | **主要的目标客户是谁？** | 谁会用？开发者还是终端用户？技术能力、使用规模？ | API 复杂度、文档深度 |
| 4 | **想实现的功能边界和职责是什么？** | 做什么/不做什么？与相邻系统/库的边界？职责是否单一？ | 模块划分、范围控制 |
| 5 | **长期怎么维护？** | 谁维护？升级兼容策略？测试/文档/CI 如何持续维护？ | 可维护性设计、公共 API 稳定性 |

- 五问的回答必须来自用户确认，不得由 Agent 猜测填充
- 用户无法回答的问题（如"目标客户"）→ 用合理默认并标注假设，交由用户确认
- 五问结论直接影响第 4 步需求文档的「目标与场景」「功能边界」「维护规划」章节

### 2. 分类 + 追问

根据关键词匹配确定 `project_type`，追问该类型的关键维度。

### 3. 展示架构方案

根据 `project_type` 展示对应架构模式（参考 `references/patterns/{type}.md`）：

**项目类型 → 推荐架构**
- `cli`: `main.mbt` (@argparse) + `lib.mbt`，native-only
- `ffi`: 四层 FFI (L0 extern → L1 raw → L2 public → L3 traits)，`with_closed_*` RAII
- `wasm`: 四层 FFI，`extern "wasm"` + 内存操作，目标 wasm/wasm-gc
- `parser`: 递归下降 + 分层（lexer → tokenize → parser → validate）
- `async`: 异步运行时（event_loop → task → io → socket → http）
- `lib`: 简单模块 + 最小 API

### 3. 用户设计 API

用户描述 API 签名，Agent 填充类型细节：

```moonbit
// 用户说: "我要一个 parse 函数，输入字符串，输出 AST"
// Agent 填充:
pub fn parse(input: StringView) -> Result[Ast, ParseError]
```

### 4. 输出需求文档

```markdown
# Requirements: {project_name}

## 项目类型
{cli | ffi | wasm | parser | async | lib}

## 目标与场景（需求分析五问结论）
- 主要目标：{用户想解决什么问题；成功标准}
- 核心使用场景：{场景、输入/输出、调用频率、性能要求}
- 目标客户：{谁用、技术能力、使用规模}

## 功能边界与职责
- 做什么：{功能1、功能2}
- 不做什么（明确排除）：{明确不做的事，防范围蔓延}
- 与相邻系统/库的边界：{边界约定}

## 长期维护规划
- 维护者与周期：{谁维护、多久维护}
- 升级兼容策略：{SemVer 策略、公共 API 稳定性承诺}
- 持续维护机制：{测试/文档/CI 如何随代码持续维护}

## 目标平台
{各类型对应的目标平台}

## 架构
{推荐架构模式}
（遵循可维护性设计原则：模块职责单一、依赖单向无环、公共 API 稳定、可测试、错误处理统一、演进有缓冲、文档随代码维护）

## 模块划分（宏观设计，能承载规则）
| 模块 | 职责 | 边界（做什么/不做什么） | 依赖（依赖哪些模块） |
|------|------|------------------------|----------------------|
| {module_a} | {职责} | {边界} | {依赖} |
| {module_b} | {职责} | {边界} | {依赖} |

> 模块是后续任务拆解的最小聚合单元：每个模块对应一个 Phase，模块内再拆 Task。依赖方向必须无环。

## 设计规则（实现必须遵守，后续技能统一引用）
- 命名约定：{如 snake_case / 前缀规则}
- 错误处理：{如 Result[T,E] 而非 panic，错误类型定义在哪个模块}
- 测试约束：{如 parser 必须 valid/invalid/edge 三分类；验收标准如何定义}
- 其他规则：{模块间依赖方向、性能约束、公共 API 稳定性要求}

## API 表面（按模块组织）
### {module_a}
- pub fn {fn1}(...) -> ...
- pub type {type1}
### {module_b}
- pub fn {fn2}(...) -> ...
```

## 检查点

```bash
# 验证需求文档完整性
test -f docs/requirements.md && echo "requirements.md: OK" || echo "requirements.md: MISSING"
grep -q "project_type" docs/requirements.md && echo "project_type: OK" || echo "project_type: MISSING"
# 预期: 所有检查通过
```

## 错误恢复

| 问题 | 诊断 | 修复 |
|------|------|------|
| 关键词匹配失败 | 无法确定 project_type | 追问用户，展示类型矩阵 |
| 架构选择困难 | 多个模式都适用 | 列出优缺点对比，展示参考项目 |
| API 设计模糊 | 用户描述不清晰 | 给出示例 API 帮助用户表达 |
| 需求文档生成失败 | 目录不存在 | 创建 docs/ 目录 |


## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 提问、整理、展示架构选项、填充类型细节 |
| **用户** | 描述需求、选择架构方向、设计 API 签名 |

## 输出

```json
{
  "status": "decided",
  "primary_type": "parser",
  "capabilities": ["lexer", "tokenizer"],
  "targets": ["native"],
  "requirement_analysis": {
    "goal": "解析 TOML 1.0 并序列化回字符串",
    "scenario": "配置读取场景，低频率调用，无实时性能要求",
    "target_customer": "开发者，native-only",
    "boundary": "只做解析与序列化，不做校验语义",
    "maintenance": "月度维护，SemVer，公共 API 稳定承诺"
  },
  "architecture": "recursive-descent-layered",
  "maintainability": {
    "module_responsibility": "single",
    "dependency_acyclic": true,
    "api_stable": true,
    "testable": true
  },
  "modules": [
    {"name": "lexer", "responsibility": "tokenize", "depends_on": []},
    {"name": "parser", "responsibility": "AST build", "depends_on": ["lexer"]}
  ],
  "design_rules": {
    "naming": "snake_case",
    "error_handling": "Result[T,E] no panic",
    "test_constraints": "valid/invalid/edge",
    "acceptance_source": "module boundary + test classification"
  },
  "api_surface": ["pub fn parse(StringView) -> Result[Ast, ParseError]"],
  "requirements_file": "docs/requirements.md",
  "next": "writing-plans"
}
```

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

```json
{
  "status": "design_revision",
  "trigger": "api_untestable",
  "source_skill": "implement",
  "original_design": "...",
  "revised_design": "...",
  "user_confirmed": true,
  "next": "writing-plans"
}
```

---

## Spike 原型验证（可选）

设计确定后，如果存在关键假设需要验证，可以在 writing-plans 之前增加可选 Spike 阶段。

### 何时需要 Spike

- **API 可用性验证**：不确定 API 设计是否好用，想快速写一段消费代码试试
- **技术可行性验证**：不确定 FFI/WASM 边界能否工作
- **性能假设验证**：不确定某算法的性能表现
- **依赖评估**：不确定第三方库是否满足需求

### Spike 契约

1. 写**最小**的探索代码，只验证关键假设
2. **验证完成即丢弃所有 Spike 代码**（不可进入版本控制）
3. 产出物是经验——记录到 `writing-plans` 的任务拆解中
4. Spike 代码不能被复用为生产代码（否则破坏 implement 的 Iron Law）

### Spike 流程

```
┌─ IDENTIFY:  确认关键假设（哪些决策需要验证）
├─ SPIKE:     写最小探索代码，验证假设
├─ EVALUATE:  验证结果 → 假设成立/不成立/部分成立
└─ DISCARD:   丢弃 Spike 代码，记录经验到 writing-plans
```

### 与 implement 的关系

- Spike 代码不是生产代码，不遵循 TDD Iron Law
- Spike 完成后必须丢弃所有代码，再从空的 implement 开始 TDD
- Spike 的经验可以指导 writing-plans 的 task 拆分，但不可以直接进入代码

---

## 下一步

计划确认后，进入 `moonbit-writing-plans` 将设计拆解为可执行任务。如果不需要分解（如小型改动），可以直接进入 `moonbit-scaffold` 生成项目骨架或 `moonbit-implement` 开始开发。
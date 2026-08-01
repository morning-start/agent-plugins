---
name: moonbit-plan
description: "Use FIRST before any MoonBit implementation work — when the user says 'I want to build X', 'create a new project', 'write a parser/CLI/lib', 'make a MoonBit tool', or any project initiation request. Do NOT skip to implementation — always plan first."
---

# Plan — 需求澄清 + 设计决策

## 职责

Agent 提问→用户描述→Agent 展示方案→用户决策。**产出需求文档 + 架构决策。**

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

## 执行流程

### 1. 分类 + 追问

根据关键词匹配确定 `project_type`，追问该类型的关键维度。

### 2. 展示架构方案

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

## 核心功能
1. {功能1}
2. {功能2}

## 目标平台
{各类型对应的目标平台}

## 架构
{推荐架构模式}

## API 表面
- pub fn parse(StringView) -> Result[Ast, ParseError]
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
  "architecture": "recursive-descent-layered",
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
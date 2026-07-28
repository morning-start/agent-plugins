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
├─ "FFI" "C 绑定" "extern"        → c-ffi
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
| c-ffi | 链接哪个 C 库？API 数量？alloc/free 对？目标 native-only |
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

## 执行流程

### 1. 分类 + 追问

根据关键词匹配确定 `project_type`，追问该类型的关键维度。

### 2. 展示架构方案

根据 `project_type` 展示对应架构模式（参考 `references/patterns/{type}.md`）：

**项目类型 → 推荐架构**
- `cli`: `main.mbt` (@argparse) + `lib.mbt`，native-only
- `c-ffi`: 四层 FFI (L0 extern → L1 raw → L2 public → L3 traits)，`with_closed_*` RAII
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
{cli | c-ffi | wasm | parser | async | lib}

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

## 下一步

计划确认后，进入 `moonbit-writing-plans` 将设计拆解为可执行任务。如果不需要分解（如小型改动），可以直接进入 `moonbit-scaffold` 生成项目骨架或 `moonbit-implement` 开始开发。
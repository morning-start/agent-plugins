---
name: plan
description: "Plan a MoonBit project — merge of clarify + design. Agent asks targeted questions about project type and requirements, then presents architecture options and recommended API surface. User decides direction. Use FIRST when the user says 'I want to build X', 'create', 'new project', 'write a parser/CLI/lib'. Do NOT skip to implementation without a plan."
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

## 执行流程

### 1. 分类 + 追问

根据关键词匹配确定 `project_type`，追问该类型的关键维度。

### 2. 展示架构方案

根据 `project_type` 展示对应架构模式（参考 `references/arch-patterns.md`）：

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

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 提问、整理、展示架构选项、填充类型细节 |
| **用户** | 描述需求、选择架构方向、设计 API 签名 |

## 输出

```json
{
  "status": "decided",
  "project_type": "parser",
  "architecture": "recursive-descent-layered",
  "api_surface": ["pub fn parse(StringView) -> Result[Ast, ParseError]"],
  "next": "scaffold"
}
```
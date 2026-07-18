---
name: clarify
description: "Clarify requirements for a MoonBit project. Agent asks targeted questions about project type, target platform, API surface, and constraints. User describes their intent. Use this first when the user says 'I want to build X'."
---

# Clarify — 需求澄清

## 职责

理解用户要做什么。**Agent 提问，用户描述。** 产出需求文档，供后续设计使用。

**关键：先确定项目类型，后续所有技能都根据类型分支。**

## 项目类型分类矩阵

```
用户说"我要做 X"
    │
    ▼
关键词匹配:
├─ "CLI" "命令行" "工具" "命令"     → cli-tool
├─ "FFI" "C 绑定" "extern" "链接"   → c-ffi
├─ "WASM" "WASI" "wasm" "内存"      → wasm-ffi
├─ "解析" "parser" "TOML" "JSON"    → parser
├─ "异步" "HTTP" "网络" "socket"    → async-io
├─ "库" "lib" "package" "包"        → lib
├─ "数据结构" "算法" "集合"          → lib
└─ 其他                             → 问用户: CLI / 库 / C 绑定 / WASM？
```

## 各类型的追问清单

### cli-tool
- 有哪些命令和子命令？
- 参数格式是什么？（位置参数/命名参数/标志）
- 是否读写文件？标准输入输出？
- 目标平台: native-only

### c-ffi
- 链接哪个 C/C++ 库？
- C API 有多少个函数？
- 需要管理内存吗？有 alloc/free 对？
- 目标平台: native-only

### wasm-ffi
- 使用 WASI 预览 1 还是 2？
- 需要哪些 WASI 调用？（文件 I/O、网络、随机数）
- 目标平台: wasm, wasm-gc

### parser
- 解析什么格式？（TOML/JSON/YAML/CSV/自定义）
- 需要什么版本？（TOML 1.0/1.1 等）
- 需要序列化吗？（to_string）
- 需要官方测试套件吗？

### async-io
- 需要哪些高层服务？（HTTP/WebSocket/文件/进程）
- 需要 TLS 加密吗？
- 目标平台: native-only（WASM 不支持异步）

### lib
- 提供什么核心功能？
- API 最小表面是什么？
- 目标平台: native, wasm, js

## 执行流程

### 1. 分类项目类型

根据关键词匹配或追问确定 `project_type`：

```bash
# 用户说"我要做一个 TOML 解析器"
# → project_type = parser

# 用户说"帮我封装一下 libcurl"
# → project_type = c-ffi

# 用户说"我想写一个文件搜索工具"
# → project_type = cli-tool
```

### 2. 追问类型相关问题

根据 `project_type` 追问该类型的关键维度（见上）。

### 3. 产出需求文档

整理成 `docs/requirements.md`：

```markdown
# Requirements: {project_name}

## 一句话定位
{一句话描述这个包做什么}

## 项目类型
{cli-tool | c-ffi | wasm-ffi | parser | async-io | lib}

## 核心功能
1. {功能1}
2. {功能2}
3. {功能3}

## 目标平台
{cli-tool → native | c-ffi → native | lib → native,wasm,js | ...}

## 依赖
{moonbitlang/core, 其他...}

## 模板路径
templates/{project_type}/

## 参考模式
references/patterns/{project_type}.md
```

### 3. 展示给用户

```markdown
## 需求总结

{用一段话总结用户的需求}

**是否正确？** 可以调整任何内容。

- 正确 → 进入 design 阶段
- 需要调整 → 请说明要改的部分
```

## 用户 vs Agent 分工

| 谁做 | 做什么 |
|------|--------|
| **Agent** | 提问、整理、生成文档 |
| **用户** | 描述需求、确认方向 |

## 输出

```json
{
  "status": "clarified",
  "project_type": "parser",
  "requirements_doc": "docs/requirements.md",
  "next": "design"
}
```
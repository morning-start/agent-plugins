---
name: design
description: "Design architecture and API for a MoonBit project. Use after clarify when the user needs to decide architecture patterns, API surface, or project structure. Agent presents architecture options with real project references (miniio, toml-parser, async), trade-offs, and recommendations. User decides the direction and designs the API surface. Do NOT skip this and start implementing without a design decision.""
---

# Design — 设计决策

## 职责

用户做架构决策和 API 设计。**Agent 展示知识，用户决定方向。**

**根据 `project_type` 展示对应的架构选项。**

## 参考文档

每种项目类型的详细架构模式在 `references/patterns/{project_type}.md`：

| 项目类型 | 参考文档 | 架构模式 |
|---------|---------|---------|
| `lib` | `references/patterns/lib.md` | 简单模块 + 最小 API |
| `cli` | `references/patterns/cli.md` | CLI 入口 + @argparse |
| `c-ffi` | `references/patterns/c-ffi.md` | 四层 FFI (L0-L3) |
| `wasm` | `references/patterns/wasm.md` | 四层 FFI (WASM) |
| `parser` | `references/patterns/parser.md` | 递归下降 + 分层 |
| `async` | `references/patterns/async.md` | 异步运行时 (7 层) |

## 执行流程

### 1. 加载对应类型的模式文档

```bash
# 根据 project_type 加载对应的模式文档
# project_type = parser → references/patterns/parser.md
# project_type = c-ffi  → references/patterns/c-ffi.md
# project_type = cli    → references/patterns/cli.md
# project_type = wasm   → references/patterns/wasm.md
# project_type = lib    → references/patterns/lib.md
# project_type = async  → references/patterns/async.md
```

### 2. 展示架构选项

根据项目类型，展示对应的架构模式（参考对应模式文档）：

```markdown
## 架构选项

### 项目类型: {project_type}

**架构**: {从 patterns/{type}.md 中提取}
**目录结构**: {从 patterns/{type}.md 中提取}
**测试策略**: {从 patterns/{type}.md 中提取}
**参考项目**: {从 patterns/{type}.md 中提取}

**推荐**: {推荐选项}
```

### 3. 用户决定架构

用户选择或描述他们想要的架构。Agent 记录到 `docs/architecture.md`：

```markdown
# Architecture: {project_name}

## 架构模式
{用户选择的模式}

## 目录结构
```
src/
├── lib.mbt
├── internal/
│   ├── lexer/
│   │   └── moon.pkg
│   └── moon.pkg
├── moon.pkg
└── lib_test.mbt
```

## 分层职责
- Layer 1: 词法分析 — 文本 → Token 流
- Layer 2: 解析 — Token 流 → AST
```

### 3. C 类型映射（仅 c-ffi 类型）

当项目类型为 `c-ffi` 时，在 API 设计前先确定 C⇔MoonBit 类型映射：

| C 类型 | MoonBit 类型 | 说明 |
|--------|-------------|------|
| `int`, `int32_t` | `Int` | 32 位有符号 |
| `uint32_t` | `UInt` | 32 位无符号 |
| `int64_t` | `Int64` | 64 位有符号 |
| `float` | `Float` | 32 位浮点 |
| `double` | `Double` | 64 位浮点 |
| `bool` | `Bool` | 以 `int32_t` 传递 |
| `void*` (GC 管理) | `type Handle` (opaque) | 外部对象 + finalizer |
| `void*` (C 管理) | `type Handle` + `#external` | C 管理生命周期 |
| `const char*` | `Bytes` | UTF-8 字符串 |
| callback | `FuncRef[...]` | 回调闭包 |

**所有权注解:**
- `#borrow` — C 不持有引用，MoonBit GC 管理
- `#owned` — 所有权转移给 C
- `#external` — C 管理生命周期，MoonBit 不追踪

### 4. 用户设计 API

```moonbit
// 用户描述他们想要的 API 签名，Agent 填充类型细节
// 用户说: "我要一个 parse 函数，输入字符串，输出 AST"
// Agent 填充:
//   pub fn parse(input: StringView) -> Result[Ast, ParseError]

// 用户说: "错误类型要包含行号"
// Agent 填充:
//   pub(all) suberror ParseError {
//     InvalidSyntax(String, line: Int, col: Int)
//   } derive(Show, Eq, ToJson)
```

### 4. 展示给用户

```markdown
## 设计总结

**架构**: {递归下降 + 分层}
**API 表面**:
- `pub fn parse(StringView) -> Result[TomlValue, ParseError]`
- `pub fn validate(TomlValue) -> Result[Unit, ValidationError]`

**是否正确？** 可以调整任何内容。

- 正确 → 进入 implement 阶段
- 需要调整 → 请说明要改的部分
```

## 用户 vs Agent 分工

| 谁做 | 做什么 |
|------|--------|
| **Agent** | 展示架构选项、参考项目、优缺点、填充类型细节 |
| **用户** | 选择架构方向、设计 API 签名、决定错误处理策略 |

## 输出

```json
{
  "status": "decided",
  "architecture": "recursive-descent-layered",
  "architecture_doc": "docs/architecture.md",
  "api_surface": ["pub fn parse(StringView) -> Result[TomlValue, ParseError]"],
  "next": "implement"
}
```

## 类型感知分支

根据 `project_type` 调整设计输出：

| 项目类型 | 设计重点 | 额外输出 |
|---------|---------|---------|
| `lib` | 最小 API 表面、跨平台兼容 | 跨目标兼容性检查 |
| `cli` | 命令结构、标准 I/O、退出码 | 命令流程图 |
| `c-ffi` | 四层 FFI 架构、类型宽度、所有权 | C⇔MoonBit 类型映射表 |
| `wasm` | 内存操作、WASI 调用、目标兼容 | WASM 内存布局图 |
| `parser` | 词法/语法分层、错误定位 | 词法状态机图 |
| `async` | 事件循环、任务系统、取消传播 | 并发架构图 |

### c-ffi 类型映射前置

当 `project_type = c-ffi` 时，在 API 设计前先确定 C⇔MoonBit 类型映射：

| C 类型 | MoonBit 类型 | 说明 |
|--------|-------------|------|
| `int`, `int32_t` | `Int` | 32 位有符号 |
| `uint32_t` | `UInt` | 32 位无符号 |
| `int64_t` | `Int64` | 64 位有符号 |
| `float` | `Float` | 32 位浮点 |
| `double` | `Double` | 64 位浮点 |
| `bool` | `Bool` | 以 `int32_t` 传递 |
| `void*` (GC 管理) | `type Handle` (opaque) | 外部对象 + finalizer |
| `void*` (C 管理) | `type Handle` + `#external` | C 管理生命周期 |
| `const char*` | `Bytes` | UTF-8 字符串 |
| callback | `FuncRef[...]` | 回调闭包 |

**所有权注解:**
- `#borrow` — C 不持有引用，MoonBit GC 管理
- `#owned` — 所有权转移给 C
- `#external` — C 管理生命周期，MoonBit 不追踪

## 幂等性

本技能可安全重复运行：

- **设计文档**: 每次生成覆盖同名文件，不产生副作用
- **类型分支**: 同一 project_type 多次运行结果一致
- **无副作用**: 不修改代码，只生成设计文档

```bash
# Idempotency check: 重新运行设计流程
echo "project_type: {project_type}"
# 预期: 相同的架构选项和推荐
```

## Checkpoint: architecture

```bash
# 验证架构文档完整性
test -f docs/architecture.md && echo "architecture.md: OK" || echo "architecture.md: MISSING"
grep -q "架构模式" docs/architecture.md && echo "架构模式: OK" || echo "架构模式: MISSING"
grep -q "目录结构" docs/architecture.md && echo "目录结构: OK" || echo "目录结构: MISSING"
# 预期: 所有检查通过
# 如果缺失: 回到类型分支步骤
```

## 错误恢复速查表

| 命令 | 诊断 | 修复 | 升级 |
|------|------|------|------|
| 架构选择困难 | 多个模式都适用 | 列出优缺点对比 | 展示参考项目 |
| 类型映射冲突 | C 类型宽度不匹配 | 检查 C 头文件 | 询问用户 ABI 要求 |
| API 设计模糊 | 用户描述不清晰 | 给出示例 API | 追问使用场景 |

## IDE 工具链

设计前先发现现有 API，避免命名冲突：

```bash
moon ide doc '<query>'
moon ide outline
moon ide peek-def <symbol>
```

## 上游参考

- `moonbit-agent-guide` — 项目结构与布局
- `moonbit-c-binding` — FFI 类型映射与所有权注解
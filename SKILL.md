---
name: moonbit-skill
description: "MoonBit 全生命周期开发技能。用户做架构决策和 API 设计，Agent 做实现和验证。通过 4 种对话模式协作：澄清需求 → 设计决策 → TDD 实现 → 评估验收。"
---

# MoonBit 开发技能

## 协作模型

这不是一条流水线。这是一个**设计对话**，用户和 Agent 通过 4 种模式协作：

```
用户说"我要做 X"
    │
    ├── clarify: Agent 问清楚 → 用户描述需求
    │
    ├── design: Agent 展示知识 → 用户决定架构 + 设计 API
    │
    ├── implement: Agent 逐个任务 TDD → 用户审查/调整
    │   └── 卡住时 → debug 自动修复 → 3 次失败后问用户
    │
    └── evaluate: Agent 验证 → 用户判断"好了"或"再改"
         │
         └── publish: Agent 准备 → 用户决定发布
```

**用户做决策，Agent 做执行。**

## 用户做什么

**所有技能都根据 `project_type` 分支（lib / cli / c-ffi / wasm / parser / async），展示不同内容。**

| 场景 | 用户 | Agent |
|------|------|-------|
| 需求澄清 | 描述要做什么 | 根据类型问不同维度的问题 |
| 设计决策 | 选架构、设计 API | 展示类型对应的架构模式 + 参考项目 |
| 实现 | 审查结果、说「改这里」 | 按类型的 TDD 策略逐个实现 |
| 卡住时 | 给方向 | 按类型诊断（C 编译错误 / WASM 目标错误） |
| 评估 | 判断质量是否达标 | 按类型运行验证管道 |
| 发布 | 执行 moon publish | 按类型生成文档 + CI 配置 |

## 技能列表

所有技能在 `skills/<name>/SKILL.md` 目录下：

### 对话模式

| 技能 | 什么时候用 |
|------|-----------|
| `clarify/` | 用户说「我要做 X」— 先澄清需求 |
| `design/` | 需求清楚后 — 设计架构和 API |
| `implement/` | 设计方案确定后 — 逐个功能实现 |
| `evaluate/` | 实现完成后 — 验证并判断是否达标 |

### 原子能力

| 能力 | 什么时候用 |
|------|-----------|
| `scaffold/` | 需要生成项目骨架 |
| `debug/` | 实现卡住，自动诊断失败 |
| `review/` | 需要检查代码质量 |
| `verify/` | 需要运行验证管道 |
| `publish/` | 准备发布 |

## 启动方式

```bash
# 用户说:
# "我要做一个 TOML 解析器 in MoonBit"
# 或
# "帮我把这个 JSON 解析器改成 MoonBit"
# 或
# "我想写一个 MoonBit 的 CLI 工具"

# Agent 加载 skills/clarify/SKILL.md 开始对话
```

## 对话流程示例

```
用户: "我要做一个 TOML 解析器"

Agent: 加载 skills/clarify.md
  → "好的，我需要了解几个事情：
     1. 目标平台是 native 还是 also wasm/js？
     2. 需要支持 TOML 1.0 还是 1.1？
     3. 除了解析，还需要序列化吗？"

用户: "native 就够了，TOML 1.0，需要序列化"

Agent: 加载 skills/design.md
  → "根据你的需求，推荐 递归下降 + 分层 架构。
     参考项目: bobzhang/toml (34 文件, 745 测试)
     
     架构: lexer/ → tokenize/ → parser → validate → serialize
     
     初步 API 设计:
     - pub fn parse(StringView) -> Result[TomlValue, ParseError]
     - pub fn to_string(TomlValue) -> String
     
     你觉得这个方向对吗？"

用户: "API 不错，但错误类型要带行号"

Agent: "好的，修改 ParseError 加上 line/col 字段。
     方案确认后，开始实现？"

用户: "开始"

Agent: 加载 skills/implement.md
  → Task 1: 定义 TomlValue 类型 + 测试
     [实现中...]
     ✅ 完成，要看看吗？
  
  → 用户: "继续"
  → Task 2: 实现 tokenize() ...
```

## 设计原则

1. **用户是设计者，不是选择器** — 用户描述想要什么，Agent 填充细节
2. **Agent 是执行者，不是流水线** — Agent 逐个实现、验证、展示
3. **对话驱动，不是阶段驱动** — 不预设顺序，根据用户需求切换
4. **失败时问人，不要死磕** — 3 次自动修复失败就暂停，问用户方向
5. **验证是持续的过程** — 每个任务完成都验证，不是最后才做
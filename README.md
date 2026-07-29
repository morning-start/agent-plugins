<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="MoonBit Skills — 你决策，Agent 执行。13 个 AI Agent 技能覆盖 MoonBit 项目全生命周期。">
</p>

这套技能帮助你在 AI Agent（AtomCode、Claude Code、Codex、Cursor 等）的辅助下开发 MoonBit 项目。**你负责做决策，Agent 负责写代码、跑测试、修 bug。**

---

<p align="center">
  <img src="./assets/readme/workflow.svg" width="100%" alt="完整开发管线：plan → writing-plans → scaffold → init → ci → testing ↔ implement(code-review) → [perform ↔ refactor ↔] → verify → evaluate + 设计回溯 + learn">
</p>

---

<p align="center">
  <img src="./assets/readme/section-quickstart.svg" width="100%" alt="快速开始 — 用自然语言说需求，Agent 自动选择技能">
</p>

你只需要用自然语言描述你想做什么，Agent 会自动选择合适的技能：

```
"帮我初始化这个 MoonBit 项目，配好 git hooks"   → 自动触发 moonbit-init
"CI 怎么配"                                          → 自动触发 moonbit-ci
"我想写一个 TOML 解析器"                         → 自动触发 moonbit-plan
"帮我拆成实现任务"                                → 自动触发 moonbit-writing-plans
"如何写测试"                                     → 自动触发 moonbit-testing
"开始写代码吧"                                   → 自动触发 moonbit-implement
"性能优化"                                        → 自动触发 moonbit-perform
"重构这段代码"                                    → 自动触发 moonbit-refactor
"审查一下这段代码"                                → 自动触发 moonbit-code-review
"检查一下代码有没有问题"                          → 自动触发 moonbit-verify
"准备发布了"                                     → 自动触发 moonbit-evaluate
"记住这个 bug，下次别再踩坑了"                    → 自动触发 moonbit-learn
```

**不需要手动指定技能名**，Agent 会根据你的意图自动路由。你只需要像和同事对话一样描述需求。

---

<p align="center">
  <img src="./assets/readme/section-install.svg" width="100%" alt="安装方式 — 支持 8 个 AI Agent 平台，装完即用">
</p>

本仓库可作为多种 AI Agent 的插件安装，装完后 13 个技能自动注册到 `/` 菜单。

### AtomCode

```bash
# 方式一：交互式（推荐）
/plugin marketplace add https://github.com/morning-start/moonbit-skills
/plugin install moonbit-skills@moonbit-skills

# 信任 hooks（可选，不信任不影响技能使用）
atomcode plugin trust moonbit-skills
```

### Claude Code

```bash
# 官方市场（推荐）
/plugin install moonbit-skills@claude-plugins-official

# 或自定义市场
/plugin marketplace add https://github.com/morning-start/moonbit-skills
/plugin install moonbit-skills@morning-start
```

### Cursor

```bash
# 在 Cursor Agent 聊天中安装
/add-plugin moonbit-skills
```

### Codex CLI / Codex App

```bash
# 在 Codex CLI 中搜索安装
/plugins → 搜索 "moonbit-skills" → Install Plugin
```

### Kimi Code

```bash
# 在 Kimi Code 插件管理器中安装
/plugins → 市场 → moonbit-skills → 安装
```

### Gemini CLI

```bash
gemini extensions install https://github.com/morning-start/moonbit-skills
```

### 装完之后的体验

- `/` 菜单出现 `moonbit-skills:moonbit-plan`、`moonbit-skills:moonbit-implement` 等 13 个带命名空间的 skill
- Agent（模型）也可以通过 `use_skill` 工具自动调用这些技能，不需要手动选
- 当你说"我要做一个 MoonBit 项目"时，技能会自动触发，从 `moonbit-plan` 开始引导对话

---

<p align="center">
  <img src="./assets/readme/section-skills.svg" width="100%" alt="十三个技能速览 — 从设计到发布全流程覆盖">
</p>

整个管线由两个入口（init + ci）和一条主线（plan → implement → verify → evaluate）构成，中间穿插测试、审查、性能、重构和持续学习。

| 阶段 | 技能 | 一句话能力 | 管线位置 |
|:----:|:----:|-----------|:--------:|
| 🏗️ | `moonbit-init` | 给项目装上 git hooks 质量门禁 | 新项目第一步 |
| 🔁 | `moonbit-ci` | CI/CD：commit-msg 校验 + 安全扫描 + GitHub Actions | init 之后 |
| 📐 | `moonbit-plan` | 澄清需求、选架构、定 API | 管线入口 |
| 📝 | `moonbit-writing-plans` | 把设计拆成可独立验证的 TDD 任务 | plan 之后 |
| 🏛️ | `moonbit-scaffold` | 按类型动态生成项目骨架 | writing-plans 之后 |
| 🧪 | `moonbit-testing` | 设计测试策略、组织文件、编写测试 | 与 implement 配合 |
| 💻 | `moonbit-implement` | TDD 写代码 / Bug 复现修复（Iron Law 约束） | 管线核心 |
| ⚡ | `moonbit-perform` | 测量→分析→优化→对比，不改功能行为 | implement 之后（可选） |
| 🧹 | `moonbit-refactor` | 识别坏味→小步重构→回归验证 | 同上（可选） |
| 👁️ | `moonbit-code-review` | 每实现任务后按 Critical/Important/Minor 审查 | 每 implement 任务后 |
| ✅ | `moonbit-verify` | 三级门禁：基础(B)必选 / Custom(C)按类型 / 增强(E)推荐 | 发布前必经 |
| 📦 | `moonbit-evaluate` | 验收 + CHANGELOG + SemVer 建议 + CI 预览 | 管线终点 |
| 🧠 | `moonbit-learn` | 分析根因 → 写入对应的技能或参考文件 | 任何时候 |

> **不是每个项目都需要走完所有阶段**：已有项目跳过 `scaffold` / `init` / `ci`；设计清楚跳过 `plan`；不发布不用 `evaluate`。Code-review 在每个 implement 任务后自动执行。

### 验证如何分级？

`moonbit-verify` 按三级体系分层检测，不同项目类型走不同路径：

| 层级 | 含义 | 内容 | 阻断 |
|:----:|------|------|:----:|
| **基础测试 B** | 所有 MoonBit 项目必选 | `moon fmt --check` · `moon check (+73)` · `moon test` · `git status --porcelain` | ✅ |
| **Custom 测试 C** | 按项目类型选择 | C1 API 稳定性(lib/cli/parser/async) · C2 `moon run`(cli) · C3 消费验证(lib) | ✅ 按类型 |
| **增强测试 E** | 推荐但不阻断 | 跨平台 · 安全审计 · 性能基线 · API 深度 · CI 完整性 · 文档 | ❌ |

---

<p align="center">
  <img src="./assets/readme/section-faq.svg" width="100%" alt="常见问题 — 技能管线、使用门槛、Windows 兼容性、多平台支持">
</p>

### 发现设计问题怎么办？

发现设计问题（API 不可测、架构假设错误、性能瓶颈是架构问题、技术债务是设计缺陷、验收发现方向偏差）可以触发**设计回溯**，回到 `moonbit-plan` 重新设计。implement/perform/refactor/evaluate 都可触发。

### 我必须要按顺序走完所有技能吗？

不需要。技能管线是推荐流程，不是强制流程：

```
Plan → [Writing-Plans] → Scaffold → Init → CI → [Testing ↔] Implement → [Code-Review] → [Perform ↔] → [Refactor ↔] → Verify → Evaluate
```

注: Init/Ci 适用于新项目；Perform 和 Refactor 为可选双向步骤，在 implement 之后、verify 之前。设计回溯可从 implement/perform/refactor/evaluate 回到 plan。

你可以跳过 scaffold（项目已存在）、跳过 init/ci（已有 hooks 和 CI）、跳过 plan（已想清楚）、在 implement 和 verify 之间来回迭代、不需要发布则永远不用 evaluate。Code-review 在每 implement 任务后自动执行。

### 我不是 MoonBit 专家，能用到什么程度？

可以。plan 阶段 Agent 会引导你，你只需要描述想做什么。implement 阶段 Agent 写代码，你审查结果。不确定 API 设计时 Agent 给选项和建议。

### 这些技能会改我的代码吗？

- `moonbit-plan`：只生成文档，不改代码
- `moonbit-writing-plans`：只生成计划文档，不改代码
- `moonbit-scaffold`：生成新文件，不覆盖已有
- `moonbit-implement`：写代码，但每步都展示给你看
- `moonbit-perform`：测量和优化性能，不改功能行为
- `moonbit-refactor`：改善代码结构，不改可观察行为
- `moonbit-code-review`：只报告问题，机械性问题可自动修复
- `moonbit-verify`：默认只报告问题，不自动改（除非你让改）
- `moonbit-learn`：直接更新技能文件（可追加/合并/更新，需用户确认根因）
- `moonbit-evaluate`：生成文档和 CI，不改业务代码

### 支持哪些 AI Agent 平台？

| 平台 | 安装方式 |
|------|---------|
| AtomCode | 插件市场安装 |
| Claude Code | 官方市场 / 自定义市场 |
| Cursor | `/add-plugin` |
| Codex CLI / Codex App | `/plugins` 市场 |
| Kimi Code | 插件管理器 |
| Gemini CLI | `gemini extensions install` |
| OpenCode | 指令引用 |

### Windows 能用吗？

大部分可以。仓库同时提供 Bash、Nushell 和 PowerShell 入口；Windows 可使用 Nushell/PowerShell 路径，Git hooks 仍建议通过 Git Bash 或 WSL 执行。插件安装和技能使用不受影响。

### 需要安装什么前置条件？

- MoonBit 工具链（`moon` 命令可用）
- Git
- （可选）`moon-audit`：`moon add minie135/moon-audit`

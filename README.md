<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="MoonBit Skills — 你决策，Agent 执行。7 个 AI Agent 技能覆盖 MoonBit 项目全生命周期。">
</p>

这套技能帮助你在 AI Agent（AtomCode、Claude Code、Codex 等）的辅助下开发 MoonBit 项目。**你负责做决策，Agent 负责写代码、跑测试、修 bug。**

---

<p align="center">
  <img src="./assets/readme/workflow.svg" width="100%" alt="5 个典型工作流场景：从零开始、修复 bug、代码质量检查、配置 git hooks、自我进化">
</p>

---

<p align="center">
  <img src="./assets/readme/section-quickstart.svg" width="100%" alt="快速开始 — 用自然语言说需求，Agent 自动选择技能">
</p>

你只需要用自然语言描述你想做什么，Agent 会自动选择合适的技能：

```
"帮我初始化这个 MoonBit 项目，配好 git hooks"   → 自动触发 moonbit-init
"我想写一个 TOML 解析器"                         → 自动触发 moonbit-plan
"开始写代码吧"                                   → 自动触发 moonbit-implement
"检查一下代码有没有问题"                          → 自动触发 moonbit-verify
"准备发布了"                                     → 自动触发 moonbit-evaluate
"记住这个 bug，下次别再踩坑了"                    → 自动触发 moonbit-learn
```

**不需要手动指定技能名**，Agent 会根据你的意图自动路由。你只需要像和同事对话一样描述需求。

---

<p align="center">
  <img src="./assets/readme/section-install.svg" width="100%" alt="安装方式 — 作为 AI Agent 插件安装，装完即用">
</p>

本仓库可作为 **AtomCode** 和 **Claude Code** 的插件安装，装完后 7 个技能自动注册到 `/` 菜单。

### AtomCode

```bash
# 方式一：交互式（推荐）
# 在 TUI 中输入 /plugin → Add marketplace → 输入仓库 URL → 选中安装
/plugin

# 方式二：命令行
/plugin marketplace add https://github.com/morning-start/moonbit-skills
/plugin install moonbit-skills@moonbit-skills

# 信任 hooks（可选，不信任不影响技能使用）
atomcode plugin trust moonbit-skills
```

### Claude Code

```bash
# 方式一：交互式
/claude plugin

# 方式二：命令行
/claude plugin install https://github.com/morning-start/moonbit-skills
```

### 装完之后的体验

- `/` 菜单出现 `moonbit-skills:moonbit-plan`、`moonbit-skills:moonbit-implement` 等 7 个带命名空间的 skill
- Agent（模型）也可以通过 `use_skill` 工具自动调用这些技能，不需要手动选
- 当你说"我要做一个 MoonBit 项目"时，技能会自动触发，从 `moonbit-plan` 开始引导对话

---

<p align="center">
  <img src="./assets/readme/section-skills.svg" width="100%" alt="七个技能详解 — init, plan, scaffold, implement, verify, evaluate, learn">
</p>

### 1. moonbit-init — 给项目装上质量门禁

**能力**：在你的 MoonBit 项目中安装 git hooks，让每次 `git commit` 和 `git push` 自动跑检查。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| 新项目第一天就要质量保障；接手老项目想补上 hooks；团队统一代码风格 | 不是 MoonBit 项目（无 `moon.mod`）；不是 git 仓库；临时试验不打算提交 | 装后建议加 `moon-audit`；严格环境设 `MOONBIT_STRICT_AUDIT=1` | 只支持 bash，Windows 需 Git Bash/WSL；项目级 hooks，每个项目单独装；`moon-audit` 需单独安装 |

### 2. moonbit-plan — 动手前先想清楚

**能力**：Agent 会问你一系列问题来澄清需求，然后给出架构方案和 API 设计，你来做决策。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| 新项目没想好架构；模糊想法需梳理；多方案决策 | 已有设计方案只想写代码（跳到 implement）；修小 bug；简单改代码 | 描述尽量具体；"我不确定"没问题—Agent 给选项；对 API 有想法直接说 | 需求太模糊会问很多问题；不支持 GUI 设计；架构基于内置模式 |

**项目类型识别：**

| 你说的话 | 识别为 | 会追问什么 |
|---------|-------|-----------|
| "CLI 工具" | cli | 命令/子命令？参数格式？ |
| "C 库绑定" | c-ffi | 链接哪个 C 库？API 数量？ |
| "WASM 模块" | wasm | WASI 版本？调用？ |
| "解析器" | parser | 格式？版本？序列化？ |
| "HTTP 服务" | async | 高层服务？TLS？ |
| "库/lib/包" | lib | 核心功能？API 最小表面？ |

### 3. moonbit-scaffold — 生成项目骨架

**能力**：根据 plan 阶段确认的项目类型，从模板生成最小可构建的项目骨架。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| plan 结束后需要生成项目文件；快速搭标准化结构 | 已有现成项目只加新功能（用 implement）；项目类型不确定（先 plan） | plan 阶段确定好包名和类型；生成后自动跑验证 | parser/async 不是独立类型；模板标准化，非常规结构不适用 |

| 类型 | 模板 | 生成内容 |
|------|------|---------|
| lib | `templates/lib/` | moon.mod, moon.pkg, lib.mbt, test.mbt |
| cli | `templates/cli/` | moon.mod, moon.pkg, main.mbt, test.mbt |
| c-ffi | `templates/c-ffi/` | moon.mod, moon.pkg, ffi.mbt |
| wasm | `templates/wasm/` | moon.mod, moon.pkg, ffi.mbt, test.mbt |

### 4. moonbit-implement — TDD 方式写代码

**能力**：Agent 按 TDD 逐个任务实现功能：先写测试 → 写实现 → 验证，失败时自动修复（最多 3 次）。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| 写新功能；修 bug；重构代码；任何写 MoonBit 代码的场景 | 还在设计阶段（先用 plan）；只检查代码质量（用 verify） | 一次一个任务；每个任务完成后审查结果；3 次失败说明理解偏差，重新描述比死磕有效 | MoonBit 特性理解有限；`String[i]` 返回 `UInt16` 等常见陷阱；3 次上限对复杂问题可能不够 |

**各类型 TDD 策略：**

| 类型 | 验证重点 |
|------|---------|
| lib | 公共 API 覆盖、边界情况、错误处理 |
| cli | 命令解析、参数传递、标准 I/O |
| c-ffi | 从底层 FFI 往外写，内存安全 |
| wasm | 内存操作、边界值、WASI 调用 |
| parser | valid/invalid/edge 三类用例 |
| async | 协程测试、超时、取消 |

### 5. moonbit-verify — 一站式质量检查

**能力**：跑全量验证管道 — 代码审查 + 格式检查 + 类型检查 + 测试 + 安全审计。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| 写完代码确认无问题；PR 前最终检查；不确定质量想全面审查 | 只想格式化（`moon fmt`）；只想跑测试（`moon test`）；频繁检查太慢 | 每个 implement 任务完成后跑一次，不攒到最后 | 自动修复只限于机械性修改；安全审计需额外装 `moon-audit` |

| 步骤 | 命令 | 做什么 |
|------|------|--------|
| 代码审查 | `moon check --warn-list +73` | 惯用写法、潜在问题 |
| 格式检查 | `moon fmt --check` | 代码风格一致性 |
| 单元测试 | `moon test --target native` | 全部测试通过 |
| API 稳定性 | `moon info --target native` | 公共 API 无意外变更 |
| 安全审计 | `moon-audit pipeline .` | 14 条 CWE 规则扫描 |

### 6. moonbit-evaluate — 验收 + 发布准备

**能力**：做最终验收，生成 README 文档和 CI 配置，准备发布。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| 功能开发完成准备发布；确认达到发布标准；生成文档和 CI | 代码还在开发中（先 verify）；内部使用不发布 | 确保 verify 全部通过再跑；生成的 README 需审查 | README 只列 API 签名不含教程；CI 只生成 GitHub Actions；不执行 `moon publish` |

**发布前检查清单：** `moon test` ✓ → `moon info` ✓ → 版本号确认 → `moon publish`

### 7. moonbit-learn — 从错误中学习，自我优化

**能力**：遇到 bug 时不存档，直接分析原因 → 归类 → 更新对应的技能或参考文件，让技能系统持续进化。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| implement 3 次修复失败后用户介入解决；发现新的 MoonBit 语言陷阱；用户说"记住这个" | 只是拼写错误；问题还没搞清楚原因；知识点已存在 | 修复后说"记住这个"自动触发；不用手动指定更新哪个文件 | 只追加不删除；不会判断值不值得更新 |

| 类别 | 示例 | 更新目标 |
|------|------|---------|
| type-error | `String[i]` 返回 `UInt16` | `skills/implement/SKILL.md` 速查表 |
| api-misuse | `@json.parse` 返回 `Json` | `references/idioms.md` |
| idiom | `Option[T]` vs `T?` | `references/idioms.md` |
| ffi-pitfall | C 内存管理 | `references/patterns/c-ffi.md` |
| toolchain | 命令参数 | `references/commands.md` |

---

<p align="center">
  <img src="./assets/readme/section-faq.svg" width="100%" alt="常见问题 — 技能管线、使用门槛、Windows 兼容性">
</p>

### 我必须要按顺序走完所有技能吗？

不需要。技能管线是推荐流程，不是强制流程。你可以跳过 scaffold（项目已存在）、跳过 plan（已想清楚）、在 implement 和 verify 之间来回迭代、不需要发布则永远不用 evaluate。

### 我不是 MoonBit 专家，能用到什么程度？

可以。plan 阶段 Agent 会引导你，你只需要描述想做什么。implement 阶段 Agent 写代码，你审查结果。不确定 API 设计时 Agent 给选项和建议。

### 这些技能会改我的代码吗？

- `moonbit-plan`：只生成文档，不改代码
- `moonbit-scaffold`：生成新文件，不覆盖已有
- `moonbit-implement`：写代码，但每步都展示给你看
- `moonbit-verify`：默认只报告问题，不自动改（除非你让改）
- `moonbit-learn`：直接更新技能文件（追加不删除）
- `moonbit-evaluate`：生成文档和 CI，不改业务代码

### Windows 能用吗？

大部分可以。git hooks 脚本是 bash 的，Windows 上需要 Git Bash 或 WSL 才能执行。

### 需要安装什么前置条件？

- MoonBit 工具链（`moon` 命令可用）
- Git
- （可选）`moon-audit`：`moon add minie135/moon-audit`

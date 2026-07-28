# MoonBit Skills — 使用指南

这套技能帮助你在 AI Agent（Claude Code、Codex 等）的辅助下开发 MoonBit 项目。你负责做决策，Agent 负责写代码、跑测试、修 bug。

## 快速开始：我怎么用？

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

## 安装方式（AI Agent Plugin）

本仓库可作为 **AtomCode** 和 **Claude Code** 的插件安装，装完后 7 个技能自动注册到 `/` 菜单。

### AtomCode

```bash
# 方式一：交互式（推荐）
# 在 TUI 中输入 /plugin → Add marketplace → 输入仓库 URL → 选中安装
/plugin

# 方式二：命令行
/plugin marketplace add https://github.com/moonbit-community/moonbit-skills
/plugin install moonbit-skills@moonbit-skills

# 信任 hooks（可选，不信任不影响技能使用）
atomcode plugin trust moonbit-skills
```

### Claude Code

```bash
# 方式一：交互式
/claude plugin

# 方式二：命令行
/claude plugin install https://github.com/moonbit-community/moonbit-skills
```

### 装完之后的体验

- `/` 菜单出现 `moonbit-skills:moonbit-plan`、`moonbit-skills:moonbit-implement` 等 7 个带命名空间的 skill
- Agent（模型）也可以通过 `use_skill` 工具自动调用这些技能，不需要手动选
- 当你说"我要做一个 MoonBit 项目"时，技能会自动触发，从 `moonbit-plan` 开始引导对话

---

## 七个技能：什么时候用哪个？

### 1. moonbit-init — 给项目装上质量门禁

**能力**：在你的 MoonBit 项目中安装 git hooks，让每次 `git commit` 和 `git push` 自动跑检查。

**什么时候用**：
- 刚开始一个新项目，想从第一天就有质量保障
- 接手一个老项目，发现没有 git hooks，想补上
- 团队想统一代码风格和质量标准

**什么时候不要用**：
- 不是 MoonBit 项目（没有 `moon.mod`）— 装不了
- 不是 git 仓库 — 需要先 `git init`
- 只是临时试验代码，不打算提交 — 没必要

**怎么用得好**：
- 安装后建议再装 `moon-audit`（`moon add minie135/moon-audit`），这样 push 前会自动做安全审计
- 如果你在 CI 环境或对安全要求严格，设置 `MOONBIT_STRICT_AUDIT=1`，moon-audit 不可用时会直接阻断
- pre-commit 只做格式和类型检查（<5 秒），不阻塞高频提交；pre-push 做完整测试，保证不把坏代码推到远端

**已知缺陷**：
- 目前只支持 bash 脚本，Windows 用户需要 Git Bash 或 WSL
- 钩子是项目级的（`.githooks/`），不会污染全局 git 配置，但这意味着每个项目需要单独安装一次
- `moon-audit` 需要单独安装，不装也不影响基本使用，只是少了安全审计

---

### 2. moonbit-plan — 动手前先想清楚

**能力**：Agent 会问你一系列问题来澄清需求，然后给出架构方案和 API 设计，你来做决策。

**什么时候用**：
- 开始一个新项目，还没想清楚架构
- 有一个模糊的想法，需要有人帮你梳理
- 要在多个技术方案之间做选择

**什么时候不要用**：
- 已经有一个设计好的方案，只想直接写代码 — 直接跳到 moonbit-implement
- 只是修一个小 bug，不需要重新设计架构
- 只是改几行代码、加一个简单函数

**怎么用得好**：
- 描述需求时尽量具体："我要解析 TOML v1.0，支持嵌套表和数组" 比 "我要解析 TOML" 效果好得多
- 不要怕说"我不确定" — Agent 会给出选项让你选
- 如果你对 API 设计有想法，直接说："我希望 parse 函数返回 Result[Ast, ParseError]"，Agent 会帮你填充细节
- 项目可以同时具备多个能力（比如一个 CLI 工具同时需要解析和异步），不要强行压缩成单一类型

**项目类型支持**：

| 你说的话 | 被识别为 | 会追问什么 |
|---------|---------|-----------|
| "CLI 工具"、"命令行" | cli | 命令/子命令？参数格式？ |
| "C 库绑定"、"FFI" | c-ffi | 链接哪个 C 库？API 数量？ |
| "WASM 模块"、"WASI" | wasm | WASI 版本？需要哪些 WASI 调用？ |
| "解析器"、"Parser" | parser | 什么格式？版本？需要序列化？ |
| "HTTP 服务"、"异步" | async | 需要哪些高层服务？需要 TLS？ |
| "库"、"lib"、"包" | lib | 核心功能？API 最小表面？ |

**已知缺陷**：
- 如果需求描述太模糊，Agent 可能会问很多问题，显得啰嗦。建议先想清楚核心需求再开始
- 不支持图形化界面设计，只做后端/库/CLI 的架构规划
- 架构方案基于内置模式，如果你的项目非常特殊，可能不完全匹配

---

### 3. moonbit-scaffold — 生成项目骨架

**能力**：根据 plan 阶段确定的项目类型，从模板生成一个最小可构建的项目骨架。

**什么时候用**：
- plan 阶段结束后，确认了项目类型和包名，需要生成项目文件
- 想快速搭一个标准化的 MoonBit 项目结构

**什么时候不要用**：
- 已经有一个现成的项目，只是想加新功能 — 直接用 moonbit-implement
- 项目类型不确定 — 先走 moonbit-plan
- 需要高度定制化的项目结构 — 模板只提供标准结构

**怎么用得好**：
- 在 plan 阶段就确定好包名和项目类型，scaffold 只是执行
- 生成后 Agent 会自动跑 `moon fmt --check` + `moon check` + `moon test` 验证骨架可构建
- 如果项目同时需要 parser 或 async 能力，Agent 会在标准模板基础上额外创建对应目录和依赖

**支持的项目类型**：

| 类型 | 模板 | 生成内容 |
|------|------|---------|
| lib | `templates/lib/` | moon.mod, moon.pkg, lib.mbt, test.mbt |
| cli | `templates/cli/` | moon.mod, moon.pkg, main.mbt, test.mbt |
| c-ffi | `templates/c-ffi/` | moon.mod, moon.pkg, ffi.mbt |
| wasm | `templates/wasm/` | moon.mod, moon.pkg, ffi.mbt, test.mbt |

**已知缺陷**：
- `parser` 和 `async` 不是独立项目类型，需要以 lib 或 cli 为主类型，再额外添加目录和依赖
- 模板是标准化的，不适用于非常规项目结构
- 如果 MoonBit 工具链不可用，脚手架验证会失败

---

### 4. moonbit-implement — TDD 方式写代码

**能力**：Agent 按 TDD（测试驱动开发）方式逐个任务实现功能。先写测试 → 写实现 → 验证，失败时自动修复（最多 3 次），超过 3 次会停下来问你。

**什么时候用**：
- 开始写新功能
- 修 bug
- 重构代码
- 任何需要写 MoonBit 代码的场景

**什么时候不要用**：
- 还在设计阶段，没想清楚要写什么 — 先用 moonbit-plan
- 只是想检查代码质量 — 用 moonbit-verify
- 只是想看代码、理解代码 — 直接问就行，不需要进入 implement 模式

**怎么用得好**：
- 一次只做一个任务，不要一口气描述所有功能。Agent 会逐个实现并展示结果
- 每个任务完成后 Agent 会展示结果，你看了觉得不对就马上说"改这里……"，不要等到最后
- 如果 Agent 3 次自动修复都失败了，说明问题可能不是代码层面的，而是设计或理解的偏差，这时候重新描述一下你的意图往往比让 Agent 继续死磕更有效
- 修 bug 时，Agent 会先复现 bug（写一个失败的测试），然后修复，最后验证。这个流程确保 bug 真的被修好了

**各类型的 TDD 策略不同**：

| 项目类型 | 验证重点 |
|---------|---------|
| lib | 公共 API 覆盖率、边界情况、错误处理 |
| cli | 命令解析、参数传递、标准 I/O |
| c-ffi | 从底层 FFI 往外写，内存安全 |
| wasm | 内存操作、边界值、WASI 调用 |
| parser | valid/invalid/edge 三类测试用例 |
| async | 协程测试、超时、取消 |

**已知缺陷**：
- 对 MoonBit 语言特性的理解有限，遇到不常见的类型错误可能需要你介入
- 常见陷阱：`String[i]` 返回 `UInt16` 不是 `Char`、`for (k, v) in map` 不支持元组解构、`match` 不能嵌套在 `+` 操作数中 — 这些 Agent 知道但偶尔还是会踩坑
- 3 次自动修复的上限是硬编码的，复杂问题可能不够用

---

### 5. moonbit-verify — 一站式质量检查

**能力**：跑全量验证管道 — 代码审查 + 格式检查 + 类型检查 + 测试 + 安全审计，一个命令全搞定。

**什么时候用**：
- 写完一段代码，想确认没有引入问题
- 准备提交 PR 前做最终检查
- 不确定代码质量，想全面审查一下
- 合并前做门禁检查

**什么时候不要用**：
- 只想格式化代码 — 直接 `moon fmt` 就行
- 只想跑测试 — 直接 `moon test` 更快
- 代码还在写，频繁检查 — 每次保存时跑全量管道太慢，写完一个阶段再跑

**怎么用得好**：
- 在 `moonbit-implement` 完成每个任务后跑一次，而不是攒到最后才检查
- 代码审查默认只报告问题，不会自动改代码（涉及 public API 的尤其谨慎）。如果你确认没问题，可以让 Agent 自动修复
- 安全审计需要先安装 `moon-audit`（`moon add minie135/moon-audit`），不装也能跑其他检查

**验证管道包含**：

| 步骤 | 命令 | 做什么 |
|------|------|--------|
| 代码审查 | `moon check --warn-list +73` | 检查惯用写法、潜在问题 |
| 格式检查 | `moon fmt --check` | 代码风格一致性 |
| 单元测试 | `moon test --target native` | 所有测试通过 |
| API 稳定性 | `moon info --target native` | 公共 API 无意外变更 |
| 安全审计 | `moon-audit pipeline .` | 14 条 CWE 规则静态扫描 |

**已知缺陷**：
- 代码审查的自动修复只限于机械性修改（如 `Option[T]` → `T?`），涉及 public API 或 ABI 的不会自动改
- `moon-audit` 需要额外安装，不是 MoonBit 工具链自带的
- 目前只支持 native target 的完整验证，跨平台验证（wasm/wasm-gc）需要手动指定

---

### 6. moonbit-evaluate — 验收 + 发布准备

**能力**：做最终验收，生成 README 文档和 CI 配置，准备发布。

**什么时候用**：
- 所有功能开发完成，准备发布
- 想确认代码是否达到发布标准
- 需要生成项目文档和 CI 配置

**什么时候不要用**：
- 代码还在开发中 — 先跑 moonbit-verify 检查质量
- 只是内部使用、不打算发布 — 不需要走发布流程
- 只是想看看进度 — 这不是进度汇报工具

**怎么用得好**：
- 先确保 `moonbit-verify` 全部通过，再走 evaluate，否则会直接返回让你修复
- Agent 生成的 README 是基于 `moon info` 的 API 签名自动提取的，你需要检查一下文档是否准确、示例是否合理
- 发布前检查清单是给你看的，不是自动执行的 — 你需要自己确认版本号、执行 `moon publish`

**发布前检查清单**：

- [ ] 所有测试通过
- [ ] 类型检查无警告
- [ ] 代码格式正确
- [ ] 安全扫描无 error
- [ ] 文档示例可运行
- [ ] 用户确认版本号
- [ ] 用户执行 `moon publish`

**已知缺陷**：
- 自动生成的 README 只是 API 签名的罗列，不包含使用教程或设计理念，需要你手动补充
- CI 配置只生成 GitHub Actions 格式，其他 CI 平台需要自己适配
- 不负责实际的 `moon publish` 执行，那需要你的 mooncakes 账号

---

### 7. moonbit-learn — 从错误中学习，自我优化

**能力**：遇到 bug 时不存档，直接更新技能文件。分析错误原因 → 归类 → 修改对应的技能或参考文件，让 skill 系统持续进化。编译器报错会记录错误码到 `references/error-codes.json`，方便下次快速查表修复。

**什么时候用**：
- `moonbit-implement` 中 3 次自动修复都失败了，用户介入解决了问题 — 自动触发
- 发现了一个新的 MoonBit 语言陷阱，之前没遇到过
- 用户说"记住这个"、"更新一下 skill"
- 发现某个技能文档有遗漏或错误，想补充

**什么时候不要用**：
- 只是一个拼写错误或低级失误 — 不值得更新技能文件
- 问题还没搞清楚原因 — 先弄清楚再说
- 同一个知识点已经存在 — 更新补充，不重复创建

**怎么用得好**：
- bug 修复后顺手说一句"记住这个"，Agent 就会自动分析归类，直接更新对应文件
- 不用手动指定更新哪个文件，Agent 会根据 bug 类别自动决定
- 如果你发现 Agent 反复犯同一个错误，说明之前的更新没到位，手动触发一次 `moonbit-learn` 检查

**直接更新目标（不存档）**：

| 类别 | 示例 | 更新到哪里 |
|------|------|-----------|
| type-error | `String[i]` 返回 `UInt16` 不是 `Char` | `skills/implement/SKILL.md` 常见错误速查表 |
| api-misuse | `@json.parse` 返回 `Json` 不是 `Result` | `references/idioms.md` 对应 API 章节 |
| idiom | `Option[T]` vs `T?` 的选择 | `references/idioms.md` 惯用写法章节 |
| ffi-pitfall | C 内存管理、所有权 | `references/patterns/c-ffi.md` |
| wasm-pitfall | `extern "wasm"` 声明 | `references/patterns/wasm.md` |
| toolchain | 命令参数、版本兼容 | `references/commands.md` |
| logic-error | 空值未处理、边界遗漏 | `skills/implement/SKILL.md` TDD 策略 |

**编译器错误码**：如果 bug 来自 `moon check` 报错，错误码会追加到 `references/error-codes.json`，下次遇到相同错误码直接查表修复。

**已知缺陷**：
- 只追加不删除，如果某个知识点后来被证明是错的，需要手动清理
- 不会自动判断是否"值得更新"——低级错误也可能被更新，靠用户控制
- 更新目标文件时保持原有格式，但如果目标文件格式本身不规范，更新可能不美观

---

## 典型工作流

### 场景一：从零开始一个新项目

```
你："我想写一个 Markdown 解析器"
    ↓ moonbit-plan
Agent：问清楚格式版本、功能范围、是否需要序列化，展示架构方案
你：确认方案，设计 API 签名
    ↓ moonbit-scaffold（可选）
Agent：生成项目骨架
    ↓ moonbit-implement
Agent：逐个任务 TDD 实现，每完成一个展示给你看
你：审查结果，调整方向
    ↓ moonbit-verify
Agent：全量门禁检查
    ↓ moonbit-evaluate
Agent：生成 README + CI，准备发布
```

### 场景二：修一个 bug

```
你："to_string 函数对空数组返回了 null，应该返回 []"
    ↓ moonbit-implement
Agent：写一个复现 bug 的测试 → 确认测试失败 → 修复代码 → 测试通过 → 展示结果
你：确认修复正确
    ↓ moonbit-verify
Agent：全量检查确保修复没有引入新问题
```

### 场景三：检查已有项目

```
你："帮我看看这个项目代码质量怎么样"
    ↓ moonbit-verify
Agent：跑 fmt + check + test + moon-audit，报告所有问题
你：决定哪些要修，哪些可以接受
```

### 场景四：只想要 git hooks

```
你："给这个项目加上 git hooks，提交前自动检查格式和类型"
    ↓ moonbit-init
Agent：检测项目 → 创建 .githooks/ → 配置 git → 验证可用
```

### 场景五：踩坑后自我进化

```
你："这个 bug 是因为 String[i] 返回 UInt16 不是 Char，帮我记住"
    ↓ moonbit-learn
Agent：分析 → 归类为 type-error → 直接更新 skills/implement/SKILL.md 的常见错误速查表
    → 如果是编译器报错，追加错误码到 references/error-codes.json
    → 下次 implement 时，Agent 自动参考，避免重犯
```

---

## 常见问题

### 我必须要按顺序走完所有技能吗？

不需要。技能管线是推荐流程，不是强制流程。你可以：
- 跳过 scaffold（如果项目已经存在）
- 跳过 plan（如果你已经想清楚了）
- 直接在 implement 和 verify 之间来回，直到满意
- 不需要发布的话，永远不用 evaluate

### 我不是 MoonBit 专家，能用到什么程度？

plan 阶段 Agent 会引导你，你只需要描述想做什么。implement 阶段 Agent 会写代码，你审查结果。如果你不确定某个 API 设计好不好，Agent 会给你选项和建议。

### 这些技能会改我的代码吗？

- `moonbit-plan`：只生成文档，不改代码
- `moonbit-scaffold`：生成新文件，不覆盖已有文件
- `moonbit-implement`：写代码，但每步都展示给你看
- `moonbit-verify`：默认只报告问题，不自动改代码（除非你让改）
- `moonbit-learn`：直接更新技能文件（追加内容，不删除），可选记录编译器错误码
- `moonbit-evaluate`：生成文档和 CI 配置，不改业务代码

### Windows 能用吗？

大部分可以。但 git hooks 脚本是 bash 的，Windows 上需要 Git Bash 或 WSL 才能执行。如果你在 Windows 上用 PowerShell，hooks 可能无法直接运行。

### 需要安装什么前置条件？

- MoonBit 工具链（`moon` 命令可用）
- Git
- （可选）`moon-audit`：`moon add minie135/moon-audit`
<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="MoonBit Skills — 你决策，Agent 执行。12 个 AI Agent 技能覆盖 MoonBit 项目全生命周期。">
</p>

这套技能帮助你在 AI Agent（AtomCode、Claude Code、Codex、Cursor 等）的辅助下开发 MoonBit 项目。**你负责做决策，Agent 负责写代码、跑测试、修 bug。**

---

<p align="center">
  <img src="./assets/readme/workflow.svg" width="100%" alt="完整开发管线：plan → writing-plans → scaffold → implement(code-review) → verify → evaluate + 独立技能 init/learn">
</p>

---

<p align="center">
  <img src="./assets/readme/section-quickstart.svg" width="100%" alt="快速开始 — 用自然语言说需求，Agent 自动选择技能">
</p>

你只需要用自然语言描述你想做什么，Agent 会自动选择合适的技能：

```
"帮我初始化这个 MoonBit 项目，配好 git hooks"   → 自动触发 moonbit-init
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
  <img src="./assets/readme/section-install.svg" width="100%" alt="安装方式 — 支持 7 个 AI Agent 平台，装完即用">
</p>

本仓库可作为多种 AI Agent 的插件安装，装完后 12 个技能自动注册到 `/` 菜单。

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

- `/` 菜单出现 `moonbit-skills:moonbit-plan`、`moonbit-skills:moonbit-implement` 等 12 个带命名空间的 skill
- Agent（模型）也可以通过 `use_skill` 工具自动调用这些技能，不需要手动选
- 当你说"我要做一个 MoonBit 项目"时，技能会自动触发，从 `moonbit-plan` 开始引导对话

---

<p align="center">
  <img src="./assets/readme/section-skills.svg" width="100%" alt="十二个技能详解 — init, plan, writing-plans, scaffold, testing, implement, perform, refactor, code-review, verify, evaluate, learn">
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
| 新项目没想好架构；模糊想法需梳理；多方案决策 | 已有设计方案只想写代码（跳到 writing-plans）；修小 bug；简单改代码 | 描述尽量具体；"我不确定"没问题—Agent 给选项；对 API 有想法直接说 | 需求太模糊会问很多问题；不支持 GUI 设计；架构基于内置模式 |

**项目类型识别：**

| 你说的话 | 识别为 | 会追问什么 |
|---------|-------|-----------|
| "CLI 工具" | cli | 命令/子命令？参数格式？ |
| "C 库绑定" | c-ffi | 链接哪个 C 库？API 数量？ |
| "WASM 模块" | wasm | WASI 版本？调用？ |
| "解析器" | parser | 格式？版本？序列化？ |
| "HTTP 服务" | async | 高层服务？TLS？ |
| "库/lib/包" | lib | 核心功能？API 最小表面？ |

### 3. moonbit-writing-plans — 把设计变成可执行任务

**能力**：将 plan 阶段确认的设计拆解为一个个可独立验证的 TDD 实现任务，每任务含完整代码、测试、验证步骤。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| plan 结束后需要拆任务；复杂功能需分步实现；团队需可追溯的执行计划 | 只有一个人快速迭代；任务已经是原子粒度；频繁变更设计 | 在 plan 完成后自动触发；审视每个任务粒度是否合适 | 依赖 plan 的质量；任务粒度需用户确认 |

### 4. moonbit-scaffold — 动态生成项目骨架

**能力**：根据 plan 阶段确认的项目类型，**动态生成**最小可构建的项目骨架，不依赖预置模板。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| plan 结束后需要生成项目文件；快速搭标准化结构 | 已有现成项目只加新功能（用 implement）；项目类型不确定（先 plan） | plan 阶段确定好包名和类型；生成后自动跑验证 | parser/async 不是独立类型；生成内容需用户确认 |

| 类型 | 项目分类 | 生成内容 |
|------|---------|---------|
| lib | library | moon.mod, moon.pkg, lib.mbt, test.mbt |
| cli | main | moon.mod, moon.pkg (pkgtype(kind: "executable")), main.mbt, test.mbt |
| c-ffi | library | moon.mod, moon.pkg, ffi.mbt, lib.mbt, wrapper.c |
| wasm | library | moon.mod, moon.pkg, ffi.mbt, test.mbt |

### 5. moonbit-testing — 测试设计与编写

**能力**：设计测试策略、组织测试文件、编写测试代码。支持 TDD（测试先）、补测试（实现先）、测试重构三类场景。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| 新项目设计测试策略；补测试；测试重构；不确定测试怎么组织 | 只想跑测试（用 verify）；还在实现中（用 implement） | 与 implement 配合：testing 设计 → implement 实现 | 不替代 implement 的 TDD Red 阶段执行 |

### 6. moonbit-implement — TDD 写代码 + Bug 修复

**能力**：双模式实现。**Feature TDD** 模式：先写测试 → 写实现 → 验证，失败时自动修复（最多 3 次）。**Bug Fix 模式**：复现 → 诊断 → 修复 → 验证 → 自动学习。内置 **Iron Law**（无测试/无 regression test 不写代码）和 **Red Flags** 约束机制防止走捷径。测试组织决策遵循 `moonbit-testing` 契约，详见 `references/testing.md`。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| 写新功能；修 bug；调试失败；任何写 MoonBit 代码的场景 | 还在设计阶段（先用 plan）；只检查代码质量（用 verify） | 一次一个任务；每个任务完成后审查结果；3 次失败说明理解偏差，重新描述比死磕有效 | MoonBit 特性理解有限；`String[i]` 返回 `UInt16` 等常见陷阱；3 次上限对复杂问题可能不够 |

**各类型 TDD 策略：**

| 类型 | 验证重点 |
|------|---------|
| lib | 公共 API 覆盖、边界情况、错误处理 |
| cli | 命令解析、参数传递、标准 I/O |
| c-ffi | 从底层 FFI 往外写，内存安全 |
| wasm | 内存操作、边界值、WASI 调用 |
| parser | valid/invalid/edge 三类用例 |
| async | 协程测试、超时、取消 |

### 7. moonbit-perform — 性能优化

**能力**：测量性能基线、定位瓶颈、优化实现、对比验证。独立迭代循环，不改变功能行为。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| 功能正确但性能不达标；需要对比优化方案；性能回归排查 | 功能还未实现（用 implement）；只跑测试（用 verify） | 先建立基线再优化；至少 5-10 次测量取最小值 | MoonBit 官方 bench 工具未发布，当前用计时手段 |

### 8. moonbit-refactor — 重构

**能力**：识别技术债务、确认测试覆盖、小步重构、回归验证。独立迭代循环，不改变可观察行为。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| 代码能跑但质量差；技术债务积累；坏味识别 | 新功能（用 implement）；性能优化（用 perform） | 测试全绿才能重构；每步独立验证 | 重构中可能发现 bug，记录后单独修 |

### 9. moonbit-code-review — 代码审查门禁

**能力**：在每个实现任务完成后执行代码审查，按严重程度（Critical / Important / Minor）分类报告问题，自动修复机械性问题。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| 每个 implement 任务完成后；合并前做最终审查；不确定代码质量 | 还在实现过程中；已经通过 verify 全量检查 | 在 implement 每任务后自动触发；快速定位规范问题 | 自动修复限于机械性问题；不适用于架构级审查 |

### 10. moonbit-verify — 全量六维检测门禁

**能力**：跑全量验证管道 — 按硬性要求（H1-H7 阻断型）和软性要求（S1-S6 加分型）分层检测。区分 main（可执行程序）和 lib（library 库）两种验证路径。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| 写完代码确认无问题；PR 前最终检查；不确定质量想全面审查 | 只想格式化（`moon fmt`）；只想跑测试（`moon test`）；频繁检查太慢 | 每个 implement 任务完成后跑一次，不攒到最后 | 自动修复只限于机械性修改；安全审计需额外装 `moon-audit` |

**硬性要求（必选，阻断型）：**

| # | 要求 | 命令 | 阻断 |
|---|------|------|------|
| H1 | 格式一致性 | `moon fmt --check` | 是 |
| H2 | 类型安全 | `moon check --warn-list +73` | 是 |
| H3 | 功能完整 | `moon test --target native` | 是 |
| H4 | 工作区干净 | `git status --porcelain` | 是（发布阶段） |
| H5 | API 稳定性 | `moon info --target native` | 是 |
| H6 | 可执行验证（main） | `moon run` | 是 |
| H7 | 本地消费验证（lib） | 临时 consumer 编译验证 | 是 |

**软性要求（加分项，可选）：**

| # | 要求 | 命令 |
|---|------|------|
| S1 | 跨平台兼容 | `moon check --target all` |
| S2 | 安全审计 | `moon-audit pipeline .` |
| S3 | 性能基线 | 测试时间对比 |
| S4 | API 深度检查 | StringView/T?/错误处理 |
| S5 | CI 完整性 | `.github/workflows/ci.yml` |
| S6 | 文档完整性 | pub fn docstring / README 示例 / CLI --help |

### 11. moonbit-evaluate — 验收 + 发布准备

**能力**：做最终验收，生成 README 文档、CI 配置和 CHANGELOG，给出 SemVer 版本号建议，准备发布。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| 功能开发完成准备发布；确认达到发布标准；生成文档和 CI | 代码还在开发中（先 verify）；内部使用不发布 | 确保 verify 全部通过再跑；生成的 README/CI/CHANGELOG 需审查 | README 只列 API 签名不含教程；CI 只生成 GitHub Actions；不执行 `moon publish` |

**发布前检查清单：** `moon test` ✓ → `moon info` ✓ → CI 配置 ✓ → CHANGELOG ✓ → SemVer 建议 ✓ → 版本号确认 → `moon publish`

### 12. moonbit-learn — 从错误中学习，自我优化

**能力**：遇到 bug 时不存档，直接分析原因 → 归类 → 更新对应的技能或参考文件，让技能系统持续进化。

| 什么时候用 | 什么时候不要用 | 怎么用得好 | 已知缺陷 |
|-----------|---------------|-----------|---------|
| implement 3 次修复失败后用户介入解决；发现新的 MoonBit 语言陷阱；用户说"记住这个" | 只是拼写错误；问题还没搞清楚原因；知识点已存在 | 修复后说"记住这个"自动触发；不用手动指定更新哪个文件 | 需用户确认根因后才写入；不删除已有条目（仅追加/合并/更新） |

| 类别 | 示例 | 更新目标 |
|------|------|---------|
| type-error | `String[i]` 返回 `UInt16` | `skills/implement/SKILL.md` 速查表 |
| api-misuse | `@json.parse` 返回 `Json` | `references/idioms.md` |
| idiom | `Option[T]` vs `T?` | `references/idioms.md` |
| ffi-pitfall | C 内存管理 | `references/patterns/c-ffi.md` |
| toolchain | 命令参数 | `references/commands.md` |

---

<p align="center">
  <img src="./assets/readme/section-faq.svg" width="100%" alt="常见问题 — 技能管线、使用门槛、Windows 兼容性、多平台支持">
</p>

### 发现设计问题怎么办？

发现设计问题（API 不可测、架构假设错误、性能瓶颈是架构问题、技术债务是设计缺陷）可以触发**设计回溯**，回到 `moonbit-plan` 重新设计。implement/perform/refactor 都可触发。

### 我必须要按顺序走完所有技能吗？

不需要。技能管线是推荐流程，不是强制流程：

```
Plan → [Writing-Plans] → Scaffold → [Testing ↔] Implement → [Code-Review] → [Perform ↔] → [Refactor ↔] → Verify → Evaluate
```

注: Perform 和 Refactor 为可选双向步骤，在 implement 之后、verify 之前。设计回溯可从 implement/perform/refactor 回到 plan。

你可以跳过 scaffold（项目已存在）、跳过 plan（已想清楚）、在 implement 和 verify 之间来回迭代、不需要发布则永远不用 evaluate。Code-review 在每 implement 任务后自动执行。

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

大部分可以。git hooks 脚本是 bash 的，Windows 上需要 Git Bash 或 WSL 才能执行。插件安装和技能使用不受影响。

### 需要安装什么前置条件？

- MoonBit 工具链（`moon` 命令可用）
- Git
- （可选）`moon-audit`：`moon add minie135/moon-audit`

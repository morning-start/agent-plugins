# Claude Code hooks — 规格固化

> **固化于：2026-08-01** · 来源：https://code.claude.com/docs/en/hooks （参考），
> 指南：https://code.claude.com/docs/en/hooks-guide
> **复核**：仅当 Claude Code 发布破坏性 hooks 变更或接线运行时失败时复核。
> 不要预先重搜；为这一端复核时不要动其他端文件。

## 模型

- 钩子是**用户自定义的 shell 命令**、HTTP 端点或 LLM prompt，在 Claude Code
  生命周期的特定点自动执行。
- 输入：JSON 上下文经 **stdin**（command 钩子）或 POST body（HTTP 钩子）传入。
- 输出：可选 JSON 决策，写 stdout。

## 事件与节奏

节奏：

- 每会话一次：`SessionStart`、`SessionEnd`
- 每轮一次：`UserPromptSubmit`、`Stop`、`StopFailure`
- agentic 循环中每次工具调用：`PreToolUse`、`PostToolUse`
  （`EndConversation` 调用两者都跳过）

完整事件表：

| 事件 | 触发时机 |
|-------|-----------|
| `SessionStart` | 会话开始或恢复 |
| `Setup` | `--init-only`，或 `-p` 模式下的 `--init`/`--maintenance`（CI 准备） |
| `UserPromptSubmit` | 提交 prompt 后、Claude 处理前 |
| `UserPromptExpansion` | 用户输入的命令展开为 prompt、到达 Claude 前；可阻断展开 |
| `PreToolUse` | 工具调用前；**可阻断** |
| `PermissionRequest` | 工具调用需要权限决策 |
| `PermissionDenied` | auto 模式分类器拒绝调用；`{retry:true}` 允许模型重试 |
| `PostToolUse` | 工具调用成功后 |
| `PostToolUseFailure` | 工具调用失败后 |
| `PostToolBatch` | 一批并行工具调用全部解析后、下一次模型调用前 |
| `Notification` | Claude Code 发送通知 |
| `MessageDisplay` | 助手消息文本显示期间 |
| `SubagentStart` / `SubagentStop` | 子代理生成 / 结束 |
| `TaskCreated` / `TaskCompleted` | 经 TaskCreate 创建 / 标记完成 |
| `Stop` / `StopFailure` | Claude 完成响应 / 轮次因 API 错误结束 |
| `TeammateIdle` | agent 团队队友即将空闲 |
| `InstructionsLoaded` | CLAUDE.md 或 `.claude/rules/*.md` 加载进上下文 |
| `ConfigChange` | 会话中配置文件变更 |
| `CwdChanged` | 工作目录变更（如 `cd`） |
| `FileChanged` | 被监视文件在磁盘上变更（`matcher` = 要监视的文件名） |
| `WorktreeCreate` / `WorktreeRemove` | worktree 创建 / 移除 |
| `PreCompact` / `PostCompact` | 上下文压缩前 / 后 |
| `Elicitation` | MCP 服务器请求用户输入 |

## 配置字段

公共字段：

| 字段 | 说明 |
|-------|-------|
| `if` | 一条权限规则（匹配器）；仅在 `PreToolUse`、`PostToolUse`、`PostToolUseFailure`、`PermissionRequest`、`PermissionDenied` 上求值；不支持 `&&`/`||` |
| `timeout` | 秒；默认：600（`command`/`http`/`mcp_tool`）、30（`prompt`）、60（`agent`）；`UserPromptSubmit` 降到 30、`MessageDisplay` 降到 10；`SessionEnd` 钩子共享 1.5 秒预算（最高 60 秒） |
| `statusMessage` | 钩子运行时显示的自定义 spinner 消息 |
| `once` | 每会话只跑一次；**仅在技能 frontmatter 中生效**，settings/agents 中忽略 |

command 钩子字段：

| 字段 | 说明 |
|-------|-------|
| `command` | 要执行的 shell 命令（shell 形式） |
| `args` | 设置后 `command` 作为可执行文件直接 spawn、不经 shell（exec 形式） |
| `async` | 后台运行、不阻断 |
| `asyncRewake` | 后台 + 退出码 2 时唤醒 Claude；隐含 `async`；stderr（或空时 stdout）作为 system reminder 展示 |
| `shell` | `"bash"` 或 `"powershell"`；默认 `bash`，Windows 无 Git Bash 时默认 `powershell`；设置 `args` 时忽略 |

## 输出 / 决策控制（stdout JSON）

形状：`{ "hookSpecificOutput": { "hookEventName": "<事件>", ... } }`

| 字段 | 含义 |
|-------|---------|
| `decision` | `approve` / `block` / `stop`（如 `PreToolUse` 可阻断工具调用；`Stop` 可延续会话） |
| `retry` | `PermissionDenied`：`true` 允许模型重试被拒调用 |
| `additionalContext` | 注入 Claude 上下文的字符串（system reminder）：会话开头（`SessionStart`/`Setup`/`SubagentStart`）、随 prompt（`UserPromptSubmit`/`UserPromptExpansion`）、紧邻工具结果（`PreToolUse`/`PostToolUse`/`PostToolUseFailure`/`PostToolBatch`）、或轮次末尾（`Stop`/`SubagentStop`）。>10,000 字符 → 写入会话文件、传路径+预览。写成事实陈述而非祈使指令（避免触发 prompt-injection 防御）。 |
| `terminalSequence` | OSC 777 通知序列白名单（urxvt/Ghostty/Warp/BEL）；拒绝光标/颜色/OSC 8/52/1337 序列 |

## 多 shell（佐证 plugin-factory 的质量栏）

Claude Code 每个 hook 原生支持 `shell: "bash"` 或 `shell: "powershell"`——
hook 应写成 `.sh` + `.ps1` 成对，经 `shell` 字段接线。

## 钩子来源

- `settings.json` → `"hooks"` 键
- 插件 manifest（`.claude-plugin/`）
- 技能 frontmatter（`once` 仅此处生效）

## ⚠️ 接线时待核实（M1）

- 完整的退出码表与各事件完整输入 JSON schema，超出本文件固化内容的
  （复核时查本文件头部的来源 URL）。

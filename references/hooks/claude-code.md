# Claude Code hooks — 规格固化

> **Captured: 2026-08-01** · Source: https://code.claude.com/docs/en/hooks (reference),
> guide: https://code.claude.com/docs/en/hooks-guide
> **Re-verify**: only when Claude Code ships a breaking hooks change or wiring fails at
> runtime. Do not re-search pre-emptively; do not edit other harness files for this one.

## Model

- Hooks are user-defined **shell commands**, HTTP endpoints, or LLM prompts that run at
  lifecycle points.
- Input: JSON context on **stdin** (command hooks) or POST body (HTTP hooks).
- Output: optional JSON decision on stdout.

## Events and cadence

Cadences:

- once per session: `SessionStart`, `SessionEnd`
- once per turn: `UserPromptSubmit`, `Stop`, `StopFailure`
- every tool call in the agentic loop: `PreToolUse`, `PostToolUse`
  (`EndConversation` calls skip both)

Full event list:

| Event | Fires when |
|-------|-----------|
| `SessionStart` | session begins or resumes |
| `Setup` | `--init-only`, or `--init`/`--maintenance` in `-p` mode (CI prep) |
| `UserPromptSubmit` | prompt submitted, before Claude processes it |
| `UserPromptExpansion` | user-typed command expands into a prompt; can block the expansion |
| `PreToolUse` | before a tool call; **can block** |
| `PermissionRequest` | tool call needs a permission decision |
| `PermissionDenied` | auto-mode classifier denied a call; `{retry:true}` lets the model retry |
| `PostToolUse` | after a tool call succeeds |
| `PostToolUseFailure` | after a tool call fails |
| `PostToolBatch` | full batch of parallel tool calls resolves, before next model call |
| `Notification` | Claude Code sends a notification |
| `MessageDisplay` | assistant message text is displayed |
| `SubagentStart` / `SubagentStop` | subagent spawned / finished |
| `TaskCreated` / `TaskCompleted` | task created / marked completed via TaskCreate |
| `Stop` / `StopFailure` | Claude finished responding / turn ended on API error |
| `TeammateIdle` | agent-team teammate about to go idle |
| `InstructionsLoaded` | CLAUDE.md or `.claude/rules/*.md` loaded into context |
| `ConfigChange` | config file changes during a session |
| `CwdChanged` | working directory changes (e.g. `cd`) |
| `FileChanged` | watched file changes on disk (`matcher` = filenames to watch) |
| `WorktreeCreate` / `WorktreeRemove` | worktree created / removed |
| `PreCompact` / `PostCompact` | before / after context compaction |
| `Elicitation` | MCP server requests user input |

## Config fields

Common fields:

| Field | Notes |
|-------|-------|
| `if` | one permission rule (matcher); only evaluated on `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `PermissionDenied`; no `&&`/`||` |
| `timeout` | seconds; defaults: 600 (`command`/`http`/`mcp_tool`), 30 (`prompt`), 60 (`agent`); `UserPromptSubmit` lowers to 30, `MessageDisplay` to 10; `SessionEnd` hooks share a 1.5 s budget (up to 60 s) |
| `statusMessage` | custom spinner message while the hook runs |
| `once` | run once per session; honored **only in skill frontmatter**, ignored in settings/agents |

Command-hook fields:

| Field | Notes |
|-------|-------|
| `command` | shell command to execute (shell form) |
| `args` | when set, `command` is an executable spawned directly with no shell (exec form) |
| `async` | run in background without blocking |
| `asyncRewake` | background + wake Claude on exit code 2; implies `async`; stderr (or stdout) shown as system reminder |
| `shell` | `"bash"` or `"powershell"`; default `bash`, or `powershell` on Windows when Git Bash is absent; ignored when `args` is set |

## Output / decision control (JSON on stdout)

Shape: `{ "hookSpecificOutput": { "hookEventName": "<event>", ... } }`

| Field | Meaning |
|-------|---------|
| `decision` | `approve` / `block` / `stop` (e.g. `PreToolUse` can block a tool call; `Stop` can continue the conversation) |
| `retry` | `PermissionDenied`: `true` lets the model retry the denied call |
| `additionalContext` | string injected into Claude's context as a system reminder: at conversation start (`SessionStart`/`Setup`/`SubagentStart`), alongside the prompt (`UserPromptSubmit`/`UserPromptExpansion`), next to the tool result (`PreToolUse`/`PostToolUse`/`PostToolUseFailure`/`PostToolBatch`), or at end of turn (`Stop`/`SubagentStop`). >10,000 chars → written to a session file, path + preview passed instead. Write factual statements, not imperative instructions (avoids prompt-injection defenses). |
| `terminalSequence` | OSC 777 notification sequence allowlist (urxvt/Ghostty/Warp/BEL); cursor/color/OSC 8/52/1337 sequences rejected |

## Multi-shell (validates plugin-factory's bar)

Claude Code natively supports `shell: "bash"` or `shell: "powershell"` per hook —
hooks should be authored as `.sh` + `.ps1` pairs and wired via the `shell` field.

## Hook sources

- `settings.json` → `"hooks"` key
- plugin manifests (`.claude-plugin/`)
- skill frontmatter (`once` is honored only here)

## ⚠️ Remaining verify-at-wiring (M1)

- Full exit-code table and complete per-event input JSON schemas beyond what is pinned
  above (check the pinned source URL in this file's header when wiring the adapter).

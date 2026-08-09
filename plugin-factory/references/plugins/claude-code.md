# Claude Code plugin 格式 — 规格固化

> **固化于：2026-08-01** · **2026-08-09 复核（指南 v2.0 实操版）** · 来源：
> - 创建指南: https://code.claude.com/docs/en/plugins （Create plugins）
> - 完整技术规格: https://code.claude.com/docs/en/plugins-reference
> - 中文参考: https://code.claude.com/docs/zh-CN/plugins-reference
> - 市场/目录: https://claude.com/plugins
> - 分发: https://code.claude.com/docs/en/plugin-marketplaces、https://code.claude.com/docs/en/discover-plugins
> **复核**：仅当插件格式破坏性变更时复核。不要预先重搜。

## 模型：standalone vs 插件

| | Standalone（`.claude/`） | 插件（独立目录） |
|---|---|---|
| 技能名 | `/hello` | `/plugin-name:hello`（命名空间，无冲突） |
| 适用 | 个人 / 单项目 / 实验 | 分享、分发、版本化发布 |
| hooks | 在 `settings.json` | 在 `hooks/hooks.json`（格式相同） |

先用 standalone 快速迭代，分享时迁移为插件。

## 插件结构

每个插件位于**自己的目录**，包含 skills、agents、commands、hooks、tools、
MCP/LSP 或 monitors，可选带 `.claude-plugin/plugin.json` manifest：

```
my-plugin/
├── .claude-plugin/plugin.json   # 身份：name, description, version
├── skills/                      # 命名空间 /my-plugin:skill-name
├── agents/                      # 子代理（Markdown，见下）
├── commands/
├── hooks/
│   └── hooks.json               # 格式与 settings.json 的 "hooks" 对象一致
├── tools/<tool-name>/index.ts   # 自定义工具（TypeBox schema）
├── mcp.json                     # MCP server 配置
├── lsp.json                     # LSP server 配置
├── monitors/monitors.json       # 后台监控（stdout 作为通知）
├── themes/<theme-name>.json     # 主题
└── (rules/, references/, scripts/, tests/ — plugin-factory 扩展)
```

**结构规则**：
- 若插件**没有** `skills/` 目录且无 skills manifest 字段，根目录的 `SKILL.md`
  会作为单个 skill 加载——注意显式设置 frontmatter `name`（否则回退到安装
  目录名，市场安装时每次更新都会变）。
- **路径可移植性**：所有路径引用使用 `${CLAUDE_PLUGIN_ROOT}` 变量
  （相对插件根，与调用者 cwd 无关）——这是打包规范的一部分。

### Agents（子代理）

`agents/<name>.md`，Claude 可在适当时**自动调用**。frontmatter 字段：

| 字段 | 说明 |
|------|------|
| `name` | 代理名称 |
| `description` | 专长描述及调用时机 |
| `model` | 使用的模型（如 sonnet） |
| `effort` | 努力程度 |
| `maxTurns` | 最大轮数 |
| `disallowedTools` | 禁用的工具列表 |

> **实测契约（ECC）**：agent frontmatter 的 `tools` 用**标量**（与
> plugin.json 的数组规则相反）。

### Boolean frontmatter 兼容值

`disable-model-invocation` 等字段接受 `yes/no/on/off/1/0`（任意大小写）以及
`true/false`；**v2.1.218 之前只识别 true/false**（版本兼容注意）。

### Manifest（`plugin.json`）

#### 必需字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 唯一标识符（kebab-case，无空格），命名空间组件（`<plugin>:<component>`） |

**只有 `name` 是必需字段**。省略清单时，Claude Code 自动从默认位置发现组件，
并从目录名称派生插件名。

#### 元数据字段

| 字段 | 说明 | 版本要求 |
|------|------|----------|
| `$schema` | 编辑器 JSON Schema URL | 加载时忽略 |
| `displayName` | UI 中人类可读名称（可含空格） | v2.1.143+ |
| `version` | SemVer；设置后用户仅在你提升版本时收到更新 | 可选 |
| `description` | 一行功能描述 | 推荐 |
| `author` | `{name, email, url}` | 可选 |
| `homepage` / `repository` / `license` / `keywords` | 发现与归属元数据 | 可选 |
| `defaultEnabled` | 安装时是否默认启用（默认 true）；有成本/外部连接的插件设 false | v2.1.154+ |

#### 组件路径字段

| 字段 | 行为 | 默认位置 |
|------|------|----------|
| `skills` | **添加到默认值**（始终扫描 `skills/`） | `skills/` |
| `commands` | **替换默认值** | `commands/` |
| `agents` | **替换默认值** | `agents/` |
| `hooks` | 自己的合并规则 | `hooks/hooks.json` |
| `mcpServers` | 自己的合并规则 | `.mcp.json` |
| `outputStyles` | **替换默认值** | `output-styles/` |
| `lspServers` | 自己的合并规则 | `.lsp.json` |
| `experimental.themes` | **替换默认值** | `themes/` |
| `experimental.monitors` | **替换默认值** | `monitors/monitors.json` |

**路径规则**：所有路径相对插件根、以 `./` 开头；可指定为数组；
替换型字段要保留默认值需显式列出（`"commands": ["./commands/", "./extras/"]`）。

#### userConfig（用户配置系统）

声明用户可配置值，经 UI 对话框提示输入：

```json
{
  "userConfig": {
    "api_endpoint": { "type": "string", "title": "API endpoint", "description": "Your team's API" },
    "api_token": { "type": "string", "title": "API token", "sensitive": true }
  }
}
```

字段规范：`type`（string/number/boolean/directory/file，必填）、`title`（必填）、
`description`（必填）、`sensitive`（掩盖输入，存 Keychain）、`required`、`default`、
`multiple`、`min/max`。使用：MCP/LSP/hook 配置中 `${user_config.KEY}` 替换；
环境变量 `CLAUDE_PLUGIN_OPTION_<KEY>`（大写）。⚠️ **shell 形式的 hook/monitor
命令拒绝 `${user_config.*}` 替换**（安全）——用执行形式 + args 或从环境读取。
存储：非敏感值 → `settings.json` 的 `pluginConfigs.<id>.options`；敏感值 →
macOS Keychain 或 `~/.claude/.credentials.json`。

#### dependencies（依赖管理）

```json
{ "dependencies": ["helper-lib", { "name": "secrets-vault", "version": "~2.1.0" }] }
```

运行时依赖安装到 `${CLAUDE_PLUGIN_DATA}`（持久目录），推荐模式：
SessionStart hook 用 `diff -q` 检测 `package.json` 变化 → 复制 + `npm install`；
MCP server 用 `NODE_PATH: "${CLAUDE_PLUGIN_DATA}/node_modules"`。

#### channels（消息频道）

```json
{ "channels": [{ "server": "telegram", "userConfig": { "bot_token": { "type": "string", "title": "Bot token", "sensitive": true } } }] }
```

`server` 必须匹配 `mcpServers` 中的键；每个 channel 可有独立 `userConfig`。

#### 实测契约（2026-08-01 吸收自 ECC `PLUGIN_SCHEMA_NOTES.md` — 校验器未公开但强制）

- `version` **必填**：示例文档常省略，但 marketplace 安装 / CLI 校验会因缺失失败。
- `skills` / `commands` / `hooks` **必须是数组**：即使只有一项也不能用字符串，
  否则报模糊错误（如 `agents: Invalid input`）。
- agent Markdown frontmatter 的 `tools` 用**标量**（与 plugin.json 的数组规则相反）。
- 修改 plugin.json 前先读契约；这些规则来自真实安装失败，防静默破坏与回归。

> 官方 `plugins-reference` 完整 schema 已按 2026-08-09 指南复核；上述实测约束
> 仍覆盖最常见安装失败点。

### 插件内的 hooks

`hooks/hooks.json` 与 `settings.json` 的 `hooks` 对象**同格式**——迁移时原样复制：

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npm run lint:fix" }] }
    ]
  }
}
```

## 测试与验证

- 本地加载：`claude --plugin-dir ./my-plugin`。然后逐个测试命令、agents
  （`/context`）与每个被挂钩的事件；命中的钩子会出现在调试日志。
- **热重载**：`/reload-plugins` 会话中途应用插件更改，无需重启；
  配置未变的 MCP server 保持活跃连接，已更改的自动重连。
- **验证已加载内容**：`claude -p '/extensions'` 列出所有已解析的扩展
  （skill/command/hook/tool/MCP/theme 及其来源）。
- **CLI 验证**：`claude plugin validate ./my-plugin`（`--strict` 将警告视为错误）；
  `claude plugin details <name>` 查看组件清单与 token 成本估算。
- **排障**：`claude --debug` 排查 LSP/MCP 初始化失败；检查
  `/plugin Errors` 选项卡（Executable not found 等）。
- **版本兼容注意**：`restartOnCrash` / `shutdownTimeout` 需要 v2.1.205+；
  初始化失败的 LSP server 在 v2.1.205 前仍会声明扩展名并阻塞其他 server；
  `defaultEnabled` v2.1.154+；`plugin prune` v2.1.121+；
  `${user_config.*}` 在 shell 中的行为变更 v2.1.207+。

## 安装范围与发现机制

四种安装范围：**user**（`~/.claude/settings.json`，个人）、**project**
（`.claude/settings.json`，团队共享、需 trust）、**local**
（`.claude/settings.local.json`，gitignored、需 trust）、**managed**
（托管、只读）。安装命令 `claude plugin install <plugin> [-s user|project|local]`。

**Skills Directory Plugins（零安装发现）**：任何 `skills/` 目录下含
`.claude-plugin/plugin.json` 的文件夹自动作为 `<name>@skills-dir` 加载，
无需安装步骤。项目级（`<cwd>/.claude/skills/`）MCP 需 per-server approval、
LSP 需信任工作区、background monitors 不加载。

## 环境变量与路径系统

| 变量 | 解析为 | 用途 |
|------|--------|------|
| `${CLAUDE_PLUGIN_ROOT}` | 插件安装目录绝对路径 | 捆绑脚本/二进制/配置 |
| `${CLAUDE_PLUGIN_DATA}` | 持久目录（更新后保留） | node_modules/Python venv/缓存 |
| `${CLAUDE_PROJECT_DIR}` | 项目根目录 | 项目本地脚本/配置 |

占位符在 skill/agent 内容、hook/monitor 命令、MCP（command/args/env/url）、
LSP（command/args/env/workspaceFolder）中解析。⚠️ 已安装插件**无法引用目录外
文件**（`../shared-utils` 无效）；插件内符号链接在缓存中保留为相对链接、
市场内其他插件被解引用复制、市场外路径跳过。

## 版本管理与发布

- **版本解析优先级**：`plugin.json` version → marketplace 条目 version →
  Git 提交 SHA → `unknown`。
- **两种策略**：显式版本（`"version": "2.1.0"`，仅提升时用户收到更新，稳定发布）；
  Git SHA（省略 version，每次提交视为新版本，快速迭代/内部插件）。
- **发布打标**：`claude plugin tag --push`（创建 tag 并推送）、`--dry-run` 预览。
- **CLI 命令全集**：`plugin init|new`（脚手架，`--with skills hooks mcp lsp
  output-style channel`）、`install`、`uninstall|remove|rm`（`--keep-data`/
  `--prune`）、`prune|autoremove`、`enable/disable`、`update`、`list|ls`、
  `details`、`tag`、`validate --strict`。
- **数据目录生命周期**：`${CLAUDE_PLUGIN_DATA}` 更新后保留前版本约 7 天、
  从最后一个范围卸载时自动删除、CLI 默认删除（`--keep-data` 保留）。

## 迁移（standalone → 插件）

1. `mkdir -p my-plugin/.claude-plugin` + 写 `plugin.json`（name/description/version）。
2. `cp -r .claude/commands my-plugin/`（`agents`、`skills` 同理）。
3. hooks：建 `my-plugin/hooks/` + 从 settings 复制 `hooks.json`。
4. 用 `--plugin-dir` 测试；之后从 `.claude/` 删除原件。

## 分发

- Marketplace：`plugin-marketplaces` 文档；`/plugin install` 安装、
  `/plugin marketplace add` 添加。
- 目录提交：https://clau.de/plugin-directory-submission（M0–M4 范围外）。

## 对 plugin-factory 的含义

- 生成的 Claude Code 插件 = manifest + 根部 `skills/`/`commands/`/`agents/` +
  `hooks/hooks.json`；技能命名空间 `<插件名>:<技能>`。
- plugin-factory 自身的 `.claude-plugin/plugin.json`（name/description/version/tags）
  与已核实字段集一致。

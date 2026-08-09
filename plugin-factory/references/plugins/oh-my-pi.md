# oh-my-pi (omp) plugin 格式 — 规格固化

> **固化于：2026-08-01** · 来源：
> - 官网: https://omp.sh （docs 页 JS-rendered，抓取不到内容 — URL 固化）
> - GitHub: https://github.com/can1357/oh-my-pi （README + issue #433 维护者回复，已核实）
> - npm: https://www.npmjs.com/package/@oh-my-pi/pi-coding-agent
> - 插件/marketplace 源文档（仓库 docs/，已抓取固化）: `docs/marketplace.md` ·
>   `docs/plugin-manager-installer-plumbing.md` · `docs/extensions.md` ·
>   `docs/porting-from-pi-mono.md`
> **复核**：仅当 omp 插件格式破坏性变更时复核。不要预先重搜。

## omp 是什么

**oh-my-pi (omp)** 是 **Pi 的 fork**（badlogic/pi-mono，作者 mariozechner），重写为
coding-first 的终端 Agent（TypeScript/MIT，~19K stars）。核心包 `@oh-my-pi/pi-coding-agent`。
OMP 的插件系统同时兼容 **Claude Code** 与 **Pi** 两种形态。

安装: `curl -fsSL https://omp.sh/install | sh`（Windows: `irm https://omp.sh/install.ps1 | iex`）、
`bun install -g @oh-my-pi/pi-coding-agent`、`brew install can1357/tap/omp`。

## 四大核心命令

| 命令 | 效果 | 说明 |
|------|------|------|
| `omp install <source>` | 安装到 `~/.omp/plugins/` | 支持 npm/git/本地路径/marketplace 来源 |
| `omp remove <name>` | 卸载并注销所有 surfaces | 清理彻底（反向撤销所有合并） |
| `omp update [name]` | 重新获取已安装插件 | 批量更新 |
| `omp list` | 显示已安装插件 | 含来源、版本、作用域 |

- **项目级操作**：加 `-l`（`--scope project`）对当前仓库 `.omp/plugins/` 操作；
  项目级安装**遮蔽**用户全局同名插件。团队共享：可将
  `.omp/plugins/installed_plugins.json` 提交到仓库。
- **开发热更新**：本地路径安装使用 **symlink + 文件监控**，修改即时生效，
  无需重装。

## 插件格式（双形态）

### 形态 A — Claude Code 兼容（首选）

OMP 的插件根布局直接镜像扩展目录结构，安装时把**每个子目录合并到对应的
发现表面（discovery surfaces）**：

```
my-plugin/
├── plugin.json              # name, version, description, entry points
├── skills/<name>/SKILL.md   # → 技能
├── commands/<name>.md       # → 命令模板
├── hooks/pre/*.ts           # → 前置钩子
├── hooks/post/*.ts          # → 后置钩子
├── tools/<name>/index.ts    # → 自定义工具（TypeBox schema）
├── mcp.json                 # → mcpServers 条目
├── themes/<name>.json       # → 主题
└── README.md
```

`plugin.json` 核心字段：`name`、`version`、`description`（必填）。
卸载时**反向撤销**所有合并操作。marketplace 目录格式
`.claude-plugin/marketplace.json` **与 Claude Code 兼容**——已有的
Claude Code catalogs 可直接在 OMP 使用。

### 形态 B — Pi 扩展（兼容）

- 插件 manifest 从 **package.json 的 `omp`（或 `pi`）字段**读取（源码:
  `installer.ts` / `manager.ts` 读 `pkg.omp || pkg.pi`），支持 `extensions[]` 键
  （`PluginManifest.extensions?: string[]`，issue #433 已确认实现于 main v15.10.2）：

```json
{
  "name": "<plugin-name>",
  "version": "0.1.0",
  "omp": { "extensions": [".pi/extensions/<plugin-name>.ts"], "skills": ["skills"] },
  "pi":  { "extensions": [".pi/extensions/<plugin-name>.ts"], "skills": ["skills"] }
}
```

- 扩展即 **TypeScript 模块**：与内置工具同 API、同 slash-command 注册表、同 hotkey
  表、同 TUI 原语（"Nothing is reserved"）。
- **扩展接口与 pi 兼容**（issue #433: "most of their own extension interfaces are the
  same as those of omp"）→ 完整扩展 API/事件见 `hooks/pi.md`（pi/omp 共用）。
- 重新加载: `/reload-plugins`。

## 安装来源（Sources）

| 类型 | 示例 |
|------|------|
| npm 包 | `omp install @scope/plugin-foo`、`omp install my-plugin@^1.2.0` |
| git 仓库 | `omp install github:user/repo`、`omp install user/repo#v1.0.0` |
| 本地路径 | `omp install ./path/to/plugin`（symlink + watch，开发神器） |
| marketplace | `omp marketplace add anthropics/claude-plugins-official` → `omp install code-review@claude-plugins-official` |

## Marketplace（插件市场）

- 兼容 **Claude Code 插件注册表格式**：catalog 位于 `.omp-plugin/marketplace.json`
  （优先）或 `.claude-plugin/marketplace.json`（Claude Code 兼容回退；可两者并存，
  omp 读 `.omp-plugin/`，Claude Code 读 `.claude-plugin/`）。格式同
  Claude Code 的 marketplace.schema.json。
- 命令: `/marketplace add|remove|update|list|discover|install|uninstall|upgrade`、
  `/plugins list|enable|disable`；CLI 等价: `omp plugin marketplace ...`、
  `omp plugin install [--scope user|project] name@marketplace`。
- 插件 ID: `name@marketplace`（name ≤64 字符：小写字母/数字/连字符/点，首尾字母数字；
  ID 总长 ≤128）。插件 = 含 skills/commands/agents/hooks/tools/MCP/LSP 的目录。
- 作用域: user（`~/.omp/plugins/installed_plugins.json`）与 project
  （`.omp/plugins/installed_plugins.json`）；project 遮蔽 user。
- 来源: 相对路径 / git URL / GitHub shorthand / git-subdir；
  **npm 来源解析但暂不可安装**（"npm plugin sources are not yet supported"）。
- 安装后经 node_modules 符号链接 + `omp-plugins.lock.json` 接入运行时，
  与 npm/link 插件同一表面；`doctor --fix` 可修复状态漂移。
- 项目级覆盖: `<cwd>/.omp/plugin-overrides.json`（只读，可禁用插件/覆盖 feature）。

## pi 兼容性与特性差异（注意点）

| 维度 | pi (pi-mono) | omp (oh-my-pi) |
|------|--------------|----------------|
| manifest 字段 | `pkg.pi` | `pkg.omp` 优先，回退 `pkg.pi`（两者都写最稳） |
| TS 加载 | jiti | 原生 Bun `import()` |
| 参数 schema | typebox `Type.Object` / `StringEnum`(pi-ai) | `pi.zod`（zod）或 `pi.typebox` 的 `Type.Enum`；**`StringEnum` 已移除** |
| 包导入 scope | `@mariozechner/*`、`@earendil-works/*` | 移植时改为 `@oh-my-pi/*` |
| 工具函数 | `formatSize`(pi-coding-agent) | `formatBytes`(`@oh-my-pi/pi-utils`) |
| 运行时装配 | DefaultResourceLoader / SettingsManager / createEventBus | capability 系统（defineCapability/loadCapability）+ Settings 单例 + EventBus |
| hooks | 事件 API | **hooks 是独立 legacy API**（`src/extensibility/hooks/*`），与 extensions 分开；首选 extensions |

**结论**: pi 插件/扩展大体可直接在 omp 运行（同为 default-factory + ExtensionAPI 模式），
但含 `@mariozechner/*`/`@earendil-works/*` 导入、`StringEnum`、`formatSize` 的扩展需按
上表适配；生成插件时包内导入应**直接使用 `@oh-my-pi/*` scope**。

## ⚠️ 待接线时核实（M2）

- `PluginManifest` 完整字段：`extensions[]` 已确认；`skills`/`prompt` 键在 omp 侧
  的具体形状待验证（issue #433 讨论中提及 pi-mono packages.md 有相关概念）。
- omp.sh 的 docs/plugins 页面为 JS 渲染无法直接抓取；其内容已从仓库 `docs/` 源文件
  固化（marketplace.md / plugin-manager-installer-plumbing.md / extensions.md /
  porting-from-pi-mono.md，2026-08-01）。

## 对 plugin-factory 的含义

- **双形态并写**：生成的插件同时具备形态 A（根 `plugin.json` + `skills/`/
  `commands/`/`hooks/pre|post` 目录——OMP 的 Claude Code 兼容表面）与形态 B
  （`package.json` 的 `pi`/`omp` 字段 + `.pi/extensions/<插件名>.ts`），
  同一产物兼容 Claude Code、pi、omp 三端安装。
- 生成 `.pi/extensions/<插件名>.ts`（pi/omp 共用）；扩展 API 见 `hooks/pi.md`。
- plugin-factory 自身（当前项目）应同步在 package.json 增加 `omp` 字段以支持
  `omp plugin install git:...` 安装（M2 落实）。

# Claude Code plugin 格式 — 规格固化

> **固化于：2026-08-01** · 来源：
> - 创建指南: https://code.claude.com/docs/en/plugins （Create plugins）
> - 完整技术规格: https://code.claude.com/docs/en/plugins-reference ⚠️（固化日网络受限；M1 接线时核实）
> - 市场/目录: https://claude.com/plugins （已抓取）
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

每个插件位于**自己的目录**，包含 skills、agents、commands 或 hooks，
可选带 `.claude-plugin/plugin.json` manifest：

```
my-plugin/
├── .claude-plugin/plugin.json   # 身份：name, description, version
├── skills/                      # 命名空间 /my-plugin:skill-name
├── agents/
├── commands/
├── hooks/
│   └── hooks.json               # 格式与 settings.json 的 "hooks" 对象一致
└── (rules/, references/, scripts/, tests/ — plugin-factory 扩展)
```

### Manifest（`plugin.json`）

已核实字段（来自指南）：`name`、`description`、`version`。
完整 schema（author、license、tags、homepage、repository、dependencies…）在
`plugins-reference` ⚠️——接线时查该来源。

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

## 测试

本地加载：`claude --plugin-dir ./my-plugin`。然后逐个测试命令、agents
（`/context`）与每个被挂钩的事件；命中的钩子会出现在调试日志。

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

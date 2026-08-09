# Codex / ChatGPT plugin 格式 — 规格固化

> **固化于：2026-08-09** · 来源：
> - 构建指南(EN): https://www.codex-docs.com/docs/build-plugins ·
>   https://learn.chatgpt.com/docs/build-plugins
> - 帮助中心: https://help.openai.com/en/articles/20001256
> - 本地市场: `$REPO_ROOT/.agents/plugins/marketplace.json`（仓库级）、
>   `~/.agents/plugins/marketplace.json`（个人级）
> **复核**：仅当 Codex/ChatGPT 插件格式破坏性变更时复核。不要预先重搜。

## 模型

- 插件是一个**可安装的工作流包**，含 Skills（指令/提示词/工作流模式）、
  Apps（连接器映射）、App Templates、MCP Servers（远程工具/共享上下文）。
- ChatGPT 与 Codex **共享通用插件目录（Universal Plugin Directory）**——
  发布一次，两个产品都可发现。
- 开发阶段用**本地市场（Local Marketplace）**测试，再提交公开目录。

## 插件结构（生成项目）

```
<plugin>/
├── .codex-plugin/
│   └── plugin.json          # 必须 — 插件清单文件
├── skills/<skill-name>/SKILL.md   # 技能（Agent Skills 标准）
├── .app.json                # App 关联配置（可选）
├── .mcp.json                # MCP server 配置（可选）
└── assets/                  # icon.png / logo.png（可选）
```

**结构规则**：只有 `plugin.json` 放在 `.codex-plugin/` 下；`skills/`、`assets/`、
`.app.json`、`.mcp.json` 都在插件根目录。

## Manifest（`.codex-plugin/plugin.json`）

必需字段：`name`（kebab-case 稳定标识符）、`version`（SemVer）、
`description`（一行）、`skills`（技能目录路径，string/array）。

```json
{
  "name": "my-first-plugin",
  "version": "1.0.0",
  "description": "Reusable greeting workflow",
  "skills": "./skills/"
}
```

可选字段：`author`、`license`、`homepage`、`repository`、`keywords`、
`mcpServers`、`apps`；`interface` 对象提供展示元数据（displayName、
shortDescription、longDescription、category、screenshots 等）。

## 本地市场（Local Marketplace）

市场是描述插件列表的 JSON 目录，可放：

| 来源 | 路径 | 适用场景 |
|------|------|----------|
| 官方目录 | OpenAI 精选公开 Plugin Directory | 所有用户 |
| 仓库级市场 | `$REPO_ROOT/.agents/plugins/marketplace.json` | 团队/项目共享 |
| 个人级市场 | `~/.agents/plugins/marketplace.json` | 个人跨项目复用 |

```json
{
  "name": "local-repo",
  "interface": { "displayName": "My Local Repo Plugins" },
  "plugins": [
    {
      "name": "my-plugin",
      "source": { "source": "local", "path": "./plugins/my-plugin" },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
      "category": "Productivity"
    }
  ]
}
```

市场条目规则：`source.path` 用相对市场根的 `./` 前缀；每条含
`policy.installation`（AVAILABLE / INSTALLED_BY_DEFAULT / NOT_AVAILABLE）、
`policy.authentication`、`category`。来源支持 local / git-subdir / npm。

## CLI（分发与测试）

```bash
codex plugin marketplace add owner/repo          # GitHub 简写
codex plugin marketplace add ./local-marketplace-root  # 本地目录
codex plugin marketplace list / upgrade / remove <name>
codex plugin rebuild my-plugin                   # 开发迭代后重建
codex plugin install ./my-plugin --force
```

## 安装与测试流程

```
1. 创建插件目录 + .codex-plugin/plugin.json + skills/
2. 加入插件市场（marketplace.json）
3. 重启 ChatGPT 桌面 App / codex
4. 从 Plugins Directory 的本地来源安装
5. 在新对话中测试（@mention 或自动触发）
```

**验证清单**：
- [ ] `.codex-plugin/plugin.json` 格式正确（name/version/description/skills）
- [ ] 每个 bundled skill 在 `skills/` 下有对应 `SKILL.md`
- [ ] 如含 App，`.app.json` 指向正确的 App ID
- [ ] 如含 MCP server，MCP 配置正确且 server 可启动
- [ ] 刷新后目录中可见、新对话可调用

## 对 plugin-factory 的含义

- 生成的 Codex 插件 = `.codex-plugin/plugin.json`（name/version/description/
  skills → `./skills/`）+ 根部 `skills/`（Agent Skills 标准，无需副本目录）。
- Codex 无 hooks 机制声明文件（不像 Claude 的 `hooks/hooks.json`）——
  检测 codex harness 以 `.codex-plugin/plugin.json` 为准
  （`scripts/verify.mjs` 已按此检查）。
- 分发建议：同时生成仓库级市场条目
  `$REPO_ROOT/.agents/plugins/marketplace.json` 便于本地测试。

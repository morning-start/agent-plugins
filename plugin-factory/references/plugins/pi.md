# pi plugin 格式 — 规格固化

> **固化于：2026-08-01** · 来源：
> - Extensions: https://pi.dev/docs/latest/extensions + https://github.com/earendil-works/pi/blob/v0.79.10/packages/coding-agent/docs/extensions.md
> - Skills: https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md
> **复核**：仅当 pi 包/扩展格式破坏性变更时复核。不要预先重搜。

## 模型

- pi 插件是一个**包**（git 仓库或本地目录），用
  `pi install git:github.com/<owner>/<repo>` 安装（开发用 `pi -e /path/to/checkout`）。
- 包贡献：**skills**（经 `skills/` 目录或 package.json 的 `pi.skills`）与
  **extensions**（`.pi/extensions/*.ts` 或 package.json 的 `pi.extensions`）。

## 打包（package.json）

```json
{
  "name": "<plugin-name>",
  "version": "0.1.0",
  "pi": {
    "skills": ["skills"],
    "extensions": [".pi/extensions/<plugin-name>.ts"]
  }
}
```

- 包内技能发现：`skills/` 目录或 `pi.skills` 条目。
- 扩展发现：`~/.pi/agent/extensions/*.ts`（全局）、`.pi/extensions/*.ts`
  （项目级，信任后）、`package.json` 的 `pi.extensions`、settings 的 `extensions`
  数组；`/reload` 热重载。

## 结构（生成项目）

```
<plugin>/
├── package.json               # name/version + pi.skills / pi.extensions
├── skills/                    # Agent Skills 标准的 SKILL.md 目录
├── .pi/extensions/<plugin>.ts # 扩展（pi.on(...) 处理器；完整规格在 hooks/pi.md）
└── (commands 经 registerCommand — 见 hooks/pi.md)
```

## 对 plugin-factory 的含义

- 生成的 pi 插件 = `package.json`（`pi.skills` + `pi.extensions`）+ `skills/` +
  `.pi/extensions/<插件名>.ts`。
- `pi install git:...` 是安装路径；plugin-factory 自身 `package.json` 已带
  `"pi": { "skills": ["skills"] }`。
- ⚠️ 包内扩展的 `pi.extensions` 键形状：M2 接线时对照 pi 文档核实
  （钉住来源中列于 package.json 下）。

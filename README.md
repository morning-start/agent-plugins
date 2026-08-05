# agent-plugins

Morning-Start 的 Agent 插件集合仓库：**一个 marketplace，两级插件**（领域插件 + 元插件）。

## 仓库结构

```text
agent-plugins/
├── .claude-plugin/marketplace.json   # 统一 marketplace（一个仓库 = 一个市场）
├── README.md
├── plugin-factory/                   # 元插件层：创建/维护插件的「工厂」
└── plugins/
    └── moonbit-skills/               # 领域插件层：MoonBit 开发技能套件
```

## 两级插件

| 层级 | 目录 | 项目 | 面向人群 | 说明 |
|---|---|---|---|---|
| 元插件（工厂） | `plugin-factory/` | [plugin-factory](plugin-factory/README.md) | 插件作者 | 引导 Agent 从意图出发生成完整的多端插件项目（pf-new → pf-build → pf-verify → pf-release） |
| 领域插件（产品） | `plugins/moonbit-skills/` | [moonbit-skills](plugins/moonbit-skills/README.md) | MoonBit 开发者 | 单语言功能技能套件：设计 → 实现 → 验证 → 发布全流程 |

两者不是同一层级：`plugin-factory` 是「制造插件的工具」，`moonbit-skills` 是「被制造的领域插件」——前者面向插件作者，后者面向使用该语言开发的人。

## 安装

一个 marketplace 即可安装全部插件：

```bash
/plugin marketplace add morning-start/agent-plugins
/plugin install moonbit-skills@agent-plugins   # 领域插件：MoonBit 技能套件
/plugin install plugin-factory@agent-plugins   # 元插件：插件工厂
```

## 维护

- 两个子项目均由上游仓库 subtree 导入，历史完整保留在当前仓库：
  - `plugins/moonbit-skills` ← https://github.com/morning-start/moonbit-skills
  - `plugin-factory` ← https://github.com/morning-start/plugin-factory
- 上游有更新时拉取合并：

```bash
git subtree pull --prefix=plugins/moonbit-skills <moonbit-skills-上游> master
git subtree pull --prefix=plugin-factory <plugin-factory-上游> master
```

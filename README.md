# agent-plugins

Morning-Start 的 Agent 插件集合仓库：**一个 marketplace，多个插件**。

## 仓库结构

```text
agent-plugins/
├── .claude-plugin/marketplace.json   # 统一 marketplace（一个仓库 = 一个市场）
├── README.md
├── plugin-factory/                   # 元插件：创建/维护插件的「工厂」
├── plugins/
│   └── moonbit-skills/               # 领域插件：MoonBit 开发技能套件
├── flowstate/                        # 流程插件：项目开发全流程规范
└── docs/                             # 仓库级文档（plan / task）
```

## 插件一览

| 插件 | 类别 | 目录 | 面向人群 | 说明 |
|---|---|---|---|---|
| [plugin-factory](plugin-factory/README.md) | 元插件 | `plugin-factory/` | 插件作者 | 引导 Agent 从意图出发生成完整的多端插件项目（pf-new → pf-build → pf-verify → pf-release） |
| [moonbit-skills](plugins/moonbit-skills/README.md) | 领域插件 | `plugins/moonbit-skills/` | MoonBit 开发者 | 单语言功能技能套件：设计 → 实现 → 验证 → 发布全流程 |
| [flowstate](flowstate/README.md) | 流程插件 | `flowstate/` | 项目团队 | 需求不全 / 中途变更 / 持续迭代场景下的开发全流程规范（fst-init → fst-change → fst-review → fst-iterate） |

三者定位不同：`plugin-factory` 是「制造插件的工具」，`moonbit-skills` 是「被制造的领域插件」，`flowstate` 是「管理开发流程的规范插件」——分别面向插件作者、语言开发者、项目团队。

> marketplace 中已用 `category`/`tags` 标注类别：`moonbit-skills` → `language`，`plugin-factory` → `meta-plugin`，`flowstate` → `workflow`，安装时可按类别筛选。

## 安装

一个 marketplace 即可安装全部插件：

```bash
/plugin marketplace add morning-start/agent-plugins
/plugin install moonbit-skills@agent-plugins   # 领域插件：MoonBit 技能套件
/plugin install plugin-factory@agent-plugins   # 元插件：插件工厂
/plugin install flowstate@agent-plugins        # 流程插件：开发全流程规范
```

## 维护

- 子项目来源分两种：
  - **subtree 导入**（历史完整保留在当前仓库）：
    - `plugins/moonbit-skills` ← https://github.com/morning-start/moonbit-skills
    - `plugin-factory` ← https://github.com/morning-start/plugin-factory
  - **仓库内直接开发**：`flowstate/`
- 上游有更新时拉取合并：

```bash
git subtree pull --prefix=plugins/moonbit-skills <moonbit-skills-上游> master
git subtree pull --prefix=plugin-factory <plugin-factory-上游> master
```

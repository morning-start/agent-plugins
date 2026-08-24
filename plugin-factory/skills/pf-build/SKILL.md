---
name: pf-build
description: Use when a component manifest is signed off, when creating a standalone plugin project, when scaffolding skills, hooks, or commands for multiple harnesses, when a skill must be authored via skill-creator, when generating a bootstrap/entry skill from orchestration metadata, when deciding the next SemVer version from git history, when bumping declared manifest versions across all files, when writing the CHANGELOG entry for a release, or when routed from /pf-build.
tags: [pf, pf-build, plugin, scaffold, build, skill-creator, render, version, semver, changelog]
metadata:
  prefix: pf
  lifecycle:
    status: active
    version: 0.2.0
    created: 2026-08-01
    updated: 2026-08-24
  keywords_zh: "插件构建, 脚手架, 生成插件, 渲染, skill-creator, 版本管理, 语义化版本"
---

# pf-build — 插件构建与版本管理

## 概述

将构件清单转化为**标准化插件项目**，并管理版本：
1. **构建** — 生成符合标准的插件结构
2. **适配** — 为每个 harness 生成对应文件
3. **版本** — 管理 SemVer 版本和 CHANGELOG

## When to Use

- 复杂度判断为 Light，直接构建
- 构件清单已签署，需要生成项目
- 需要为现有插件添加新技能
- 需要适配新 harness
- 需要管理版本号

## 构建流程

### 1. 标准化目录结构

```
<plugin>/
├── skills/                    # 技能目录
│   ├── using-<plugin>/        # 入口技能
│   │   └── SKILL.md
│   └── <skill-name>/
│       └── SKILL.md
├── hooks/                     # hooks 目录（仅 .sh）
│   ├── hooks.json
│   ├── session-start.sh
│   └── post-tool-verify.sh
├── commands/                  # 命令目录
│   └── <prefix>-<cmd>.md
├── .claude-plugin/            # Claude Code manifest
│   └── plugin.json
├── .opencode/                 # opencode manifest
│   └── opencode.json
├── .pi/                       # pi/oh-my-pi 扩展
│   └── extensions/
├── .codex-plugin/             # Codex manifest
│   └── plugin.json
├── package.json               # pi/oh-my-pi 配置
├── README.md                  # 英文说明
├── README.zh-CN.md            # 中文说明
└── CHANGELOG.md               # 版本历史
```

### 2. harness 适配

为每个目标 harness 生成对应文件：

```bash
# 使用 harness 模块
node -e "
  import('./tools/harnesses/index.mjs').then(async m => {
    const h = m.getHarness('claude-code');
    await h.init.init(target, values);
  });
"
```

### 3. 版本管理

#### 决定版本号

```bash
node tools/version/version.mjs check    # 检查一致性
node tools/version/version.mjs audit    # 审计版本引用
```

#### 递增版本

```bash
node tools/version/version.mjs bump <X.Y.Z>
```

#### CHANGELOG

使用 Conventional Commits 格式：
- `feat:` → minor 版本
- `fix:` → patch 版本
- `BREAKING CHANGE:` → major 版本

## 标准化要求

### 技能文件

每个 `SKILL.md` 必须有：
- frontmatter（name、description）
- Iron Law 章节
- Red Flags 章节
- 自检清单章节

### hooks 文件

- 只支持 `.sh`（bash）
- hooks.json 使用 `${CLAUDE_PLUGIN_ROOT}`
- 事件名在官方白名单内

### manifest 文件

- 版本号一致
- 路径引用正确
- 声明的文件存在

## Iron Law

```
没有构件清单，就不能构建。
```

## Red Flags

- 生成不符合标准的结构
- 不校验就认为构建完成
- 版本号不一致
- hooks 使用相对路径

## 自检清单

- [ ] 目录结构符合标准
- [ ] 所有 harness 文件已生成
- [ ] 版本号一致
- [ ] CHANGELOG 已更新
- [ ] 运行 pf-verify 通过

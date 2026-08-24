---
name: pf-verify
description: Use when a plugin project needs structural or compliance checks, when SKILL.md frontmatter or directory naming must be validated against the Agent Skills standard, when hooks need verification, when orchestration health must be checked (chain breaks, orphan skills, missing entry), when running the pre-release audit, when analyzing how existing skills should evolve, or when routed from /pf-verify.
tags: [pf, pf-verify, plugin, audit, compliance, validation, orchestration, lifecycle]
metadata:
  prefix: pf
  lifecycle:
    status: active
    version: 0.2.0
    created: 2026-08-01
    updated: 2026-08-24
  keywords_zh: "审计, 校验, 合规检查, 验证插件, 质量检查, 生命周期, 技能演进"
---

# pf-verify — 标准化校验

## 概述

检查插件是否符合标准化要求：
1. **结构校验** — frontmatter、命名、hooks
2. **harness 校验** — 各 harness 规范合规
3. **生命周期分析** — 技能演进建议

## When to Use

- 发布前（必须）
- 构建后（Medium/Heavy 路径必须）
- 技能加载失败时
- 用户说"校验"、"检查"、"审计"
- 分析技能如何演进时

## 校验层

### 1. 结构校验

```bash
node tools/verify/verify.mjs structure --root <dir>
```

检查项：
- frontmatter 完整性（name、description）
- 目录命名规范（小写+连字符）
- hooks 配对（.sh）
- JSON 有效性
- 技能结构（Iron Law / Red Flags / 自检清单）

### 2. harness 校验

```bash
node tools/validate-harness.mjs --root <dir>
```

检查项：
- hooks.json 路径（`${CLAUDE_PLUGIN_ROOT}`）
- 事件白名单（29 个官方事件）
- shell 类型（bash）
- manifest 结构

### 3. 生命周期分析

```bash
node tools/verify/verify.mjs lifecycle --root <dir>
```

检查项：
- 链路断裂（技能间引用失效）
- 孤儿技能（不可达）
- 入口缺失（无 using-<plugin>）
- 技能过大（>300 行）
- 触发重叠（Jaccard > 0.85）
- 重复指导
- 嵌套过深
- harness 缺口
- zombie 技能
- 命名冲突
- 版本漂移

## 输出格式

```
SEVERITY  SIGNAL            FILE              ACTION
FAIL      missing-entry     skills/           Create using-<plugin> skill
WARN      trigger-overlap   skills/a,skills/b Merge or declare exception
INFO      skill-too-large   skills/c/SKILL.md Split into sub-skills
```

## 标准化报告

运行完整校验后，生成标准化报告：

```bash
node tools/verify/verify.mjs --root <dir> --format json
```

报告包含：
- 结构合规性
- harness 适配性
- 生命周期健康度
- 修复建议

## 修复流程

1. **运行校验** — 获取所有 findings
2. **按严重度排序** — FAIL > WARN > INFO
3. **逐项修复** — 使用 pf-build 或手动修复
4. **重新校验** — 确认修复成功
5. **生成报告** — 记录标准化状态

## Iron Law

```
没有校验通过，就不能发布。
```

## Red Flags

- 跳过校验直接发布
- 只校验结构不校验 harness
- 忽略 WARN 级别的 findings
- 不重新校验就认为修复完成

## 自检清单

- [ ] 结构校验通过
- [ ] harness 校验通过
- [ ] 生命周期分析完成
- [ ] 所有 FAIL 已修复
- [ ] 生成标准化报告

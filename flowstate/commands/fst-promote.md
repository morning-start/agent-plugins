# /fst-promote

> **定稿闸门** — 过程文档 → 定稿文档的受控通道

## 命令用途

当 `.agent-workplace/` 中的过程文档已经审核完成，需要提升为正式 `docs/` 中的定稿文档时使用。

执行本命令前，加载并遵循 `skills/fst-promote/SKILL.md`。

## 用法

```bash
/fst-promote <source> <target>
```

### 参数

- `source`：过程文档路径（必须在 `.agent-workplace/` 中）
- `target`：定稿文档路径（必须在 `docs/` 中）

### 示例

```bash
# 提升调研报告为架构文档
/fst-promote .agent-workplace/iterations/iteration-001/investigation/fact-checks.md docs/architecture.md

# 提升设计决策为 ADR
/fst-promote .agent-workplace/iterations/iteration-001/design/tradeoffs/storage-choice.md docs/ADR-0003-storage-choice.md

# 提升需求草稿为正式需求文档
/fst-promote .agent-workplace/iterations/iteration-001/requirements/elicited/user-stories.md docs/requirements.md
```

## 执行流程

1. **校验条件**
   - 检查源文档状态是否为 `REVIEW_NEEDED`
   - 检查置信度是否 >= 0.8
   - 检查目标路径是否有效

2. **渲染转换**
   - 提取核心内容
   - 格式标准化
   - 注入溯源元数据

3. **HITL 确认**
   - 展示源文档摘要
   - 展示目标文档预览
   - 展示差异对比
   - **等待用户确认**

4. **写入定稿**
   - 写入 `docs/` 目标路径
   - 更新源文档状态为 `APPROVED`
   - 记录提升日志

5. **更新索引**
   - 更新 `.agent-workplace/state/document-status.json`

## 前置条件

- 源文档必须在 `.agent-workplace/` 中
- 源文档状态必须为 `REVIEW_NEEDED`
- 源文档置信度必须 >= 0.8
- 目标路径必须在 `docs/` 中

## 后置操作

- 源文档状态更新为 `APPROVED`
- `.agent-workplace/state/document-status.json` 更新
- `.agent-workplace/iterations/current/meta/change-log.md` 记录提升日志

## 注意事项

- **HITL 强制**：必须等待用户确认才能写入定稿
- **溯源注入**：自动注入来源、版本、确认记录
- **不可逆**：提升后源文档状态变为 `APPROVED`，不可再次提升
- **受控通道**：这是修改 `docs/` 的唯一受控通道

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| 源文档不存在 | 路径错误 | 检查路径 |
| 源文档状态不是 REVIEW_NEEDED | 未完成审核 | 先完成文档审核 |
| 源文档置信度低于 0.8 | 证据不足 | 补充证据或标记为「待补充」 |
| 目标路径无效 | 路径错误 | 检查路径或创建目标文档 |
| 用户拒绝确认 | 内容不符合要求 | 记录拒绝理由，返回修改 |

## 相关技能

- `fst-workplace`：工作区管理
- `fst-research`：调研能力
- `fst-init`：立项能力
- `fst-iterate`：迭代能力
- `fst-review`：验收能力

## 示例场景

### 场景 1：提升调研报告

```bash
# 1. 完成调研
/fst-research "技术选型：MySQL vs PostgreSQL"

# 2. 审核调研报告（手动或通过 fst-review）
# 报告状态变为 REVIEW_NEEDED

# 3. 提升为架构文档
/fst-promote .agent-workplace/iterations/iteration-001/investigation/fact-checks.md docs/architecture.md
```

### 场景 2：提升设计决策

```bash
# 1. 记录设计决策
# 在 .agent-workplace/iterations/iteration-001/design/tradeoffs/ 中记录

# 2. 审核决策（手动或通过 fst-review）
# 决策状态变为 REVIEW_NEEDED

# 3. 提升为 ADR
/fst-promote .agent-workplace/iterations/iteration-001/design/tradeoffs/storage-choice.md docs/ADR-0003-storage-choice.md
```

### 场景 3：提升需求文档

```bash
# 1. 起草需求
# 在 .agent-workplace/iterations/iteration-001/requirements/elicited/ 中起草

# 2. 审核需求（通过 fst-init）
# 需求状态变为 REVIEW_NEEDED

# 3. 提升为正式需求文档
/fst-promote .agent-workplace/iterations/iteration-001/requirements/elicited/user-stories.md docs/requirements.md
```

# 协作工作流参考

> 本文档为 MoonBit 项目团队提供 Git 分支策略、PR 流程规范和 Code Review 文化指南。不定义 Agent 行为，仅供用户按需查阅。

## Git 分支策略

### 策略对比

| 策略 | 适用团队 | 优点 | 缺点 |
|------|---------|------|------|
| **GitFlow** | 大规模、有固定发布节奏的团队 | 清晰的版本隔离；支持 hotfix 并行 | 分支过多；小型团队负担重 |
| **Trunk-based** | 持续交付、小团队 | 简单；合并冲突少；CI 驱动 | 需要强门禁；不适合多版本并行维护 |
| **GitHub Flow** | 中小团队、持续部署 | 简单易用；PR 驱动 | 无发布分支；hotfix 路径不够清晰 |

### 推荐：Trunk-based + 短期特性分支

对于 MoonBit 项目（通常规模较小、工具链快速演进），推荐 Trunk-based 模式：

```
main (trunk) ───┬── feat-a ── PR ──→ merge
                │
                └── fix-b ─── PR ──→ merge
                                │
                                └── 提交前: CI 全绿
                                    提交后: 自动部署（如有 CD）
```

**规则：**
- 特性分支生命周期 < 2 天，超过则拆分
- 分支命名：`feat/<描述>` / `fix/<描述>` / `docs/<描述>` / `refactor/<描述>`
- 禁止直接推送到 `main`（必须通过 PR）
- 合并前必须 CI 全绿

### 备选：GitHub Flow（PR 驱动）

如果团队需要更严格的 review 流程，推荐 GitHub Flow：

```
main ── feat-login ── PR (#1) ── review ✅ ── squash merge
```

### 备选：GitFlow（多版本维护）

当需要同时维护多个发布版本时使用：

```
master ─── v1.0 ─── v1.0.1 (hotfix)
    │          │
    │          └── v1.1 (release)
    │
    └── develop ─── feat-x
```

### 在 MoonBit 项目中的实践

```bash
# 创建特性分支
git checkout -b feat/add-json-parser

# 开发周期中保持与 main 同步
git fetch origin
git rebase origin/main

# 提交前运行全量检查
moon fmt --check && moon check --warn-list +73 && moon test --target native

# 提交使用 Conventional Commits
git commit -m "feat(parser): add JSON parser for config files"
```

## PR 流程规范

### 标准 PR 流程

```
1. 创建 PR
   ├── 标题: [类型(范围)] 简洁描述（50 字符内）
   ├── 描述: 背景 + 变更内容 + 验证方法 + 截图（如适用）
   └── 关联: 关联 Issue 编号（如有）
   
2. 自动检查
   ├── CI 运行（格式/类型/测试/安全）
   └── 状态自动更新到 PR

3. Code Review
   ├── 至少 1 个 reviewer 批准
   ├── 所有对话 resolved
   └── CI 全绿

4. 合并
   ├── squash merge（特性分支 → main）
   └── 删除特性分支
```

### PR 模板

```markdown
## 背景

{为什么要做这个变更？关联哪个 Issue？}

## 变更内容

- {做了什么}
- {没做什么}
- {已知限制}

## 验证

- [ ] `moon fmt --check` 通过
- [ ] `moon check --warn-list +73` 通过
- [ ] `moon test --target native` 通过
- [ ] `moon info --target native` 无变更或已同步

## 截图 / CLI 输出（如适用）

```
{贴入关键输出}
```

## 注意事项

{reviewer 应重点关注什么？}
```

### PR 合并策略

| 策略 | 适用场景 | 提交历史 |
|------|---------|---------|
| **squash merge** | 特性分支（推荐） | 合并为 1 个 commit |
| **rebase merge** | 个人分支 | 保留原始 commits |
| **merge commit** | 多人协作分支 | 保留分支历史 |

**推荐**：特性分支使用 squash merge，保持 main 历史线性且每个 commit 对应一个可部署状态。

## Code Review 文化

### Reviewer 职责

- **全面性**：检查设计正确性、代码质量、测试覆盖、安全影响
- **及时性**：收到 review 请求后 24 小时内响应
- **建设性**：指出问题的同时给出改进建议
- **优先级**：Critical 问题阻断合并；Important 问题建议修复；Nitpick 可选

### Review 检查清单

```
□ 设计合理吗？架构决策有记录吗？（ADR）
□ API 设计是否符合现有风格？
□ 测试覆盖了 valid/invalid/edge 场景吗？
□ 有安全风险吗？（输入验证、权限、敏感数据）
□ 文档同步更新了吗？（docstring、README、CHANGELOG）
□ 性能有影响吗？（不必要的分配、复杂度）
□ CI 全绿了吗？
```

### 应对常见情况

| 情况 | 处理方式 |
|------|---------|
| reviewer 和 author 意见分歧 | 优先讨论确定方案；无法达成一致时由技术 lead 决策 |
| PR 过大（> 400 行变更） | 要求拆分 PR；reviewer 只做概要审查 |
| 紧急修补（hotfix） | 加速审查（4 小时内）；可先合并后补测试 |
| 测试覆盖不足 | 要求补充关键路径测试后再合并 |
| 发现设计缺陷 | 要求回到 `moonbit-plan` 重新设计 |

### 沟通原则

- 用"我们"而不是"你"——「这里的逻辑是否考虑过边界情况？」而非「你没考虑边界情况」
- 用 Nitpick 标记非必要意见，避免 reviewer 疲劳
- 解释"为什么"而非只指出"是什么"
- 小问题可以直接建议修改（建议代码 inline），大问题讨论方案

## 与 MoonBit Skills 的关系

| 要素 | 对应技能/工具 |
|------|-------------|
| 分支保护 | `moonbit-ci` 的分支保护建议 |
| Commit 规范 | `moonbit-ci` 的 commit-msg hook（Conventional Commits） |
| 测试门禁 | `moonbit-verify` 的 B1-B4 + C1 |
| 安全审查 | `moonbit-security` 的威胁建模和设计审查 |
| 文档同步 | `moonbit-docs` 的文档维护 |
| 发布管理 | `moonbit-evaluate` 的验收评估 |
| Code Review | `moonbit-code-review` 的任务间审查 |

# Reference Report Structure Template

Use this structure when writing the report. Adapt as needed for each project.

```
<library-name>-architecture-and-patterns.md
```

## Structure

### 1. 项目全景
- 仓库元数据（Stars、语言、构建系统、版本）
- 目录结构总览（tree 或表格）
- 代码规模统计（行数、文件数、模块分布）

### 2. 模块分层架构（核心章节）
按叙事线组织。从底层到上层、或从入口到内部。

每个模块章节包含：
- **角色** — 该层在整体架构中的职责
- **关键代码** — 类型定义、核心函数签名
- **设计决策** — 为什么这样设计（Why > What）
- **权衡分析** — 选了 A 放弃了 B 的理由
- **与其他层的关系** — 谁依赖谁，数据流向

### 3. 关键模式提炼
跨模块的设计模式：
- 错误处理策略
- 资源管理模式
- 类型系统设计
- 测试策略
- 其他跨模块模式

### 4. Skill & 编排分析（如适用）
如果项目包含 SKILL.md 或 agent 指令：
- Skill 的触发条件
- Skill 的工作流设计
- 与编排系统的集成方式

### 4.5. Red Flags（可选，高价值）

分析过程中遇到的思维陷阱记录。对照 SKILL.md 中的 Red Flags 表，识别分析过程中的判断偏差：
- 是否曾低估某个模块的复杂度？
- 是否因"项目小"而跳过了结构化流程？
- 是否有 claims 缺少 file:line 证据？

### 5. 决策矩阵 + 生态对比

#### 5.1 决策矩阵
关键技术决策的对比表：

| 决策点 | 选择 | 放弃 | 理由 |
|--------|------|------|------|
| ... | ... | ... | ... |

#### 5.2 生态对比（可选，高价值）
如果该领域有其他语言（Go/Rust/Python/TypeScript）的同类知名项目，做设计哲学对比：

| 维度 | MoonBit 库 | Go 类比 | Rust 类比 | Python 类比 |
|------|-----------|---------|-----------|------------|
| 错误处理 | ... | ... | ... | ... |
| 资源管理 | ... | ... | ... | ... |
| 类型策略 | ... | ... | ... | ... |

### 6. 评价与启示
- 功能完整性评分
- 对 moonbit-skills 的借鉴价值
- What If？分析（未选择的路）

---

## Iron Law

```
NO REPORT WITHOUT CODE EVIDENCE — every claim must have a file:line reference.
```

如果某个结论无法找到 file:line 证据，要么删除它，要么标记为"未验证推测"。

## Formatting Rules

- **Iron Law** — 每个声明必须有 `file_path:line_number` 证据引用。无证据的结论视为推测，必须明确标注
- **Mermaid 图表是强制要求**（至少 1 个架构图）。Mermaid 图让复杂的层次关系一目了然，无图视为报告不完整
- 对比表格优于文字描述
- 每个设计决策附 Why 分析（使用 Why 分析框架：为什么、替代方案代价、跨语言对比、重设计建议）

## Why 分析框架模板

每个设计决策处回答：

```markdown
**Why**: <为什么这样设计>
**Tradeoff**: <放弃的替代方案及其代价>
**Cross-lang**: <Go/Rust/Python 在这个场景的做法>
**What-if**: <如果重新设计会怎么改>
```
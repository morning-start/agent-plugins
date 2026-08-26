# 迭代模板

> 本目录是迭代模板，用于创建新的迭代目录。
> 使用时，复制本目录到 `.agent-workplace/iterations/iteration-XXX/`。

## 目录结构

```
iteration/
├── investigation/              # 调研阶段
│   ├── fact-checks.md          # 事实核查记录
│   ├── raw/                    # 原始资料
│   ├── comparisons/            # 对比分析
│   └── contradictions/         # 冲突观点记录
├── requirements/               # 需求阶段
│   ├── elicited/               # 隐式需求提取
│   ├── use-cases/              # 用例草稿
│   └── glossary/               # 术语消歧记录
├── design/                     # 设计阶段
│   ├── brainstorming/          # 头脑风暴
│   ├── tradeoffs/              # 设计取舍
│   └── prototypes/             # 原型草稿
├── development/                # 开发迭代阶段
│   ├── test-failures/          # 测试失败记录
│   ├── refactor-proposals/     # 重构建议
│   └── agent-sandbox/          # Agent 沙箱
├── release/                    # 发布阶段
│   ├── risk-checklists/        # 发布风险评估
│   └── rollback-plans/         # 回滚预案
└── meta/                       # 迭代元数据
    ├── change-log.md           # 变更日志
    └── session-logs/           # 会话日志
```

## 使用方法

### 1. 创建新迭代

```bash
# 复制迭代模板
cp -r flowstate/templates/iteration .agent-workplace/iterations/iteration-002

# 创建当前迭代符号链接
ln -sfn iteration-002 .agent-workplace/current
```

### 2. 继承上一轮迭代

```bash
# 继承上一轮迭代的文档状态
# （自动或手动）
```

### 3. 按阶段使用

1. **调研阶段**：使用 `investigation/` 目录
2. **需求阶段**：使用 `requirements/` 目录
3. **设计阶段**：使用 `design/` 目录
4. **开发阶段**：使用 `development/` 目录
5. **发布阶段**：使用 `release/` 目录

### 4. 文档状态管理

- 所有过程文档必须包含状态元数据（status、confidence）
- 只有 `status: REVIEW_NEEDED` 且 `confidence >= 0.8` 的文档才能提升
- 通过 `/fst-promote` 提升为定稿文档

### 5. 元数据追踪

- 在 `meta/change-log.md` 中记录所有变更操作
- 在 `meta/session-logs/` 中记录会话元数据

## 核心特性

1. **迭代隔离**：每个迭代有独立的文档空间
2. **文档版本化**：每个文档都有版本历史
3. **状态继承**：上一轮迭代的文档状态可以继承到下一轮
4. **变更追踪**：所有文档变更都有完整的追踪链

## 注意事项

1. 每个迭代目录必须包含完整的目录结构
2. 文档变更必须记录在 `meta/change-log.md` 中
3. 共享文档（如术语表、架构文档）放在 `.agent-workplace/shared/` 目录
4. 运行时状态文件放在 `.agent-workplace/state/` 目录

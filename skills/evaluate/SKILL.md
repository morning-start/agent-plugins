---
name: evaluate
description: "Final evaluation and publication — merge of evaluate + publish. Use after verification passes, when the user says 'ready to publish', 'release', 'deploy'. Agent generates README.mbt.md with executable docs, CI configuration, and publication checklist. User decides whether to publish. Must run after verify."
---

# Evaluate — 验收评估 + 发布准备

## 职责

最终验收 + 发布准备。**Agent 跑验证→生成文档/CI→用户决定是否发布。**

## 执行流程

### 1. 全量验证

```bash
moon fmt --check && moon check --warn-list +73 && moon test --target native && moon info --target native && moon-audit pipeline .
```

### 2. 生成 README 文档

从 `moon info` 提取公共 API 签名，生成 `src/README.mbt.md`（含可执行示例）：

```bash
moon info --target native > src/README.mbt.md
moon test --target native -f "usage"   # 验证文档示例可运行
```

### 3. 生成 CI 配置

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: moonbitlang/moonbit-toolchain@v1
      - run: moon fmt --check && moon check --warn-list +73 && moon test --target native && moon info --target native
      - run: moon-audit pipeline .
```

### 4. 发布检查清单

```markdown
## 发布检查清单

- [x] 完整验证管道通过
- [x] 文档示例可运行
- [x] CI 配置已生成
- [ ] 用户确认版本号
- [ ] 用户执行 `moon publish`（需要 mooncakes 账号）
```

## 各类型发布策略

| 类型 | 发布方式 | CI 验证命令 |
|------|---------|------------|
| lib | mooncake 包 | `moon check --target all` |
| cli | 可执行文件 + mooncake | `moon test --target native` |
| c-ffi | mooncake 包（含 native-stub） | `moon check --target native` + ASan |
| wasm | WASM 模块 + mooncake | `moon test --target wasm` |
| parser | mooncake 包 | `moon test --target native` + 合规率 |
| async | mooncake 包 | `moon test --target native` |

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| Agent | 运行验证管道、生成 README 和 CI、检查发布就绪 |
| 用户 | 判断质量是否达标、确认版本号、执行 `moon publish` |

## 输出

```json
{
  "status": "approved | needs_fix",
  "project_type": "lib",
  "verification": {"fmt": "pass", "check": "pass", "test": "pass (12/12)", "info": "pass", "security": "pass"},
  "files_created": ["src/README.mbt.md", ".github/workflows/ci.yml"],
  "publish_ready": true,
  "user_decision": "approved",
  "next": "publish | implement"
}
```
---
name: moonbit-evaluate
description: "Use when evaluating or publishing a MoonBit project — the LAST step before publishing. Triggered by user phrases like 'publish', 'release', 'deploy', 'done', 'ready to ship', 'final check', or after all verification passes. Make sure verify passed first."
---

# Evaluate — 验收评估 + 发布准备

## 职责

最终验收 + 发布准备。**Agent 委托 verify/ 做门禁→生成文档/CI→用户决定是否发布。**

## 验收标准

发布前必须满足以下条件：

| 条件 | 检查方式 | 是否阻断 |
|------|---------|---------|
| 所有测试通过 | `moon test --target native` | 是 |
| 类型检查无警告 | `moon check --warn-list +73` | 是 |
| 代码格式正确 | `moon fmt --check` | 是 |
| 安全扫描无 error | `moon-audit --fail-on-error .` | 推荐 |
| 有可运行文档示例 | 测试含 usage 标签 | 否 |
| 用户确认版本号 | 用户输入 | 是 |

## 执行流程

### 1. 委托 verify/ 做全量门禁

不重复验证管道——**先调用 `moonbit-verify` 技能**，确保 fmt + check + test + moon-audit + info 全部通过。

如果 verify 失败，返回 moonbit-implement 修复，不继续发布。

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
| Agent | 委托 verify 做门禁、生成 README 和 CI、检查发布就绪 |
| 用户 | 判断质量是否达标、确认版本号、执行 `moon publish` |

## 下一步

发布完成或用户说"再改"后，回到 `moonbit-implement` 继续任务。

## 输出

```json
{
  "status": "approved | needs_fix",
  "project_type": "lib",
  "verification": "pass",
  "files_created": ["src/README.mbt.md", ".github/workflows/ci.yml"],
  "publish_ready": true,
  "user_decision": "approved",
  "next": "publish | implement"
}
```

## 下一步

发布完成或用户说"再改"后，回到 `moonbit-implement` 继续任务。
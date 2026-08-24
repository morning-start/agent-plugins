# tools/ — 插件标准化工具

plugin-factory 的标准化工具集。所有工具都围绕**插件标准化**展开。

## 模块

| 模块 | 职责 | 入口 |
|------|------|------|
| `harnesses/` | harness 规范 + 适配工具 | `index.mjs`、各 harness 目录 |
| `verify/` | 标准化校验引擎 | `verify.mjs` |
| `release/` | 发布门禁 | `release-check.mjs` |
| `design/` | 设计期门禁 | `check-*.mjs`、`complexity.mjs` |
| `version/` | 版本管理 | `version.mjs` |

## 核心工具

### harness 适配

```bash
# 校验 harness 适配
node tools/validate-harness.mjs --root .
node tools/validate-harness.mjs --root . --harness claude-code
```

### 标准化校验

```bash
# 结构校验
node tools/verify/verify.mjs structure --root .

# harness 校验
node tools/verify/verify.mjs harness --root .

# 生命周期分析
node tools/verify/verify.mjs lifecycle --root .

# 完整校验
node tools/verify/verify.mjs --root .
```

### 版本管理

```bash
# 检查版本一致性
node tools/version/version.mjs check

# 审计版本引用
node tools/version/version.mjs audit

# 递增版本
node tools/version/version.mjs bump <X.Y.Z>
```

### 发布门禁

```bash
# 发布前检查
node tools/release/release-check.mjs --root .
```

## 设计原则

1. **harness 是一等公民** — 所有工具围绕 harness 适配
2. **校验驱动** — 先校验，再修复
3. **版本一致** — 所有 manifest 版本同步
4. **标准化优先** — 符合标准才能发布

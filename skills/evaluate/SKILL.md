---
name: evaluate
description: "Evaluate and verify a MoonBit project — use when the user says 'test', 'verify', 'check if it works', 'ready to publish', or after implementation is done. Type-aware: uses different verification pipelines for lib, cli, c-ffi, wasm. Agent runs verification, presents results. User decides if good enough. Must run before publish."
---

# Evaluate — 评估验收

## 职责

根据 `project_type` 验证项目质量，由用户判断是否达到标准。**Agent 跑验证，用户做判断。**

## 执行流程

### 1. Agent 运行验证

根据项目类型运行对应验证管道：

```bash
# lib:   moon fmt --check && moon check --target native --warn-list +73 && moon test --target native && moon info --target native
# cli:   moon fmt --check && moon check --target native --warn-list +73 && moon test --target native && moon info --target native
# c-ffi: moon fmt --check && moon check --target native --warn-list +73 && moon test --target native && moon info --target native
# wasm:  moon fmt --check && moon check --target wasm --warn-list +73 && moon test --target wasm && moon info --target wasm
```

### 2. 评估标准

| 项目类型 | 通过标准 | 额外检查 |
|---------|---------|---------|
| `lib` | fmt + check + test + info 全部通过 | `moon check --target all` 跨平台 |
| `cli` | fmt + check + test + info 全部通过 | CLI 输出测试 |
| `c-ffi` | fmt + check + test + info 全部通过 | ASan 验证（可选） |
| `wasm` | fmt + check + test + info 全部通过 | WASM 运行时测试 |

### 3. 展示结果给用户

```markdown
## 验证结果

| 检查 | 结果 |
|------|------|
| moon fmt --check | ✅ |
| moon check ({target}) | ✅ |
| moon test ({target}) | ✅ 12/12 |
| moon info | ✅ |

**代码质量总结**:
- 类型设计: 良好
- 错误处理: 良好
- 测试覆盖: 核心功能已覆盖

**是否达到发布标准？**
- 好了 → 进入 publish
- 还有问题 → 说明要改什么
```

### 4. 用户决定

| 用户说 | 处理 |
|--------|------|
| 「好了」 | 进入 publish |
| 「这里改一下」 | 回到 implement，修改后重新评估 |
| 「还不够」 | 说明具体问题，Agent 修复后重新评估 |

## 输出

```json
{
  "status": "approved | needs_fix",
  "project_type": "lib",
  "verification": {
    "fmt": "pass",
    "check": "pass",
    "test": "pass (12/12)",
    "info": "pass"
  },
  "user_decision": "approved",
  "next": "publish | implement"
}
```

## 类型感知分支

根据 `project_type` 调整验证策略：

| 项目类型 | 验证重点 | 关键检查 |
|---------|---------|---------|
| `lib` | 跨平台兼容性 | `moon check --target all` |
| `cli` | 命令输出、退出码 | 集成测试 + 标准 I/O |
| `c-ffi` | 内存安全、ASan | `python3 scripts/run-asan.py` |
| `wasm` | WASM 目标、内存 | `moon test --target wasm` |
| `parser` | 合规率、边界测试 | 官方测试套件 |
| `async` | 协程取消、超时 | 并发测试 |

## 幂等性

本技能可安全重复运行：

- **验证管道**: 无状态，每次运行产生相同结果
- **测试快照**: `moon test --update` 可重放
- **git status**: 运行后检查是否有意外变更

```bash
# Idempotency check: 重新评估
moon fmt --check && moon check --target native --warn-list +73 && moon test --target native && moon info --target native
# 重复运行应产生相同输出（同一工具链版本）
```

## Checkpoint: evaluation

```bash
# 验证评估结果
echo "status: pass|fail"
echo "project_type: {lib|cli|c-ffi|wasm}"
echo "checks: fmt|check|test|info"
# 预期: 全部 pass
# 如果任一失败: 回到对应阶段修复
```

## 错误恢复速查表

| 命令 | 诊断 | 修复 | 升级 |
|------|------|------|------|
| `moon test` 失败 | 测试输出 | 检查断言 | 回归 -> 回滚 |
| `moon check` 失败 | E#### | 检查类型 | ABI 不匹配 |
| `moon info` 失败 | 类型检查未通过 | 先 `moon check` | 公共 API 变更 |
| `moon fmt --check` 失败 | 格式问题 | `moon fmt` | 编辑器配置冲突 |

## IDE 工具链

验收前检查公共 API 是否意外变更：

```bash
moon info --target native
moon ide doc '<public_api>'
```

## 上游参考

- `moonbit-agent-guide` — `moon info` 与公共接口变更检查
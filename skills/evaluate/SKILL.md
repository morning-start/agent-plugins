---
name: evaluate
description: "Evaluate and verify a MoonBit project. Type-aware: uses different verification pipelines for lib, cli, c-ffi, wasm. Agent runs verification, presents results. User decides if good enough."
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
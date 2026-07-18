---
name: publish
description: "Prepare a MoonBit project for publication. Type-aware: different publication strategies for lib, cli, c-ffi, wasm. Agent generates docs, CI config. User decides whether to publish."
---

# Publish — 发布准备

## 职责

根据 `project_type` 准备发布。**Agent 生成文档和 CI 配置，用户决定是否发布。**

## 各类型的发布策略

| 项目类型 | 发布方式 | 关键产出 |
|---------|---------|---------|
| `lib` | mooncake 包 | README.mbt.md + CI + moon publish |
| `cli` | 可执行文件 + mooncake | README.mbt.md + 安装说明 + CI |
| `c-ffi` | mooncake 包（含 native-stub） | README.mbt.md + 构建说明 + CI |
| `wasm` | WASM 模块 + mooncake | README.mbt.md + WASM 使用说明 + CI |

## 执行流程

### 1. 生成 README.mbt.md

```bash
# 从 moon info 提取公共 API 签名
# 生成可执行的文档示例
# lib:   API 参考 + 使用示例
# cli:   命令说明 + 参数示例
# c-ffi: 构建依赖 + API 参考
# wasm:  WASM 运行时要求 + 调用示例
```

### 2. 验证文档示例

```bash
moon test --target native -f "usage"
# 如果失败: 修复 README.mbt.md 中的示例
```

### 3. 生成 CI 配置

```bash
# lib:   moon fmt --check + moon check --target all + moon test --target native
# cli:   moon fmt --check + moon check --target native + moon test --target native
# c-ffi: moon fmt --check + moon check --target native + moon test --target native + ASan
# wasm:  moon fmt --check + moon check --target wasm + moon test --target wasm
```

### 4. 展示给用户

```markdown
## 发布准备

**类型**: {project_type}
**已生成**:
- src/README.mbt.md ✅ (文档示例测试通过)
- .github/workflows/ci.yml ✅

**发布检查清单**:
- [x] 完整验证管道通过
- [x] 文档示例可运行
- [x] CI 配置已生成
- [ ] 用户确认版本号
- [ ] 用户执行 moon publish (需要 mooncakes 账号)

**要发布吗？**
```

## 输出

```json
{
  "status": "ready",
  "project_type": "lib",
  "files_created": ["src/README.mbt.md", ".github/workflows/ci.yml"],
  "verification": "pass",
  "publish_ready": true
}
```

## 类型感知分支

根据 `project_type` 调整发布策略：

| 项目类型 | 发布方式 | 关键产出 |
|---------|---------|---------|
| `lib` | mooncake 包 | README.mbt.md + CI + `moon publish` |
| `cli` | 可执行文件 + mooncake | README.mbt.md + 安装说明 + CI |
| `c-ffi` | mooncake 包（含 native-stub） | README.mbt.md + 构建说明 + CI |
| `wasm` | WASM 模块 + mooncake | README.mbt.md + WASM 使用说明 + CI |
| `parser` | mooncake 包 | README.mbt.md + 合规率说明 + CI |
| `async` | mooncake 包 | README.mbt.md + 平台说明 + CI |

## 幂等性

本技能可安全重复运行：

- **文档生成**: 每次生成覆盖同名文件
- **CI 配置**: 检查存在性后再创建
- **验证管道**: 无状态

```bash
# Idempotency check: 重新发布准备
ls src/README.mbt.md .github/workflows/ci.yml
# 预期: 文件存在且内容一致
```

## Checkpoint: publish-ready

```bash
# 验证发布准备完整性
test -f src/README.mbt.md && echo "README.mbt.md: OK" || echo "README.mbt.md: MISSING"
test -f .github/workflows/ci.yml && echo "ci.yml: OK" || echo "ci.yml: MISSING"
moon check --target native --warn-list +73 && echo "check: OK" || echo "check: FAIL"
# 预期: 所有检查通过
# 如果缺失: 回到生成步骤
```

## 错误恢复速查表

| 命令 | 诊断 | 修复 | 升级 |
|------|------|------|------|
| `moon test` 失败 | 测试输出 | 修复 README 示例 | 检查测试配置 |
| `moon check` 失败 | E#### | 检查类型签名 | ABI 不匹配 |
| CI 配置失败 | 工作流错误 | 检查 YAML 语法 | 参考官方模板 |
| `moon publish` 失败 | 包验证失败 | 检查 moon.pkg | 版本冲突 |

## IDE 工具链

发布前提取公共 API 签名生成文档：

```bash
moon info --target native
moon ide doc '<public_api>'
```

## 上游参考

- `moonbit-agent-guide` — `moon publish` 与 CI 验证流程
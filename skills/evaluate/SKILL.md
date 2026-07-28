---
name: moonbit-evaluate
description: "Use when evaluating or publishing a MoonBit project — the LAST step before publishing. Triggered by user phrases like 'publish', 'release', 'deploy', 'done', 'ready to ship', 'final check', or after all verification passes. Make sure verify passed first."
---

# Evaluate — 验收评估 + 发布准备

## 职责

最终验收 + 发布准备。**Agent 委托 verify 做门禁→按项目类型执行专属验证→生成文档/CI→用户决定是否发布。**

## 项目类型检测

```bash
# 检测项目类型：优先 pkgtype(kind: "executable") 新格式，兼容旧 "is-main": true
MAIN_DETECTED=false
for f in moon.pkg cmd/main/moon.pkg src/main/moon.pkg; do
  if [ -f "$f" ]; then
    if grep -q 'pkgtype(kind: "executable")' "$f" 2>/dev/null; then
      MAIN_DETECTED=true; break
    fi
    if grep -q '"is-main": true' "$f" 2>/dev/null; then
      MAIN_DETECTED=true; break
    fi
  fi
done
PROJECT_TYPE=$([ "$MAIN_DETECTED" = true ] && echo "main" || echo "lib")
```

类型决定发布验证路径的差异。

## 验收标准

### 通用硬性要求（所有项目类型）

| 条件 | 检查方式 | 阻断 |
|------|---------|------|
| 完整验证通过 | 委托 `moonbit-verify` 的 H1-H5 | 是 |
| 代码格式正确 | `moon fmt --check` | 是 |
| 类型检查无警告 | `moon check --warn-list +73` | 是 |
| 所有测试通过 | `moon test --target native` | 是 |
| 无意外改动 | `git diff --exit-code` | 是 |
| 用户确认版本号 | 用户输入 | 是 |

### MAIN 项目（可执行程序）专属验证

```bash
# 1. 确认 moon.pkg 有 main 声明
if grep -q 'pkgtype(kind: "executable")' moon.pkg 2>/dev/null; then
  :
elif grep -q '"is-main": true' moon.pkg 2>/dev/null; then
  :
else
  fail("main projects must declare pkgtype(kind: \"executable\")")
fi

# 2. 验证可运行
moon run .                        # exit 0 为通过

# 3. 验证输出不为空
OUTPUT=$(moon run . 2>&1)
[ -n "$OUTPUT" ] || fail("moon run produced no output")

# 4. 生成 CI（含 moon run 验证）
```

**阻断条件：** `moon run` 失败或输出为空则阻断发布。

### LIB 项目（library 库）专属验证

```bash
# 1. 确认元数据文件完整
test -f moon.mod || fail("moon.mod missing")
test -f moon.pkg || fail("moon.pkg missing")

# 2. 验证可被外部消费：临时 consumer
TMP_DIR=$(mktemp -d)
cat > "$TMP_DIR/moon.mod" << 'EOF'
module "consumer_test"
EOF
mkdir -p "$TMP_DIR/src"
cat > "$TMP_DIR/src/moon.pkg" << 'EOF'
EOF
cat > "$TMP_DIR/moon.work" << EOF
use "$(cd .. && pwd)"
EOF
(cd "$TMP_DIR" && moon check 2>&1) || fail("library cannot be consumed")
rm -rf "$TMP_DIR"

# 3. 验证跨平台兼容
moon check --target all

# 4. 生成 README 文档（lib 专属）
moon info --target native > src/README.mbt.md
moon test --target native -f "usage" # 验证文档示例可运行
```

**阻断条件：** 临时 consumer 编译失败或跨平台检查不通过则阻断发布。

## 执行流程

### 1. 委托 verify 做全量门禁

调用 `moonbit-verify` 技能，确保硬性要求 H1-H5 全部通过。如果 verify 失败，返回 `moonbit-implement` 修复，不继续发布。

### 2. 项目类型专属验证

```
委托 verify 通过
    │
    ▼
检测项目类型
    │
    ├── main 项目 → moon run + 输出验证 + CI 含 run
    │
    └── lib 项目  → moon add + moon check --target all + README 生成
```

### 3. 生成 CI 配置（预览模式，用户批准后写入）

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

**注意：** 如果 `.github/workflows/ci.yml` 已存在，展示 diff 给用户，用户批准后写入。不覆盖用户自定义 workflow。

### 4. 发布检查清单

```markdown
## 发布检查清单

- [x] 完整验证管道通过（moonbit-verify H1-H5）
- [x] 项目类型验证通过（main: moon run . | lib: 临时 consumer 编译验证）
- [x] 文档示例可运行（如有 usage 测试）
- [x] CI 配置已生成（用户批准后写入）
- [ ] 用户确认版本号
- [ ] 用户执行 `moon publish`（需要 mooncakes 账号）
```

## 各类型发布策略

| 类型 | 项目分类 | 发布方式 | 专属验证 |
|------|---------|---------|---------|
| lib | library | mooncake 包 | 临时 consumer 编译 + `moon check --target all` |
| cli | main | 可执行文件 + mooncake | `moon run .` + 输出验证 |
| c-ffi | library | mooncake 包 | 临时 consumer 编译 + ASan（可选） |
| wasm | library | WASM 模块 + mooncake | `moon check --target wasm-gc` |
| parser | library | mooncake 包 | `moon test -f "valid/invalid/edge"` |
| async | library | mooncake 包 | 并发测试、超时测试 |

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 委托 verify 做门禁、类型专属验证、生成 README 和 CI 预览、检查发布就绪 |
| **用户** | 判断质量是否达标、确认版本号、审查 README/CI diff、执行 `moon publish` |

## 输出

```json
{
  "status": "approved | needs_fix",
  "project_type": "main",
  "verification": "pass (H1-H5 all green)",
  "type_specific": {
    "moon_run": "pass (output: 'Hello World')"
  },
  "files_created": [".github/workflows/ci.yml"],
  "publish_ready": true,
  "user_decision": "approved",
  "next": "publish | implement"
}
```

```json
{
  "status": "approved | needs_fix",
  "project_type": "lib",
  "verification": "pass (H1-H5 all green)",
  "type_specific": {
    "moon_add": "pass",
    "cross_platform": "pass (native+wasm)"
  },
  "files_created": ["src/README.mbt.md", ".github/workflows/ci.yml"],
  "publish_ready": true,
  "user_decision": "approved",
  "next": "publish | implement"
}
```

## 下一步

发布完成或用户说"再改"后，回到 `moonbit-implement` 继续任务。

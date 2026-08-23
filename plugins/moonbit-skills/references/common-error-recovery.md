# 公共错误恢复参考

> 本文件是 MoonBit 技能共享错误恢复行的**单一权威源**。
> 技能文件的 `## 错误恢复` 表中，共享行用 `→ 引用 common-error-recovery.md` 代替重复内联。
> 技能独有的错误恢复行仍保留在技能文件中。

---

## 共享错误恢复行

### fmt 失败

| 问题 | 诊断 | 修复 |
|------|------|------|
| `moon fmt --check` 失败 | 格式不规范 | `moon fmt` 自动修复，重新检查 |

**引用处**：implement、task、verify、code-review、testing

### check 类型错误

| 问题 | 诊断 | 修复 |
|------|------|------|
| `moon check` 类型错误 | 类型签名不匹配、未推断、不可达分支 | `moon explain --diagnostic E####` 定位，按错误码查 `references/error-codes.json` |

**引用处**：implement、task、verify、code-review

### test 失败

| 问题 | 诊断 | 修复 |
|------|------|------|
| `moon test -f "test_name"` 失败 | 断言不匹配或实现逻辑错误 | 检查 inspect! 期望内容，修正实现；3 次失败后停止问用户 |

**引用处**：implement、task、verify、code-review

### audit 未安装

| 问题 | 诊断 | 修复 |
|------|------|------|
| `moon-audit` 未安装 | 命令未找到 | `moon add minie135/moon-audit`，非阻断 |

**引用处**：verify、evaluate、init、security、implement

### moon 命令不可用

| 问题 | 诊断 | 修复 |
|------|------|------|
| `moon` 命令不可用 | MoonBit 工具链未安装 | 提示安装：`curl -fsSL https://cli.moonbitlang.com/moonbit.sh \| bash` |

**引用处**：init、verify、scaffold

### 非 MoonBit 项目

| 问题 | 诊断 | 修复 |
|------|------|------|
| 不是 MoonBit 项目 | 无 `moon.mod` 且无 `moon.mod.json` | 提示用户创建项目或运行 `moon new` |

**引用处**：init、ci、scaffold

### run 失败（main 项目）

| 问题 | 诊断 | 修复 |
|------|------|------|
| `moon run .` 失败（main 项目） | main 包声明缺失或运行时 panic | 检查 `moon.pkg` 的 `pkgtype(kind: "executable")`，排查边界/空值 |

**引用处**：verify、evaluate

### consumer 编译失败（lib 项目）

| 问题 | 诊断 | 修复 |
|------|------|------|
| 临时 consumer 编译失败（lib 项目） | 对外 API 不完整或导出符号不可达 | 检查 `pub` 可见性、跨包构造器是否用 `pub(all) enum` |

**引用处**：verify、evaluate

### 设计缺陷导致不可测试

| 问题 | 诊断 | 修复 |
|------|------|------|
| 测试无法编写（设计缺陷） | 不可测试的 API 设计 | **触发设计回溯**，回到 `moonbit-plan` 重新设计 API |

**引用处**：implement、task

### 3 次自动修复失败

| 问题 | 诊断 | 修复 |
|------|------|------|
| 3 次自动修复全部失败 | 理解偏差或设计缺陷 | 停止，向用户展示失败历史，请求方向或回到 `moonbit-plan` 重新设计 |

**引用处**：implement、task、code-review

### public API 变更

| 问题 | 诊断 | 修复 |
|------|------|------|
| 变更涉及 public API/ABI/WASM 导出/C 所有权 | 影响发布契约 | 停止自动修复，请求用户确认后再继续 |

**引用处**：implement、task

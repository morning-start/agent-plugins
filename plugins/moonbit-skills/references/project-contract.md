# 契约式 MoonBit 项目结构参考（经验式，非强制）

> **定位**：本文档是「经验式/契约式」的项目结构参考——来自真实 MoonBit 项目（如 prism）沉淀的通用约定。
> **性质**：**默认建议，不是必要结构**。在用户没有特殊要求时提供一定结构性；用户有强制要求时（如项目 `AGENTS.md` 自定义），**以用户/项目约定为准**，本文档不覆盖。
> **使用方式**：技能按需读取本文档作为背景知识；不把本文档内容写死进任何 skill 的 Iron Law。

---

## 一、标准包结构

```
{project}/
├── moon.mod              # 模块元数据（顶层）
├── {pkg}/                # 每个目录 = 一个包
│   ├── moon.pkg          # 包声明 + 依赖列表
│   ├── *.mbt             # 包源码（block style，///| 分隔）
│   ├── *_test.mbt        # 黑盒测试（从包外部视角测试公共 API）
│   ├── *_wbtest.mbt      # 白盒测试（可访问包内实现细节）
│   └── deprecated.mbt    # （约定）已废弃的 block 集中存放
└── ...
```

约定要点：
- **每目录一个包**，`moon.pkg` 声明该包及其依赖
- **黑盒测试** `_test.mbt` 与**白盒测试** `_wbtest.mbt` 分开命名（verify C3 包结构检查的依据）
- 已废弃的 block 建议集中在各目录的 `deprecated.mbt`，便于后续清理
- MoonBit 代码为 **block style**：每个 block 以 `///|` 分隔，block 间顺序无关；重构时可逐 block 独立处理

## 二、Tooling 使用约定

| 命令 | 约定用法 | 信号 |
|------|---------|------|
| `moon fmt` | 代码格式化 | 提交前必须通过 `--check` |
| `moon ide` | 语义导航：`peek-def` / `outline` / `find-references` | 比 grep 更精确 |
| `moon info` | 更新包的 `.mbti` 接口文件 | **`.mbti` 无变化 = 安全重构**（不带来对外可见变化） |
| `moon test` | 运行测试 | 支持快照测试 |
| `moon test --update` | 刷新快照 | 输出变化影响快照时使用 |
| `moon coverage analyze > uncovered.log` | 查看未覆盖代码 | 覆盖信号（verify E3a） |

约定要点：
- **收尾步骤**：最后一步运行 `moon info && moon fmt`，检查 `.mbti` diff 是否符合预期
- `.mbti` 是包的简要正式接口描述；diff 为空的改动对包外部用户无可见变化

## 三、测试断言偏好（经验式）

| 场景 | 推荐 | 说明 |
|------|------|------|
| 稳定/极不易变的结果 | `assert_eq` / `assert_true(pattern is Pattern(...))` | 明确断言 |
| 结构化调试输出的快照 | `derive(Debug)` + `debug_inspect` | 快照记录调试输出，**不**用 `Show` |
| 确定性的计算结果 | 断言测试 | 如科学计算 |
| 未覆盖检查 | `moon coverage analyze > uncovered.log` | 定位测试盲区 |

---

## 四、与本仓库的关系

- 本文档是**知识参考**，供技能按需读取（`moonbit-scaffold` 生成骨架、`moonbit-testing` 断言策略、`moonbit-verify` 包结构检查时参考）
- **不写死进任何 skill**：用户在项目 `AGENTS.md` 或对话中的明确约定优先于本文档
- 项目若已有自己的结构约定，以项目为准；本文档只作为无特殊要求时的默认基线
- 项目的规划文档布局、任务拆解、git 提交与跨 Session 恢复属于**通用开发流程**，由用户或外部流程插件（如 flowstate/fst）编排，本插件不规定、不维护。
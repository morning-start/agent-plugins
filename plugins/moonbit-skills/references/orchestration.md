# MoonBit 技能编排

## 入口

所有用户请求从 `skills/using-moonbit-skills/SKILL.md` 进入。该引导技能在 SessionStart 时通过 `hooks/session-start` 注入到 agent 系统提示中。

***

## 技能全景

moonbit-skills 是 **MoonBit 专属**能力插件，聚焦 **设计、骨架生成、测试设计、验证、CI 基础设施** 五类，**不承载**通用开发流程（实现、任务拆解、代码审查、发布、部署、性能、重构、git 操作、文档、安全、学习、接入初始化）。实现类流程由用户或外部流程插件（如 flowstate/fst）承担，本插件与其可协同使用、不接管其管线状态。

### 推荐流程

```
用户说"我要做 X"
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ using-moonbit-skills (alwaysApply, 路由入口)          │
│ 检测 intent → 路由到正确技能                          │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-plan — 需求澄清 + 设计决策                    │
│ 输出: primary_type + capabilities + targets + API    │
│ 用户介入: 选择架构模式 + 设计 API                      │
│ 路由: → Spike (可选) 或 scaffold                       │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ [Spike] 原型验证（可选）                              │
│ 验证关键假设 → 丢弃代码 → 经验写入设计文档              │
│ 路由: → scaffold                                     │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-scaffold — 动态生成项目骨架                    │
│ 方式: 按类型动态生成，不依赖预置模板                    │
│ CLI: pkgtype(kind: "executable")                     │
│ 验证: moon fmt --check + moon check + moon test      │
│ 路由: → testing / ci（如需要）/ verify                 │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-ci — CI 基础设施（如需要，随时可调用）          │
│ 本地: commit-msg(Conventional Commits) + 安全扫描     │
│       + 基础 hooks（fmt+check / test）                │
│ 远端: GitHub Actions 多 job 流水线                     │
│ 路由: → testing / verify                              │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-testing — 测试设计                            │
│ 输出: 测试策略 + 文件组织 + 测试时机（先行 vs 后补）     │
│ 路由: → verify                                        │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ moonbit-verify — 全量验证门禁                          │
│ 硬性: B1-B4 (格式/类型/测试/工作区) + C1-C3 (API/run/consumer) │
│ 软性: E1-E6 (跨平台/安全/性能/API深度/CI/文档)          │
│ 路由: 报告结果 → 交还用户判断                          │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
          交付设计/骨架/测试/验证契约
          实现与后续由用户或外部流程插件执行
```

### 管线语义

moonbit-skills 内的技能承担设计→骨架→测试→验证→CI 的流转；**实现/部署等超出本插件范围**，由外部流程插件（如 fst）或用户执行：

| 语义 | moonbit-skills 对应 |
| ---- | ---- |
| **阶段** | 设计（plan）→ 骨架（scaffold）→ 测试设计（testing）→ 验证（verify），CI 随时可调 |
| **守卫（Guard）** | 阶段间流转条件 = 门禁（如 verify 的 B1-B4+C1-C3 全绿才可声明可用） |
| **条件路由** | 项目类型路由（lib→consumer 编译验证、main→moon run） |
| **循环** | 设计回溯（测试/验证/实现阶段→plan） |
| **人工闸门（HITL）** | 用户决策点：plan 设计批准、失败项修复方式 |
| **检查点（Checkpoint）** | 由外部流程插件（如 fst）承接，本插件不维护跨 Session 开发管线状态 |

### 独立技能（单次调用）

| 技能 | 触发场景 | 类型 |
| ---- | ---- | ---- |
| `moonbit-plan` | 需求澄清（目标/场景/客户/边界/维护五问）、架构和 API 设计；宏观设计 + 模块划分 + 规则承载 + 可维护性设计 | 管线入口 |
| `moonbit-scaffold` | 动态生成项目骨架（按模块组织目录） | 管线步骤 |
| `moonbit-testing` | 测试设计、组织、写法、迭代；测试时机决策（先行 vs 后补） | 管线并行 |
| `moonbit-verify` | 全量验证门禁 + 按模块/任务验证子集 | 管线检查点 |
| `moonbit-ci` | CI 基础设施构建（GitHub Actions + 本地 hooks + 分支保护） | 随时可调用 |

***

## 三级检测体系

分布在 verify 中，按三级分类组织：

### 基础测试（B — 所有项目必选）

任何 MoonBit 项目均须通过，否则不能声称代码可用：

| # | 要求 | 归属技能 | 命令 |
| -- | ---- | ---- | ---- |
| B1 | 代码格式一致性 | verify | `moon fmt --check` |
| B2 | 类型安全 | verify | `moon check --warn-list +73` |
| B3 | 功能完整性 | verify | `moon test`（目标由项目类型决定） |
| B4 | 工作区干净 | verify | `git status --porcelain`（发布阶段） |

### Custom 测试（C — 按项目类型选择）

不同项目类型有不同验证标准，属于该类型则必选：

| # | 要求 | 归属技能 | 命令 | 适用类型 |
| -- | ---- | ---- | ---- | ---- |
| C1 | API 稳定性 | verify | `moon info --target native` + `git diff --exit-code` | lib/cli/parser/async；ffi/wasm 豁免 |
| C2 | [main] 可执行验证 | verify | `moon run .` + 输出验证 | main/cli 项目 |
| C3 | [lib] 消费验证 | verify | 临时 consumer 编译验证 | lib/ffi/wasm/parser/async |

### 增强测试（E1-E6 — 推荐但非阻断）

推荐执行，报告结果供用户决策：

| # | 要求 | 归属技能 | 命令 |
| -- | ---- | ---- | ---- |
| E1 | 跨平台兼容 | verify | `moon check --target all` |
| E2 | 安全审计 | verify | `moon-audit pipeline .` |
| E3 | 性能基线 | verify | 测试执行时间对比 |
| E4 | API 深度检查 | verify | 参数类型/可见性/错误处理审查 |
| E5 | CI 配置完整性 | verify | `.github/workflows/ci.yml` 校验 |
| E6 | 文档完整性 | verify | pub fn docstring / README 示例 / CLI --help |

***

## 项目类型分支

项目类型检测逻辑详见 [`references/project-types/detection.md`](./project-types/detection.md)，verify 共用同一份检测逻辑，避免漂移。此处不再重复检测代码。

类型分支决定验证路径：

| 类型 | verify |
| ---- | ---- |
| **main**（`pkgtype(kind: "executable")` 或旧 `"is-main": true`） | B1-B4 + C1 + C2 `moon run .` |
| **lib**（都不是） | B1-B4 + C1 + C3 临时 consumer 编译验证 |

***

## hooks 关联

| Hook 事件 | 触发时机 | 执行脚本 | 注入内容 |
| ---- | ---- | ---- | ---- |
| SessionStart | startup/clear/compact | `hooks/session-start`（Bash；Windows 经 Git Bash 运行） | `skills/using-moonbit-skills/SKILL.md` |
| PreCommit | git commit | `hooks/pre-commit.sh` | B1 + B2（fmt + check） |
| PrePush | git push | `hooks/pre-push.sh` | B3 + E2（test + audit） |
| PreCompletion | 对话完成前 | `hooks/pre-completion.sh` | B1-B3 + C1 + E2 |

平台差异：Claude/Kimi 的 `hooks/hooks.json` 接入完整 Git/完成前事件；OMP/Pi 接入 SessionStart 与 PostTool；Codex/Cursor 默认接入编辑后的轻量验证。平台 Hook 不能替代显式 `moonbit-verify`。

***

## 技能间依赖关系

```
using-moonbit-skills (alwaysApply, 路由入口)
    │
    ├── moonbit-plan（无依赖）
    │    │
    │    └── moonbit-scaffold（依赖 plan 输出类型）
    │         │
    │         ├── moonbit-testing（可与 verify 交叉）
    │         │    │
    │         │    └── moonbit-verify（依赖 scaffold/testing 输出）
    │         │
    │         └── moonbit-ci（无依赖，随时可调用）
    │              │
    │              └── → moonbit-verify（验证 CI 基础设施）
    │
    ├── moonbit-verify（无前置依赖，可独立调用）
    └── moonbit-ci（无依赖，可任何时候调用）
```

***

## 回落链

当某个技能不适用时：

```
技能不适用
    │
    ├── 有替代技能 → 切换到替代技能
    ├── 有降级方案 → 执行降级方案
    └── 无替代 → 问用户
```

例如：

- `moon-audit` 未安装 → 跳过 E2，提示用户安装
- `ffi` 项目无 C 编译器 → 提示安装 GCC/Clang，中止
- `wasm` 项目无 WASM 运行时 → 提示安装 wasmtime，继续
- 项目无 `moon.pkg` → 提示先执行 `moonbit-scaffold`
- 用户提出实现/部署/发布等通用流程需求 → 声明不在本插件范围，交付设计/骨架/测试/验证契约，交还用户或外部流程插件

### 设计回溯

```
设计回溯触发
    │
    ├── 测试设计无法为验收项写测试（API 不可测）→ 回到 plan
    ├── 验证发现设计缺陷 → 回到 plan
    └── 实现/优化/重构（外部流程驱动）发现设计问题 → 回到 plan
```
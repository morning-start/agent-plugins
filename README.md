# MoonBit Skills

MoonBit 工程化开发技能集合 — 为 AI Agent（Claude Code、Codex 等）提供一套完整的 MoonBit 项目协作开发流程。

**用户做架构决策和 API 设计，Agent 做实现和验证。**

## 项目结构

```
moonbit-skills/
├── SKILL.md               ← 技能入口：协作模型 + 路由表
├── AGENTS.md              ← Agent 配置：布局 + 约束
├── skills/                ← 6 个核心技能（每个自包含）
│   ├── init/SKILL.md      # moonbit-init: 项目初始化 + git hooks
│   ├── plan/SKILL.md      # moonbit-plan: 需求澄清 + 架构设计
│   ├── scaffold/SKILL.md  # moonbit-scaffold: 项目骨架生成
│   ├── implement/SKILL.md # moonbit-implement: TDD 实现
│   ├── verify/SKILL.md    # moonbit-verify: 验证门禁
│   └── evaluate/SKILL.md  # moonbit-evaluate: 验收 + 发布准备
├── references/            ← 知识库（Agent 参考用，不直接执行）
│   ├── idioms.md           # MoonBit 惯用写法 + 常见陷阱
│   ├── commands.md         # MoonBit 命令参考
│   ├── orchestration.md    # 技能编排 + 关键词路由
│   └── patterns/           # 各类型架构模式
├── hooks/                 ← 钩子脚本
│   ├── hooks.json          # Claude Code 插件钩子配置
│   ├── pre-commit.sh       # 快速检查：fmt + type check
│   ├── pre-push.sh         # 重量级检查：test + security audit
│   ├── pre-completion.sh   # 完成前全量检查
│   └── session-start       # 会话启动注入
├── templates/             ← 脚手架模板（lib / cli / c-ffi / wasm）
├── .githooks/             ← Git 原生钩子（可复制到用户项目）
├── .claude-plugin/        ← Claude Code 插件入口
├── .codex-plugin/         ← Codex 插件入口
├── evals/                 ← 评估用例
└── scripts/               ← 自动化脚本
```

## 技能管线

```
moonbit-init ──→ moonbit-plan ──→ moonbit-scaffold ──→ moonbit-implement ──→ moonbit-verify ──→ moonbit-evaluate
    │                  │                  │                     │                    │                    │
 配置 git hooks    澄清需求           生成项目骨架          TDD 逐任务实现         全量门禁检查         验收 + 发布准备
 质量门禁就绪      设计架构 API        最小可验证            Red-Green-Verify      fmt+check+test       README + CI
```

| 技能 | 触发场景 | 用户角色 | Agent 角色 |
|------|---------|---------|-----------|
| `moonbit-init` | 初始化项目、配置 git hooks | 确认是否安装 moon-audit | 检测项目 → 创建钩子 → 配置 git → 验证 |
| `moonbit-plan` | 开始新项目、规划架构 | 描述需求、选择架构、设计 API | 提问澄清 → 展示方案 → 填充类型细节 |
| `moonbit-scaffold` | 生成项目骨架 | 确认项目类型和包名 | 复制模板 → 替换占位符 → 验证可构建 |
| `moonbit-implement` | 写代码、修 bug、重构 | 审查结果、调整方向 | TDD 循环 → 3 次自动修复 → 展示结果 |
| `moonbit-verify` | 检查、审查、安全审计 | 判断是否可接受 | 全量门禁：fmt + check + test + moon-audit |
| `moonbit-evaluate` | 验收、发布、部署 | 判断质量、确认版本号 | 委托 verify → 生成 README/CI → 发布检查清单 |

## Git Hooks 质量门禁

`moonbit-init` 为项目配置两级 git hooks，按检查成本划分阶段：

```
git commit ──→ pre-commit ──→ moon fmt --check          (格式，< 1s)
                           └─→ moon check --target native (类型，< 3s)

git push ────→ pre-push ────→ moon test --target native  (测试)
                           └─→ moon-audit --fail-on-error (安全审计，可选)
```

| 阶段 | 检查内容 | 速度要求 | 阻断级别 |
|------|---------|---------|---------|
| pre-commit | `moon fmt --check` + `moon check --target native --warn-list +73` | 快速（< 5s） | 必须通过 |
| pre-push | `moon test --target native` + `moon-audit --fail-on-error .` | 允许较慢 | 必须通过 |

**设计原则**：pre-commit 只做轻量检查，不阻塞高频提交；pre-push 做完整测试和安全审计，确保不把坏代码推到远端。

## 支持的项目类型

| 类型 | 模板 | 目标平台 | 说明 |
|------|------|---------|------|
| `lib` | `templates/lib/` | native, wasm, js | 纯 MoonBit 逻辑库 |
| `cli` | `templates/cli/` | native | 命令行工具 |
| `c-ffi` | `templates/c-ffi/` | native | C 外部函数接口 |
| `wasm` | `templates/wasm/` | wasm, wasm-gc | WebAssembly 模块 |

`parser` 和 `async` 是能力维度，不独立作为项目类型 — 使用 `lib` 或 `cli` 作为主类型，再添加对应依赖和目录。

## 插件入口

- **Claude Code**：`.claude-plugin/plugin.json`
- **Codex**：`.codex-plugin/plugin.json`
- **Hooks**：`hooks/hooks.json`

会话启动（SessionStart）注入 `moonbit-plan` 技能上下文。PreCommit 执行快速检查，PreCompletion 执行全量检查。非 MoonBit 项目自动跳过。

环境变量：
- `MOONBIT_STRICT_AUDIT=1`：`moon-audit` 不可用时阻断（CI / 发布场景）

## 快速开始

```bash
# 用户说："我要做一个 TOML 解析器 in MoonBit"
# Agent 自动加载 moonbit-plan 技能，开始对话式协作

# 或手动触发特定技能：
# "帮我初始化这个项目"     → moonbit-init
# "检查一下代码质量"       → moonbit-verify
# "准备发布"              → moonbit-evaluate
```

## 评估

持久化用例和断言位于 `evals/evals.json`。生成结果放在被忽略的 `workspace/` 目录。

```bash
python scripts/check-plugin-metadata.py
```

## 已知边界

- MoonBit 工具链必须由使用者安装并保持版本兼容
- `c-ffi` 需要用户提供真实 C 库 API、头文件和 ABI 约束
- `wasm-gc` 验证取决于当前 MoonBit 工具链是否支持该 target
- `moon-audit` 不可用时，默认本地提交允许 warning；`MOONBIT_STRICT_AUDIT=1` 时阻断
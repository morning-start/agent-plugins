# MoonBit 技能编排

## 入口

所有用户请求从 `SKILL.md` 进入。加载后定位到 `skills/plan/SKILL.md` 开始对话。

## 分类矩阵

```
用户输入
    │
    ▼
┌── 关键词匹配 ─────────────────────────────────┐
│                                                │
├─ "build" "create" "new" "写" "做" "开发"       │──→ 开发管线 (plan → scaffold → implement → evaluate)
├─ "debug" "fix" "error" "fail" "bug"           │──→ implement 内置 debug
├─ "review" "check" "audit" "quality" "security" │──→ verify 技能
├─ "publish" "release" "deploy" "发布"           │──→ evaluate 技能
├─ "test" "verify" "pass"                       │──→ verify 技能
└─ 其他                                          │──→ 问用户
```

## 开发管线（完整流程）

```
用户说"我要做 X"
    │
    ▼
┌──────────────────────────────────────────────┐
│ plan(SKILL.md) — 需求澄清 + 设计决策          │
│ 输入: 用户原始描述                             │
│ 输出: project_type + 需求文档 + 架构决策       │
│ 用户介入: 选择架构模式 + 设计 API              │
│ 路由: → scaffold                              │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│ scaffold(SKILL.md) — 项目脚手架               │
│ 输入: project_type + 包名                     │
│ 输出: 项目骨架 (moon.mod + moon.pkg + src/)    │
│ 验证: moon check + moon test                  │
│ 路由: → implement                             │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│ implement(SKILL.md) — TDD 实现                │
│ 输入: 任务列表 + API 设计                      │
│ 输出: 完成的代码 + 通过的测试                   │
│ 内置 debug: 3 次自动修复 → 问用户方向          │
│ 验证: 每任务 Red-Green-Verify                  │
│ 路由: → evaluate                              │
│ 阶段门禁: 调用 verify/ 做全量检查               │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│ evaluate(SKILL.md) — 验收评估 + 发布准备       │
│ 输入: 验证通过的代码                           │
│ 输出: README.mbt.md + CI 配置 + 发布就绪      │
│ 用户介入: 判断"好了"或"再改"                   │
│ 路由: 完成 (approved) 或 → implement (再改)   │
└──────────────────────────────────────────────┘
```

## 独立技能（单次调用）

| 技能 | 触发场景 | 合并了 |
|------|---------|--------|
| `verify/` | 审查、验证、安全审计 | review + verify + moon-audit |
| `scaffold/` | 生成项目骨架 | — |

## 管线状态

```json
{
  "pipeline": "development",
  "phase": "implement",
  "progress": {
    "plan": "completed",
    "scaffold": "completed",
    "implement": "in_progress (task 4/13)",
    "verify": "pending",
    "evaluate": "pending"
  },
  "project_type": "parser",
  "user_interventions": 2,
  "next": "implement:task-5"
}
```

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
- `moon-audit` 未安装 → 跳过安全审查，提示用户安装
- `c-ffi` 项目无 C 编译器 → 提示安装 GCC/Clang，中止
- `wasm` 项目无 WASM 运行时 → 提示安装 wasmtime，继续
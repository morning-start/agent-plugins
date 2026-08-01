---
name: moonbit-testing
description: "Use when designing tests, writing test code, or iterating on test organization — before or alongside implementation. Triggered by 'how to test', 'write tests', 'test organization', '测试架构', '写测试', '测试组织', '补测试', '测试重构'."
---

# Testing — 测试设计与编写

## 职责

测试策略选择、文件组织、命名约定、重构迭代。**产出测试代码，不写实现。** 覆盖 TDD Red 阶段决策、补测试、测试重构三类场景。

## The Iron Law

NO TEST CODE WITHOUT TEST STRATEGY

测试代码必须有明确策略：覆盖目标、文件组织、命名约定。无策略的测试是噪声。

### 可机械化自检

- [ ] 已确认测试覆盖目标（公共 API / 私有实现 / 边界 / 性能）
- [ ] 已决定测试文件组织（单文件 / 按类别拆分 / 白盒）
- [ ] 已确认命名约定（如 bench_ 前缀过滤）
- [ ] 已检查现有测试，避免重复
- [ ] 测试运行失败时，已按诊断决策树分诊根因（测试代码错误 vs 实现缺陷）
- [ ] 确诊为实现缺陷时，已裁出最小复现用例再移交

## Red Flags — STOP and Re-evaluate

- 不确认策略就写测试（"先写再说"）
- 测试组织与项目类型不匹配（parser 不用 valid/invalid 分类）
- 白盒测试滥用（能用黑盒却用 _wbtest.mbt）
- 测试无法编写（设计缺陷）却不报告
- 测试失败时不先诊断根因，直接归因于实现：「测试挂了 → 是测试代码错了还是实现有缺陷？」
- 替代 implement 写实现代码

## 停止条件

- 测试策略未确认 → 与用户确认覆盖目标和组织方式
- 测试无法编写（API 不可测）→ 报告设计缺陷，建议回到 plan
- 现有测试已充分覆盖 → 跳过，不重复
- 测试运行失败 → **必须先执行「测试失败诊断决策树」分诊根因**：
  - 诊断结论为测试代码有误 → 修正测试代码，不移交
  - 诊断结论为测试环境/数据问题 → 修复环境或数据，不移交
  - 仅当确诊为实现缺陷时 → 移交 implement，携带最小复现用例和诊断日志

## 测试失败诊断决策树

测试运行失败时，**首要任务是分诊根因**，而不是直接认定实现有缺陷。测试代码写错的概率不容忽视，特别是在修改测试或快速迭代时。

### 分诊流程图

```
测试运行失败
    │
    ├── 编译失败（类型/语法/MoonBit 编译错误）
    │   └── 根因：测试代码使用了错误的 API 签名、类型不匹配、
    │        或导入路径错误
    │   └── 行动：修正测试代码。检查被测试的 API 签名是否与测试中使用的匹配
    │
    ├── 断言/expect 失败（测试运行了但期望值与实际值不符）
    │   ├── 检查预期值是否正确
    │   │   ├── 预期值与规格/文档一致 → 实现可能有缺陷
    │   │   │   └── 移交 implement（携带最小复现）
    │   │   └── 预期值写错了（手误、误解 API 行为、规格变更后未同步）
    │   │       └── 修正测试预期值
    │   ├── 测试逻辑错误
    │   │   ├── setUp/teardown 缺失或错误（测试未独立、状态污染）
    │   │   ├── 边界条件写错（循环范围、索引偏移）
    │   │   ├── Mock/Stub 行为与真实 API 不一致
    │   │   └── 测试用例间有隐性依赖（共享可变状态）
    │   │   └── 修正测试逻辑
    │   └── 测试数据/环境问题
    │       └── 输入数据不合法或环境不一致 → 修复数据或环境
    │
    ├── 超时/panic
    │   ├── 无限循环/死锁 → 检查测试中的循环终止条件和锁使用
    │   └── 资源泄漏（句柄/内存未释放）→ 检查 alloc/free 配对
    │   └── 修正测试或移交 implement（视根因）
    │
    └── Flaky（有时通过有时不通过）
        ├── 竞态条件 — 测试未做同步或共享状态
        ├── 顺序依赖 — 测试依赖前一个用例的副作用
        └── 环境不稳定 — 时间敏感、外部资源
        └── 修复测试隔离性（独立的 setUp/teardown、消除共享状态）
```

### 关键原则

1. **先自证测试代码正确，再归因于实现** — 测试是度量工具，出问题时先校准工具。
2. **每一次测试失败都是一次诊断机会** — 不跳过、不忽略、不直接重跑。
3. **编译失败优先于运行失败** — 先扫清编译错误，再分析运行时断言失败。
4. **最小复现优先** — 移交 implement 前裁掉测试代码中无关的断言和 setup，只保留触发失败的最小用例。

### 典型诊断日志格式

```json
{
  "failure_mode": "compile_error | assertion_failed | timeout | panic | flaky",
  "diagnosis": "测试代码使用过时 API | 预期值与规格不符 | 测试逻辑边界写错 | 实现回归",
  "remediation": "修正测试 | 移交 implement",
  "minimal_repro": "指向触发失败的最小测试用例"
}
```

| 场景 | 流程 |
|---|---|
| TDD（测试先） | testing 产出失败测试 → implement 写实现 → verify |
| 补测试（实现先） | testing 分析现有实现 → 补充测试 → verify |
| 测试重构 | testing 重构测试代码 → verify 确认无回归 |
| 非 TDD 流程 | 用户指定流程，testing 仅负责测试部分 |

## 各项目类型测试策略

| 类型 | 测试文件 | 分类 | 特殊关注 |
|---|---|---|---|
| lib | `lib_test.mbt` | valid/invalid/edge | 公共 API 覆盖 |
| cli | `lib_test.mbt` | 单元+集成 | 命令解析、stdout |
| ffi | `lib_test.mbt` | 内存安全 | alloc/free 对 |
| wasm | `lib_test.mbt` | 内存操作 | WASI 调用边界 |
| parser | `lib_valid_test.mbt` + `lib_invalid_test.mbt` | valid/invalid/edge | 官方测试套件 |
| async | `lib_test.mbt` | 并发/超时 | 协程取消 |
| performance | `bench_test.mbt` | 性能基线 | bench_ 前缀过滤 |

## 测试文件组织决策树

1. 新项目 → 单个 `lib_test.mbt`
2. 测试 > 200 行或类别明显 → 按类别拆 `<lib>_<category>_test.mbt`
3. 需要性能回归保护 → 加 `bench_test.mbt`
4. 必须验证私有实现 → 谨慎使用 `_wbtest.mbt`
5. 跨平台项目 → 同一文件用 `--target` 分别跑

## 与 implement 的契约

- testing 产出测试组织决策（文件、命名、分类）
- implement 在 TDD Red 阶段遵循 testing 决策
- implement 可在 Red 阶段写具体测试代码（遵循 testing 组织）
- testing 不接管 implement 的 TDD 循环执行

## 与 verify 的契约

- testing 不运行门禁判定
- verify H3 运行测试并判定功能完整性
- testing 产出的测试由 verify 验证有效性

## 与 code-review 的契约

- testing 提供测试审查标准（覆盖目标、组织、命名）
- code-review 审查测试质量时引用 testing 决策

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|---|
| Agent | 设计测试策略、组织文件、编写测试代码、迭代重构 |
| 用户 | 确认测试覆盖目标、审查测试质量、决定测试范围 |

## 输出

```json
{
  "status": "designed | blocked",
  "project_type": "parser",
  "test_strategy": "valid/invalid/edge 分类",
  "test_files": ["lib_test.mbt", "lib_valid_test.mbt", "lib_invalid_test.mbt"],
  "naming_convention": "<lib>_<category>_test.mbt",
  "coverage_targets": ["公共 API", "边界条件", "错误路径"],
  "next": "implement | verify"
}
```

## 错误恢复

| 问题 | 诊断 | 修复 |
|---|---|---|
| 测试策略未确认 | 用户未指定覆盖目标 | 展示项目类型策略表，让用户选择 |
| 测试无法编写 | API 不可测 | 报告设计缺陷，建议回到 plan |
| 现有测试已充分 | 重复覆盖 | 跳过，不重复创建 |
| **测试编译失败** | **测试代码使用了错误的 API 签名、类型不匹配或导入路径错误** | **对照当前 API 签名修正测试代码中的类型/调用** |
| **测试断言值与规格不符** | **预期值写错（手误/误解 API/规格变更后未同步）** | **查阅最新规格文档或 API 行为，修正预期值** |
| **测试逻辑错误** | **setUp/teardown 缺失、边界条件偏移、Mock 不符真实行为** | **修复测试逻辑，确保测试独立且可复现** |
| **测试 Flaky** | **竞态条件、顺序依赖、环境不稳定** | **消除共享可变状态，确保测试隔离开来互不依赖** |
| 测试运行失败 | 实现问题 | 移交 implement，不自行修复实现 |
| 白盒测试滥用 | 能用黑盒却用白盒 | 优先重构为黑盒 |

## 下一步

测试设计完成后，进入 `moonbit-implement` 开始 TDD 实现（遵循测试组织决策），或进入 `moonbit-verify` 验证现有测试有效性。

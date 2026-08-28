---
name: todo
strategy: todo
role: execution-mode
layer: agent-modes
default: false
select_when: [single-file, trivial-diff, low-risk]
escalates_to: [spec, loop, graph]
escalation: [fst-change, spec, loop, graph]
composes_with: []
state: state/checkpoint.json
input: fst-iterate
boundary: single-low-risk-diff
acceptance: minimal-verification-passes
verification: build-or-smoke
evidence: verification-output
exit: stop-after-diff
tests: [tests/agent-modes.test.mjs]
---

> 模式注册、选择协议与统一契约见 [README.md](README.md)。

# Todo 模式（简单任务直接做）

> **一句话**：能用一个 diff 说清的单点改动，直接做，不套流程。
> 是四种 mode 中最轻量的一种，用于 trivial diff——「无需规划」不等于「无需验证」。

## 职责边界

| | 说明 |
|---|---|
| **负责** | 判定改动是否为 trivial（单点、低风险、一句话 diff）；执行单点修改并做**最小验证**（构建 / 冒烟） |
| **不负责** | 需求澄清、多文件拆分、方案探索、依赖编排、验收标准逐项核销——这些交给更重的模式 |
| **何时转交** | 一句话说不清 diff / 需动多文件 / 需澄清需求 → 停止直做，转 **Spec / Loop / Graph** 或先立项（`fst-init`） |

## 触发

**触发（Use when）**——满足**全部**：

- 改动能用**一句话说清 diff**（改一个值 / 加一行日志 / 重命名 / 单点小修）
- 单文件、单点、低风险
- 无需探索方案、无需澄清需求
- 改动在已批准范围内（已立项 / 已走变更管控 `fst-change`）

**明确不触发（Do NOT use when）**——满足任一即退出：

- 改多文件、跨模块 → 转 **Spec / Graph**
- 方案不确定、需探索或需求模糊 → 先立项（`fst-init`）或转 **Loop**
- 验收点需逐项核销 → 转 **Spec**
- 属于新需求或缺陷修复（应走 `fst-change`）→ 先变更管控，不直做

## Iron Law

```
改小 ≠ 不验证；简单 ≠ 顺手扩
```

- **最小验证不能省**：改动再小，构建 / 冒烟也要跑过。「简单」指「无需规划」，不指「无需验证」。
- **范围纪律**：只动 diff 说清的部分。范围外发现的问题**只记 note，不顺手改**（改了就超纲，退出 todo）。
- **证据门**：声称「完成」前必须有**本消息内刚跑过**的验证输出，不能引用旧结果或「应该没问题」。

## 流程

1. **判断**：能否用一句话说清 diff？
   - 能 → 直接做
   - 不能 → 停止，转对应更重模式（见「触发」）
2. **列轻量清单**：编号 + 一句描述（会话内或文件均可，不强制定稿）
3. **直接做**：逐个完成，勾选核销
4. **最小验证（证据门）**：对改动点跑构建 / 冒烟，读到输出确认通过才算完成

## 产物

轻量 todo 清单（会话内或文件均可，不强制定稿）。

## 自我怀疑（Rationalizations to Reject）

| 借口 | 现实 |
|------|------|
| "改动这么小，不用验证" | 简单指无需规划，不指无需验证；最小验证永远要过 |
| "顺手把旁边的也改了吧" | 超出 diff 范围 → 已经不是 todo，转模式或另开任务 |
| "我边做边想" | 方案不确定就不该直做，先立项或转 Loop |
| "上次跑过应该没问题" | 证据必须是本消息内刚跑的；旧结果不构成完成证据 |
| "这是新需求，但很小，直接改吧" | 新需求 / 缺陷修复必须走 `fst-change`，不管多小 |

## 红旗（Red Flags - STOP）

- 改到一半发现需要动多个文件 / 需澄清需求 → 停下，转模式
- 打算跳过最小验证直接收尾 → 停，先验证
- "顺手改"的范围扩张（改着改着开始动无关代码）→ 停，超纲即换模式
- 用"应该没问题 / 上次跑过"当完成证据 → 停，重跑验证

## 验证（Verification）

- [ ] 改动确实能一句话说清 diff（否则本就不该走 todo）
- [ ] 改动在已批准范围内（非新需求 / 非缺陷修复）
- [ ] 构建 / 冒烟最小验证通过（本消息内跑过，有输出证据）
- [ ] 未顺手改动范围外代码

## 与其他模式的关系

- **→ Spec**：改动需逐项验收 / 涉及多文件 → 升级
- **→ Loop**：方案不确定、需探索逼近 → 升级
- **→ Graph**：多依赖、需编排 → 升级
- **→ fst-change**：新需求 / 缺陷修复 → 先变更管控
- 从 **Spec / Loop / Graph** 拆出的单个简单子任务，可用 todo 直做（不进新的完整流程）

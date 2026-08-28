# Agent modes（操作模式）

> 本目录定义 这一步怎么做，不是定义项目流程怎么走。
> references/flow-graph.md 定义 N1~N9 的生命周期流程；本目录定义执行策略。
> skills/ 的生命周期技能负责路由到流程节点，再按任务特征选择一个主模式。

## 1. 模式注册表

| 模式 | 策略字段 | 默认性 | 适用信号 | 主要产物 | 典型升级/降级 |
|---|---|---:|---|---|---|
| [Todo](todo.md) | todo | 否 | 单文件、低风险、一句话 diff | 最小 diff + 最小验证证据 | → Spec / Loop / Graph |
| [Spec](spec.md) | spec | **是** | 验收点清晰、依赖简单 | 任务清单 + acceptance + verification + deps | → Todo / Loop / Graph |
| [Loop](goal.md) | loop | 否 | 目标明确但边界/方案需多轮逼近 | state/goal.md + 每轮信号 + 停止判定 | → Spec / Graph / Todo |
| [Graph](graph.md) | graph | 否 | 多依赖、跨模块、存在可并行节点 | 节点 DAG + DoD + 拓扑进度 | 节点内 → Spec / Loop / Todo |

goal.md 是历史文件名；稳定的机器可读策略名是 loop。不要把运行时状态文件 state/goal.md 与模式定义混淆。

## 2. 选择协议

### 2.1 先判定生命周期，再判定操作模式

~~~text
新需求 / 缺陷 / 事故？
├─ 是 → 先走 fst-change；不要用 mode 绕过变更管控
└─ 否 → 当前流程节点已知？
        ├─ 否 → 回 fst-init 澄清边界
        └─ 是 → 继续选择 mode
~~~

### 2.2 四问选择器

按顺序回答；命中第一条即选定主模式：

1. **一句话能否描述单点 diff，且只改一个文件、低风险？**
   - 是 → todo
2. **是否存在两个以上相互独立、需要显式先后或并行的节点？**
   - 是 → graph
3. **目标是否明确，但验收口径/方案需要多轮试探，且每轮有可验证信号？**
   - 是 → loop
4. **否则** → spec（默认模式，先写验收标准再执行）

### 2.3 冲突消解

- **安全优先**：不确定时选择更重的模式，不选择更轻的模式。
- **Graph 优先于 Spec**：有真实依赖或并行机会时，Graph 是外层编排；节点内部再用 Spec。
- **Loop 不等于无限重试**：没有本轮信号、没有完成条件，就不能进入下一轮。
- **Todo 不能绕过 fst-change**：改动大小不改变新需求/缺陷必须先登记的规则。
- **HITL 优先于自动续跑**：需要人在每轮确认的任务，不适合 Loop；使用 Spec/Graph 并在边上设置人工闸门。

## 3. 统一模式契约

每个模式都必须显式定义以下字段；缺一项就不能可靠地判断完成：

| 字段 | 含义 |
|---|---|
| input | 从哪个流程节点/上游产物开始 |
| boundary | 本次模式允许做什么、明确不做什么 |
| acceptance | 断言式完成条件（不是实现某功能） |
| verification | 证明 acceptance 的命令、检查或信号 |
| state | 中断后恢复所需的状态文件/记录 |
| evidence | 本轮/本节点刚产生的验证证据 |
| exit | 达标后的停止条件 |
| escalation | 何时转更重模式或返回生命周期技能 |

### 最小任务记录

~~~yaml
id: TASK-001
mode: spec
input: fst-iterate
boundary: 只实现用户资料接口，不扩展权限模型
acceptance:
  - 接口返回 200，响应含 id 和 name
verification:
  - npm test -- user-profile
state: .agent-workplace/state/checkpoint.json
evidence: tests/user-profile.test.mjs passed
exit: acceptance 全部核销后停止
escalation: 发现跨模块依赖则转 graph
~~~

## 4. 模式之间的关系

模式关系不是生命周期流转图，而是执行策略的组合关系：

~~~text
                 ┌──────────────┐
                 │    Graph     │  外层依赖/并行编排
                 └──────┬───────┘
                        │ 节点内选择
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Todo          Spec           Loop
      单点直做      验收驱动        多轮逼近
~~~

- Spec 是默认基线；Todo 是受约束的降级；Loop 是反馈驱动的升级；Graph 是编排层，不是更强的 Spec。
- Graph 节点必须有 DoD；节点内部可用 Spec 核销、Loop 逼近或 Todo 完成单点。
- 模式可以在一个生命周期节点内切换，但切换必须记录原因、当前证据和新的退出条件。
- 模式切换不改变 N1~N9 的所有权，也不改变 HITL 闸门和 .agent-workplace 落点规则。

## 5. 与相关工程概念的对齐

| Flowstate 概念 | 对齐概念 | 在本项目中的约束 |
|---|---|---|
| Spec | Specification by Example / executable acceptance | 用断言式 acceptance 和 verification 作为完成证据 |
| Loop | evaluator-optimizer / bounded feedback loop | 每轮必须有新信号，达标立即停止 |
| Graph | DAG / orchestrator-worker / topological scheduling | 依赖单向无环，无依赖节点可并行 |
| state/checkpoint | durable workflow / event history / replay | 记录可恢复状态，不把上次感觉当证据 |
| HITL gate | human-in-the-loop control point | AI 可准备材料，但不得代替人做冻结、审批、放量决策 |
| using-fst + mode selector | router + policy selection | 先选生命周期技能，再选执行模式，避免 mode 越权 |

这些概念的共同点是：**把执行从一次性生成改成有状态、可验证、可暂停、可恢复的过程**。Flowstate 不复制某个框架的运行时，而是抽取它们对边界、状态、证据和暂停点的共同约束。

## 6. 维护规则

- 新增模式必须先更新本文件的注册表、选择器和关系图，再新增模式定义。
- 每个模式定义必须包含：职责边界、触发/不触发、Iron Law、流程、产物、验证、关系。
- 模式文件只描述执行策略；生命周期节点、交接产物和技能所有权写在 references/flow-graph.md 与 references/skill-graph.md。
- 关系或命名变化必须同步更新 tests/agent-modes.test.mjs。
- 任何模式新增都要回答：如何停止、如何证明完成、如何中断恢复、何时升级。

## 参考概念

- Temporal Workflows — Workflow Definition、Execution、Event History、replay 与 deterministic execution。
- Specification by Example — 用例/示例作为可执行规格与验收依据。
- LangGraph Workflows and Agents — 顺序、并行、路由、编排与 evaluator-optimizer 等图模式。

# Spec 方略（phase→task→spec）

> 适用：迭代开发中让每个任务**可验证**的默认方略。
> 核心：**任务带验收标准（acceptance）→ 逐项核销 → 未核销不算完成**。

## 定位

phase→task→spec 是 fst-iterate 迭代开发的默认任务组织方略（取代旧 todo 勾选清单）：

| 形态 | 链条 | 关键差异 |
|------|------|---------|
| **spec（本文件）** | phase→task→spec | 每个任务带**验收标准**，完成 = 验收标准逐项核销 |
| todo（仅简单任务） | 不进方略 | 一句话能说清 diff 的简单任务直接做，用轻量清单跟踪（见 `fst-workplace` 模式选择） |

## 流程

1. **写任务清单**：`docs/task/TASKS.md`——编号（`P1-B1-T01`）+ 标题 + 描述 +
   **验收标准（acceptance）** + 分批（内聚 + 实现顺序）
2. **每个任务必须带验收标准**：
   - 验收标准是**可验证的断言**（"XX 接口返回 200 且字段 Y 非空"、"冒烟测试通过"、
     "Schema 校验通过"），不是"实现 XX"
   - 无法客观验证的任务 → 拆细、补验证手段，或标记「待确认」，不写"大概完成"
3. **逐批执行 + 核销**：
   - 每批完成后：对照本批任务的验收标准**逐项核销**
   - 核销手段：构建 / 冒烟 / 测试 / Schema 校验（批次验收 Gate）
   - 未核销的验收项 → 记录到技术债或阻塞，**不标"已完成"**
4. **沉淀验收清单**（可选）：汇总跨任务验收项为 `docs/spec/checklist.md`，
   供 `fst-review` 的 DoD 核销直接引用

## 产物

`docs/task/TASKS.md`（任务含 acceptance 字段）· 可选 `docs/spec/checklist.md`

## 关联

- todo 只用于简单任务（一句话能说清 diff，直接做）；迭代内任务一律走本方略（spec）或 loop / graph 方略
- 与 `fst-review` 衔接：任务验收标准汇总为 DoD 核销项（schema 5.4）
- 任务 schema 含 `acceptance` 字段（见 `schemas/task.schema.json`）
- 与 Graph 方略衔接：spec 定义"每节点做到什么算完成"，graph 定义"节点之间怎么走"

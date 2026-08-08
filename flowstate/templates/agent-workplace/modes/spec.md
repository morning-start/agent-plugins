# Spec 模式

> 适用：范围较大、需先对齐方案与验收标准的任务（系统级任务、大规模重构、多人协作）。
> 核心：**需求 → 计划 → 任务三链式链接**，验收清单驱动，便于复用与协作。

## 流程

1. **访谈**：先向用户澄清需求（技术实现、边界、取舍），不急于写文档
2. **写 requirements.md**：`docs/requirements.md`——需求编号（REQ-xxx）+ 标题 +
   优先级（P0~P3）+ 验收标准（acceptance）
3. **写 plan.md**：`docs/plan/PLAN.md`——每条计划项**链接到对应需求**，标注优先级，
   按逻辑分组
4. **写 tasks.md + checklist.md**：`docs/spec/` 下——
   - `tasks.md`：枚举任务，每个任务链接到 plan 项 + 需求，按阶段分组（Setup → 核心 → 进阶 → 测试）
   - `checklist.md`：验收清单（逐项核销）
5. **待确认**：首次创建后暂停，用户确认/编辑后才执行
6. **执行**：按任务清单推进，状态随进度自动更新

## 关键原则

- 规格**自包含**：命名涉及的文件与接口、明确**范围外（out of scope）**、以端到端验证步骤收尾
- 每个新/改任务保持与需求、plan 项的链接，防止漂移
- Spec 文档可纳入版本控制，作为项目知识资产（定稿时提升到正式 `docs/`）

## 产物

`docs/requirements.md` · `docs/plan/PLAN.md` · `docs/spec/spec.md` · `docs/spec/tasks.md` · `docs/spec/checklist.md`

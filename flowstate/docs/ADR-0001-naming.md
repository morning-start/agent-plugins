# ADR-0001 — 插件命名决策：flowstate / 前缀 fst-

- **状态**: Accepted（已接受）
- **日期**: 2026-08-08
- **背景**: 项目开发全流程规范插件需要一个名字，同时满足：中文语境下好记、
  有记忆点（最好带梗/有格调）、英文目录名与技能前缀符合仓库命名规范
  （小写连字符，`^[a-z0-9]+(-[a-z0-9]+)*$`）、不与已有插件（plugin-factory
  的 `pf-`、moonbit-skills）冲突。

## 决策

插件命名为 **flowstate**（中文展示名可作"流程状态机 / 心流"），技能前缀 **`fst-`**。

命名依据：

- **flow + state 双关**：flow（流程 / 心流）+ state（状态机）合成一词——
  "流程即状态图"，直接呼应本插件 PRD §七 的 Agent 执行图（状态图编排）内核。
- **有格调不土**：flowstate 借积极心理学"心流"意象，非二次元/游戏土梗，
  且与"动态居中、不僵不纵"的流程哲学契合。
- **前缀 fst-**：
  - 规避 `fs-`（与 Node.js 内置 `fs` 模块在开发者心智中形成 filesystem
    语义误导，尽管技术上不在同一命名空间）。
  - 彩蛋：FST = Finite State Transducer（有限状态转换器），暗合状态机主题。
  - 与 `pf-`（plugin-factory）无冲突。

## 后果

- 插件目录名 `flowstate/`；技能命名 `fst-init` / `fst-change` / `fst-review` /
  `fst-iterate`（对应 PRD §四 F1/F5/F6/F8 等核心环节）。
- 中文展示名用于 README / marketplace 描述，英文名用于目录与技能前缀。
- 未定事项（详见 PRD §十一）随后续落地回填。

## 备选方案

- `dev-flow`（否决：直白但无记忆点，且与 plugin-factory 的 `df-` 近似易混）。
- `iter-zen` / 保交楼 deliver-guard / 打地鼠 req-whack / 先上车后补票 board-first
  （均评估过：哲学梗或行业梗各有亮点，但整体不如 flowstate 贴合"流程+状态机"双内核）。
- 保留 `fs-` 前缀（否决：开发者对 `fs` = filesystem 的语义联想过强）。

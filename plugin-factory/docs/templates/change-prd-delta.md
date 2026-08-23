# Change PRD delta — <plugin-name>

> **用途**：替代新插件 S1 的 8 题全跑面试，用于现有插件的维护场景（S2–S8，由 `using-pf` 路由）。
> **原则**：现有 PRD + component manifest 仍是 source of truth；本模板只记录**变更增量**，绝不重写整个 PRD。
> **语言**：按现有插件的 `language` 策略填写（默认 tiered：人维护层用 `user_lang`，agent 执行层用英文）。

---

## 1. Change point

<!-- 一句话：本次变更做什么（verb + object）。示例：为 moonbit 插件增加 "format" 技能。 -->

**变更点**：

## 2. Affected components

<!-- 逐项勾选/列出受影响的构件；没有改动的一律不列。 -->

- [ ] Skills（技能）：`<skill-name>`（新增 / 修改 / 退役）
- [ ] Hooks（钩子）：`<event> → <action>`（影响 harnesses：`claude-code | pi | opencode | oh-my-pi`）
- [ ] Commands（命令）：`/<command-name>`
- [ ] Manifests（清单）：`.claude-plugin/plugin.json` / `package.json` / `.opencode/…`
- [ ] References / Rules（引用/规则）：`<file>`
- [ ] 其他：`<…>`

## 3. Complexity (of the change, not the plugin)

<!-- 对"变更"应用 Light/Medium/Heavy 门禁，不是对整个插件重新计分。
     使用 tools/design/complexity.mjs 自动计算。 -->

```bash
node tools/design/complexity.mjs --skills <N> [--hooks] [--harnesses <N>] [--rules] [--cross-scenario]
```

- 变更涉及的技能数：`<N>`
- 需要 hooks：`是 / 否`
- 超出首个之外的 harness 数：`<N>`
- 需要 rules / agents：`是 / 否`
- 结果：**score** `<N>` → **verdict** `Light | Medium | Heavy`

> Light → 直接进 `pf-build`；Medium → `pf-design → pf-build → pf-verify`；Heavy → 额外记录 ADR。
> 若本次变更是跨场景（触及 ≥3 个不相关类别），**拆分**为独立插件，另走 S1 创建。

## 4. Language policy

<!-- 继承现有插件的 language 策略，不重新询问。 -->

- `policy`: `tiered | english | native`
- `user_lang`: `<现有 user_lang，例如 zh-CN>`
- `agent_lang`: `<现有 agent_lang，例如 en>`

## 5. PRD delta

<!-- 只追加/修订与本次变更相关的条目，其余保持原 PRD 不变。 -->

- **Features**（新增/修改的条目，编号 + verb + object + 验收提示）：
  - `N.` <verb> <object> — <acceptance>
- **Scenarios**（新增场景：context → trigger → expected behavior）：
  - `<context> → <trigger> → <behavior>`
- **Non-goals**（新增的明确排除项）：
  - `<explicitly out of scope>`
- **移除/退役**（若涉及技能退役）：
  - `<skill-name>` 退役原因：`<why>`

## 6. Sign-off

<!-- 变更增量须用户确认后方可进入设计/构建。 -->

- [ ] 用户已确认变更增量内容
- 日期：`<YYYY-MM-DD>`

---

## 完成后

- 将 delta 合并/追加进现有 PRD 文件（不重写），并把变更增量同步到 component manifest（若受影响）。
- 路由：Light → `pf-build`；Medium/Heavy → `pf-design`（Heavy 额外记录 ADR）。
- 参考：`skills/pf-intent/SKILL.md`（Change mode 章节）、`references/design-principles.md`（Iron Law 5）。

# Enhancement Tasks — 详细任务分解

> **Source**: `docs/plan/enhancements-plan.md`
> **Created**: 2026-08-08
> **Batch discipline**: ≤5 tasks per batch, commit checkpoint between batches

---

## Batch 1: Phase A — pf-learn 基础

### T-A1: verify.mjs 添加 learnable 字段

**目标**：`makeFinding()` 支持可选 `learnable` 字段，finding 结构向后兼容。

**变更**：
- `scripts/verify.mjs` — `makeFinding()` 签名增加 `learnable = false` 可选参数
- 不改变任何现有调用点（所有调用点用默认值 `false`）

**验收**：
- `npm test` 100/100
- `node -e "const {makeFinding} = require('./scripts/verify.mjs'); console.log(makeFinding('x','f','WARN','a','i'))"` 不报错
- `node -e "const {makeFinding} = require('./scripts/verify.mjs'); console.log(makeFinding('x','f','WARN','a','i', true))"` 返回含 learnable:true 的对象

---

### T-A2: 新增 skills/pf-learn/SKILL.md

**目标**：定义学习协议技能，包含 Iron Law / Red Flags / 执行流程 / 类别映射。

**内容要点**：
- Iron Law: `NO IMPROVEMENT WITHOUT REPRODUCIBLE FINDING`
- 触发时机：verify finding 含 `learnable: true`、用户说 "learn this"、重复类型 finding 出现 2+ 次
- 执行流程：确认根因 → 归类 → 更新对应技能文件 → 验证格式
- 归类：`schema-drift` → 更新 references；`missing-signal` → 更新 verify.mjs；`duplicated-guidance` → 更新 skill body
- 输出 JSON 结构

**验收**：
- SKILL.md 格式符合 Agent Skills 标准
- `node scripts/verify.mjs structure --root .` 通过

---

### T-A3: pf-lifecycle 添加 learnable 信号推荐

**目标**：在 `skills/pf-lifecycle/SKILL.md` 中添加 learnable 信号的说明和路由规则。

**变更**：
- 新增信号 `learnable-finding` — WARN，当 verify finding 含 `learnable: true` 时触发
- 路由到 `pf-learn` 执行知识沉淀
- 更新决策矩阵表

**验收**：
- 文档更新正确
- `npm test` 100/100

---

### T-A4: 新增 tests/learn/learnable-finding.test.mjs

**目标**：验证 learnable finding 的生成和 pf-learn 路由。

**测试内容**：
1. `makeFinding` 默认 `learnable: false`
2. `makeFinding` 显式 `learnable: true`
3. `runChecks` 不生成 learnable finding（向后兼容）
4. pf-learn 技能的 SKILL.md 包含必需的三段式

**验收**：
- 4 个测试全部通过
- `npm test` 104/104

---

## Batch 2: Phase B — Pipeline State

### T-B1: 新增 pipeline-state.schema.json.tmpl

**目标**：定义 pipeline state 的 JSON schema。

**Schema 内容**：
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Plugin Pipeline State",
  "type": "object",
  "required": ["schema_version", "phase", "status"],
  "properties": {
    "schema_version": { "type": "integer", "enum": [1] },
    "pipeline": { "type": "string", "enum": ["development", "bugfix", "maintenance"] },
    "phase": { "type": "string" },
    "status": { "type": "string", "enum": ["pending", "in_progress", "blocked", "completed"] },
    "plan_file": { "type": "string" },
    "tasks": {
      "type": "object",
      "properties": {
        "total": { "type": "integer" },
        "completed": { "type": "integer" },
        "current": { "type": "integer" }
      }
    },
    "last_updated": { "type": "string", "format": "date-time" }
  },
  "additionalProperties": false
}
```

**验收**：
- Schema 可通过 `ajv` 或手动验证
- 写入 `templates/shared/pipeline-state.schema.json.tmpl`

---

### T-B2: 新增 scripts/pipeline-state.mjs

**目标**：pipeline state 的读写、校验、迁移函数。

**导出函数**：
- `readState(root)` — 读取 pipeline-state.json，不存在返回 null
- `writeState(root, state)` — 写入并校验 schema
- `migrateState(state)` — schema_version 迁移（当前只支持 v1）
- `validateState(state)` — 校验 state 是否符合 schema，返回 errors[]

**验收**：
- 单元测试覆盖 read/write/validate/migrate
- 不存在时返回 null 而非抛错
- schema 变更时 migrate 正确迁移

---

### T-B3: pf-build 集成 pipeline state

**目标**：scaffold 生成的插件包含初始 pipeline-state.json。

**变更**：
- `scripts/scaffold.mjs` — `buildValues()` 新增 `pipelineState` 对象
- `scaffoldPlugin()` 在生成后写入 `pipeline-state.json`（从 template 渲染）
- `templates/shared/pipeline-state.json.tmpl` — 初始状态模板
- `skills/pf-build/SKILL.md` — 文档化 pipeline state 的使用方式

**验收**：
- 生成的插件包含 `pipeline-state.json`
- `npm run smoke` 通过
- `node scripts/verify.mjs structure --root <generated>` 通过

---

### T-B4: verify.mjs 添加 pipeline-consistency 检查

**目标**：verify 引擎检查 pipeline state 的 schema 版本和 plan_file 存在性。

**变更**：
- `scripts/verify.mjs` — `structureChecks` 新增 `pipeline-consistency` 检查
  - 有 pipeline-state.json → 校验 schema_version 匹配
  - 有 plan_file 引用 → 检查文件存在
- 不阻断（WARN 级别）

**验收**：
- 有效 state 不产生 finding
- 无效 state（schema_version 不匹配）产生 WARN
- `npm test` 通过

---

### T-B5: 新增 tests/pipeline/pipeline-state.test.mjs

**目标**：验证 pipeline state 读写和校验。

**测试内容**：
1. readState 不存在文件返回 null
2. writeState + readState 回环
3. validateState 有效 state 通过
4. validateState 无效 schema_version 失败
5. migrateState 从旧版本迁移
6. verify.mjs pipeline-consistency 检查

**验收**：
- 6 个测试全部通过
- `npm test` 110/110

---

## Batch 3: Phase C — SKILL Template 三段式

### T-C1: 更新 SKILL.md.tmpl 三段式

**目标**：标准模板包含 Iron Law / Red Flags / Post-routing self-check 三段。

**变更**：
- `templates/skills/{{PLUGIN_PREFIX}}-hello/SKILL.md.tmpl` — 新增三段模板
  - `## Iron Law` — 代码块，1 句核心约束
  - `## Red Flags` — 表格，3-5 个典型 rationalization
  - `## 路由后自检清单` — 5 项检查列表
- 保留现有结构，新增段落插在合适位置

**验收**：
- 模板渲染后生成的 SKILL.md 包含三段
- 生成插件通过 `npm run validate`

---

### T-C2: 更新 using-pf/SKILL.md 采纳新结构

**目标**：`using-pf` 技能更新，符合新模板三段式。

**变更**：
- 添加 `## Iron Law` 段（现有内容已有隐含铁律，提取为显式）
- 添加 `## Red Flags` 段（现有 Red Flags 表格保留，格式对齐新模板）
- 添加 `## 路由后自检清单` 段（现有 Post-routing self-check 段保留，格式对齐）

**验收**：
- `npm test` 110/110
- `node scripts/verify.mjs structure --root .` 通过

---

### T-C3: 更新所有 pf-* 技能采纳新结构

**目标**：pf-build、pf-design、pf-intent、pf-verify、pf-lifecycle、pf-git 全部采纳三段式。

**变更**：
- 每个技能新增/对齐 Iron Law / Red Flags / 自检清单段落
- 不改变功能逻辑，只调整结构

**验收**：
- 所有 pf-* 技能的 SKILL.md 包含三段
- `node scripts/verify.mjs structure --root .` 通过
- `npm test` 110/110

---

### T-C4: pf-verify 添加 skill-structure 检查

**目标**：verify 引擎检查 SKILL.md 是否包含必需的结构段落。

**变更**：
- `scripts/verify.mjs` — `structureChecks` 新增 `skill-structure` 检查
  - 每条 active skill 的 SKILL.md 必须包含 `## Iron Law`
  - 必须包含 `## Red Flags` 或 `## Red Flags`（中英文均可）
  - 必须包含 `## 路由后自检` 或 `## Post-routing`
- 缺失时 WARN（不阻断，因为这是新标准，旧技能需要迁移）

**验收**：
- 新模板生成的技能通过
- 旧技能（缺少段）产生 WARN
- `npm test` 通过

---

### T-C5: 新增 tests/verify/skill-structure.test.mjs

**目标**：验证 skill-structure 检查。

**测试内容**：
1. 包含完整三段的 SKILL.md 通过
2. 缺少 Iron Law 产生 WARN
3. 缺少 Red Flags 产生 WARN
4. 缺少自检清单产生 WARN

**验收**：
- 4 个测试全部通过
- `npm test` 114/114

---

## Batch 4: Phase D — Pre-commit 安全扫描

### T-D1: 新增 pre-commit.sh.tmpl 和 pre-commit.ps1.tmpl

**目标**：pre-commit hook 模板，包含安全扫描 + 增量结构检查。

**变更**：
- `templates/shared/scripts/pre-commit.sh.tmpl`：
  ```bash
  #!/usr/bin/env bash
  # Pre-commit hook: security scan + incremental structure check
  set -euo pipefail
  # Step 0: Secret scan (staged files only)
  git diff-index --cached --name-only | \
    xargs grep -lE '(password|secret|token|api[_-]?key|private[_-]?key)' 2>/dev/null && \
    { echo "WARNING: Possible secrets in staged files" >&2; exit 1; } || true
  # Step 1: Structural check (fast)
  npm run validate
  ```
- `templates/shared/scripts/pre-commit.ps1.tmpl` — PowerShell 等效实现
- 两个脚本成对，保持跨平台一致

**验收**：
- 两个脚本语法检查通过（`bash -n` / `pwsh -NoProfile -Command`）
- secrets scan pattern 可检测常见 secret

---

### T-D2: hooks.json.tmpl 添加 pre-commit 声明

**目标**：hooks.json 模板声明 pre-commit hook。

**变更**：
- `templates/harnesses/claude-code/hooks/hooks.json.tmpl` — 新增 `PreCommit` 事件
  ```json
  "PreCommit": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "hooks/pre-commit.sh",
          "shell": "bash",
          "description": "Pre-commit gate (secrets scan + structure check)"
        }
      ]
    }
  ]
  ```

**验收**：
- hooks.json 模板解析为有效 JSON
- `node scripts/verify.mjs structure --root .` 通过

---

### T-D3: pf-git 文档化增强 pre-commit hook

**目标**：更新 `skills/pf-git/SKILL.md`，文档化新的 pre-commit hook 能力。

**变更**：
- 6.3 节更新：pre-commit hook 现在包含 Step 0 (secrets scan) + Step 1 (validate)
- 添加安全扫描的说明和注意事项
- 添加可选性说明（用户自行安装）

**验收**：
- 文档准确反映新行为
- `npm test` 114/114

---

### T-D4: pf-verify 添加 pre-commit hook 检查

**目标**：verify 引擎检查 pre-commit hook 存在性。

**变更**：
- `scripts/verify.mjs` — `structureChecks` 新增 `pre-commit-hook` 检查
  - 有 `hooks/PreCommit` 事件声明 → 必须有 `pre-commit.sh` 和 `pre-commit.ps1`
  - 缺失 → WARN（新标准，旧插件迁移）
- `skills/pf-verify/SKILL.md` — 更新验证清单

**验收**：
- 有 pre-commit hook 的插件通过
- 缺失的插件产生 WARN
- `npm test` 114/114

---

### T-D5: 新增 tests/hooks/pre-commit-security.test.mjs

**目标**：验证 pre-commit hook 的安全扫描能力。

**测试内容**：
1. pre-commit.sh.tmpl 语法检查
2. pre-commit.ps1.tmpl 语法检查
3. hooks.json.tmpl 包含 PreCommit 事件
4. pre-commit hook 可检测 staged secret
5. verify.mjs pre-commit-hook 检查

**验收**：
- 5 个测试全部通过
- `npm test` 119/119

---

## Batch 5: Phase E — Entry Skill alwaysApply

### T-E1: using-pf 添加 alwaysApply

**目标**：`using-pf/SKILL.md` frontmatter 添加 `alwaysApply: true`。

**变更**：
- `skills/using-pf/SKILL.md` — frontmatter 添加 `alwaysApply: true`
- 更新 Overview 段，说明 alwaysApply 的行为

**验收**：
- `npm test` 119/119
- `node scripts/verify.mjs structure --root .` 通过

---

### T-E2: SKILL.md.tmpl 添加 alwaysApply 占位符

**目标**：新技能模板包含 `alwaysApply` 字段。

**变更**：
- `templates/skills/{{PLUGIN_PREFIX}}-hello/SKILL.md.tmpl` — frontmatter 添加 `alwaysApply: true`
- 引导技能（`using-<plugin>`）应有 `alwaysApply: true`，普通技能无此字段

**验收**：
- 生成的技能 frontmatter 正确
- `npm test` 119/119

---

### T-E3: pf-verify 添加 entry-always-apply 检查

**目标**：verify 引擎检查 using-<plugin> 入口技能是否标记 alwaysApply。

**变更**：
- `scripts/verify.mjs` — `orchestrationChecks` 新增 `entry-always-apply` 检查
  - 存在 `using-<plugin>` 入口技能 → 必须有 `alwaysApply: true`
  - 缺失 → WARN（新标准）
- `skills/pf-verify/SKILL.md` — 更新编排健康检查清单

**验收**：
- using-pf 有 alwaysApply → 通过
- 模拟缺失 alwaysApply 的入口技能 → WARN
- `npm test` 通过

---

### T-E4: 新增 tests/verify/entry-always-apply.test.mjs

**目标**：验证 entry-always-apply 检查。

**测试内容**：
1. using-<plugin> 有 alwaysApply: true → 通过
2. using-<plugin> 缺少 alwaysApply → WARN
3. 非入口技能没有 alwaysApply → 不触发检查

**验收**：
- 3 个测试全部通过
- `npm test` 122/122

---

## Batch 6: Dogfood + 整合

### T-F1: pf-learn 自身文档化 learned-patterns

**目标**：生成插件包含 `references/learned-patterns.md` 模板，沉淀验证发现。

**变更**：
- `templates/shared/references/learned-patterns.md.tmpl` — 模板文件
- `pf-build` 文档化此文件的存在用途

**验收**：
- 生成的插件包含此文件
- `npm run smoke` 通过

---

### T-F2: 全量 smoke test 验证

**目标**：端到端验证所有 Phase 的整合效果。

**执行**：
```bash
npm run smoke
npm run validate
npm test
```

**验收**：
- 122/122 测试通过
- smoke test 通过
- plugin-factory 自身通过 validate

---

## 执行顺序与依赖

```
Batch 1 (T-A1~A4)  →  Batch 2 (T-B1~B5)  →  Batch 3 (T-C1~C5)
       ↓                         ↓                        ↓
  verify.mjs learnable    pipeline-state.mjs       skill template 3-section
       ↓                         ↓                        ↓
Batch 4 (T-D1~D5)  →  Batch 5 (T-E1~E4)  →  Batch 6 (T-F1~F2)
       ↓                         ↓                        ↓
  pre-commit hook        alwaysApply              dogfood + release
```

每个 Batch 完成后执行 commit checkpoint：
1. `npm test` — 全绿
2. `npm run validate` — 通过
3. `npm run smoke` — 通过
4. Commit: `feat(pf): <phase-name> — <summary>`
5. 汇报结果，等待用户确认再继续

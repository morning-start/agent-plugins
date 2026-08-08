---
name: pf-learn
description: Use when verify produces a learnable finding (learnable:true) that indicates a recurring bug pattern, validation rule gap, or skill template deficiency that should be encoded into a reusable skill or reference. Not for one-off bugs or RCA—only for systematic learnable patterns.
tags: [pf, pf-learn, learn, rule, bug, pattern, reusable]
metadata:
  prefix: pf
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-08
    updated: 2026-08-08
  keywords_zh: "学习, 规则沉淀, 模式提取, 知识复用"
---

# pf-learn — Learnable Finding Protocol

## Iron Law

```
NO RULE WITHOUT A REPRODUCIBLE FINDING
```

Only learn from findings with `learnable: true`. One-off bugs go to `scratch/`. Systematic patterns go here.

## When to Use

- `verify.mjs` outputs a finding with `learnable: true`
- The same finding class appears 2+ times across plugin projects
- The finding reveals a gap in existing skill templates or rules
- The fix is generalizable (not project-specific)

## Red Flags — STOP and Evaluate

- Single occurrence → log to `scratch/`, don't create rule
- Project-specific context needed → skip, document in finding action
- Fix requires architectural change → route to `pf-design`, not `pf-learn`
- Finding is FAIL severity with `learnable: false` → fix first, learn never

## Execution Flow

```
┌─ INPUT: verify finding with learnable:true
│  - signal, file, severity, action, impact
├─ CLASSIFY: Which bucket does this belong to?
│  - rule → references/rules.md
│  - skill-gap → new skill or update existing
│  - template → update SKILL.md.tmpl
│  - test-gap → update or add tests
├─ ASSESS: How many projects affected?
│  - 1 project → document in scratch/
│  - 2+ projects → encode as reusable rule
├─ CREATE: Update references/ or skills/
│  - New rule: append to references/rules.md
│  - New skill: scaffold via pf-build
│  - Update template: modify templates/skills/...
└─ OUTPUT: JSON report + confirmation
```

## Classification Map

| Finding Signal | Action |
|----------------|--------|
| `missing-entry-skill` (persistent) | Add to `references/orchestration-patterns.md` |
| `broken-handoff` (recurring) | Update `references/handoff-conventions.md` |
| `trigger-overlap` (systematic) | Add exclusion rule to `references/skill-dedup.md` |
| `skill-too-large` (common) | Extract to `references/skill-size-guidance.md` |
| `lifecycle-status` missing | Add to `templates/shared/SKILL.md.tmpl` |
| `name-collision` (cross-plugin) | Document naming conflict resolution in `references/naming-convention.md` |
| `harness-gap` (missing adapter) | Route to `pf-design` for new harness support |
| `test-coverage` (systematic gap) | Add to `references/testing-patterns.md` |

## Output Format

```json
{
  "learned_at": "2026-08-08T10:00:00Z",
  "source_finding": {
    "signal": "broken-handoff",
    "file": "skills/foo/SKILL.md",
    "severity": "WARN",
    "learnable": true
  },
  "classification": "rule",
  "action_taken": "Appended to references/rules.md",
  "rule_updated": "references/rules.md#L42",
  "scope": "all-plugins"
}
```

## 自检清单 (Post-routing Self-Check)

- [ ] Finding has `learnable: true` in source
- [ ] Classification is one of: rule / skill-gap / template / test-gap
- [ ] Assessment confirmed 2+ projects affected (or one-off for scratch)
- [ ] Output JSON written to `.agent-workplace/state/artifacts.json`
- [ ] No architectural changes requested (those go to `pf-design`)

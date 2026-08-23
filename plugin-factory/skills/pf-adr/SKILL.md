---
name: pf-adr
description: Use when a major, hard-to-reverse architecture decision needs to be recorded, when writing a new ADR (Architecture Decision Record) for this repo or a generated plugin, when an existing ADR must be superseded or deprecated, when the ADR status machine or template is needed, or when routed from pf-design (Heavy path) to record an architectural decision.
tags: [pf, pf-adr, adr, architecture, decision, documentation]
metadata:
  prefix: pf
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-09
    updated: 2026-08-09
  keywords_zh: "架构决策, 写 ADR, 决策记录, ADR 状态机, ADR 模板"
---

# pf-adr — Architecture Decision Records

## Overview

Records **one decision**: why the system looks the way it does, which
alternatives were considered, and what they cost. Code shows *what*; an ADR
preserves *why* — the most expensive, most easily lost knowledge. Writing an
ADR also clarifies thinking: putting a decision down exposes disagreements
and forces convergence. This skill follows the ADR conventions (previously
`references/adr-conventions.md`) — do not re-search the web for ADR practice.

## When to Use

- A **major, hard-to-reverse** decision is being made (high rework cost, hard to overturn).
- The decision **affects multiple components / harnesses / people** (beyond one skill or one harness).
- The decision **constrains future choices** (once made, it limits later options).
- An existing ADR needs a status change (`Superseded` / `Deprecated`).
- Routed from `pf-design` (Heavy path) — architectural decisions during design.

**Do not** use for small, reversible, locally-decidable choices — over-documenting
is the number-one cause of ADR practice collapse. Make those directly.

### Trigger test

> Would a new senior engineer get burned by not knowing this decision?
> Yes → write it. No → don't.

## Workflow

### 1. Apply the trigger standard

Only write ADRs for decisions that are **hard to reverse**, **affect multiple
components / harnesses / people**, or **constrain future choices**. Otherwise
skip the ADR — the decision is made inline.

### 2. Choose the status (immutable state machine)

Each ADR has exactly one status:

| Status | Meaning |
|--------|---------|
| `Proposed` | Under discussion, not accepted |
| `Accepted` | Accepted by the team and in effect |
| `Superseded` | Decision changed; link to the ADR that replaces it |
| `Deprecated` | No longer applies with no direct replacement (explicit retirement) |

**Immutability iron law: an accepted ADR is never edited.** When a decision
changes, write a new ADR and mark the old one `Superseded by ADR-NNNN` with
mutual links. Editing history erases the ADR's whole value — the evolution
chain *is* the point of ADRs.

### 3. Write the ADR

- Location: `docs/ADR-NNNN-<kebab-case>.md` (in-repo, diffable with code).
- One page (single screen), Markdown, monotonically increasing number,
  filename captures the decision topic.
- **Inverted pyramid**: most important first, details later.
- Template:

```markdown
# ADR-NNNN — <decision title>

- **状态**: Accepted | Proposed | Superseded | Deprecated
- **日期**: YYYY-MM-DD
- **背景（forces）**: why this decision is needed; the driving constraints.

## 决策

One sentence + necessary detail.

## 理由

Key tradeoffs; **explicitly list every seriously-considered alternative and
why it was rejected** (this is what ends future arguments and explains the
choice to newcomers).

## 后果

What becomes easier / harder; context changes that should trigger revisiting.
```

### 4. Follow the process

1. Write a `Proposed` ADR when a major decision is about to land.
2. After discussion / review, accept it (PR review; land the implementation in the same PR).
3. When an accepted decision is re-debated — point at the existing ADR first;
   if none exists, that is the signal to write one.
4. Decision changes → new `Accepted` ADR; old ADR marked `Superseded` and linked.

### 5. Retroactive ADRs

When newcomers most often ask "why did we do it this way" about a landed
decision, retroactively write an `Accepted` ADR — ten minutes, immediate value,
opens the log. Better than empty process talk.

## Outputs

- `docs/ADR-NNNN-<kebab-case>.md` with status, date, background, decision,
  rationale (alternatives + rejections), and consequences.

## Acceptance

- The decision passes the trigger test (hard-to-reverse / multi-component /
  constrains future).
- Status is one of `Proposed | Accepted | Superseded | Deprecated`.
- Number is monotonically increasing and unique.
- `Superseded` ADRs link the replacing ADR; the chain is intact.
- `tools/verify/verify.mjs` `adr-status` probe passes (no new FAIL/WARN findings).

## Status

v0.1 — extracted from `references/adr-conventions.md` (2026-08-09).

## Iron Law

```
Accepted ADRs are never edited. Decision changes → new ADR + Superseded link.
```

## Red Flags — STOP and Rethink

- Writing an ADR for every small decision (over-documentation kills the practice)
- Editing an accepted ADR instead of writing a new one (breaks the chain)
- Skipping the alternatives-and-rejections section (defeats the purpose)
- Leaving status empty or inventing a new status value

## 自检清单 (Post-routing Self-Check)

- [ ] Trigger test passed (hard-to-reverse / multi-component / constrains future)
- [ ] Status is one of the four valid values
- [ ] Number unique and continuous with existing ADRs
- [ ] Alternatives and rejections documented in 理由
- [ ] `tools/verify/verify.mjs` adr-status probe green

# Documentation and Status Synchronization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Update documentation only after the corresponding implementation evidence exists.

**Goal:** Keep project claims, roadmap status, references, and task evidence synchronized so maintainers can distinguish documented, implemented, and verified behavior.

**Architecture:** Use `docs/tasks/README.md` as the execution index and preserve `references/` as the normative contract. Reports remain analysis artifacts; they must link to task evidence instead of serving as an outdated backlog.

**Tech Stack:** Markdown, existing repository references, validator commands.

## Global Constraints

- Repository documentation and skills remain in English; final user communication may be Chinese.
- Never mark a task complete without a command or smoke result that proves it.
- Do not rewrite historical analysis conclusions; add status and evidence links.
- Do not add a second entry command to the project.

## File Map

- Modify `README.md` and `README.zh-CN.md`: update roadmap and supported-harness claims only after T1–T5 pass.
- Modify `AGENTS.md` and `CLAUDE.md`: reflect the actual scripts and verification entrypoints.
- Modify `references/plugins-reference.md`: point to the generated artifact contract.
- Modify `references/lifecycle-matrix.md`: point each implemented signal to its probe.
- Modify `docs/report/optimization-plan.md`: add implementation status and task links.
- Modify `docs/glossary.md`: add verifier, finding schema, dogfood, and release-check terms if used by the implementation.
- Modify `docs/tasks/README.md`: record completion evidence and remaining scope.

## Implementation Tasks

- [ ] **Step 1: Build an evidence table**

For every claim in README, AGENTS, `pf-build`, `pf-verify`, and `pf-release`, record one of:

```text
planned | documented | implemented | verified | blocked
```

Attach the exact command or test path for `implemented` and `verified` states.

- [ ] **Step 2: Reconcile harness claims**

Only list a harness as supported when T1 generated artifacts and T5 smoke checks pass. If a harness is still unavailable, label it as planned rather than supported.

- [ ] **Step 3: Reconcile lifecycle claims**

Update `pf-lifecycle`, `pf-analyze`, and `references/lifecycle-matrix.md` so every claimed probe has a signal name, severity policy, and test path.

- [ ] **Step 4: Reconcile release claims**

Document the actual prepare/check/publish sequence and link to the release-safety task. Remove any wording that implies an automatic push or tag unless the command explicitly performs that action.

- [ ] **Step 5: Verify documentation consistency**

Run:

```text
npm test
npm run validate
npm run validate:ps
npm run verify:json
npm run smoke
```

Then manually compare English and Chinese README tables for the same supported-harness set and lifecycle stages.

## Acceptance Criteria

- No README or skill claims an unimplemented adapter or probe.
- Every implemented quality gate has a command or test path.
- Task status is evidence-backed.
- The documentation does not duplicate generated-plugin skill content.

## Non-goals

- Do not add marketing copy.
- Do not translate agent-execution skills into Chinese.
- Do not alter historical report content except to add status links or corrections grounded in current code.

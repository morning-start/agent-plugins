# Dogfood and Smoke Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use a task-by-task implementation workflow with a review gate after every checkbox group.

**Goal:** Prove plugin-factory can generate, validate, bootstrap, and audit one real example plugin without manual copying or undocumented repair.

**Architecture:** Use a deterministic fixture plugin named `git-release` with prefix `gr`. Generate it into `workspace/dogfood/git-release` from a clean temporary target, then run the same verifier and adapter contract checks used by normal release preparation.

**Tech Stack:** Node built-in test runner, existing scaffold and verifier CLIs, optional installed harness CLIs for live checks.

## Global Constraints

- The dogfood plugin is a test fixture, not a product feature.
- Its skill body must be created through the documented `skill-creator` workflow when behavior evaluation is enabled.
- Tests must not modify global harness configuration.
- Live harness tests are additive; static artifact and bootstrap checks remain mandatory when a harness CLI is unavailable.
- The fixture must be reproducible from a clean target.

## File Map

- Create `tests/smoke/dogfood-smoke.test.mjs`.
- Create `tests/smoke/fixtures/git-release-intent.json`.
- Create `tests/smoke/fixtures/git-release-manifest.json`.
- Modify `workspace/dogfood/` only with generated output during the test; do not hand-edit committed fixture files.
- Modify `package.json`: add `smoke` and `smoke:live` scripts.
- Modify `skills/pf-verify/SKILL.md`: add dogfood acceptance evidence.
- Modify `commands/pf-verify.md`: document static versus live smoke checks.
- Modify `docs/report/optimization-plan.md`: replace completed/planned ambiguity with evidence-backed status links.

## Interfaces

The smoke test must run these stages:

```text
create temporary target
→ scaffold git-release with all advertised harnesses
→ assert deterministic file inventory
→ run generated project verifier
→ check bootstrap marker in every adapter
→ run lifecycle probes
→ remove temporary target
```

The test result must identify the failed stage:

```json
{
  "stage": "generated-verification",
  "target": "...",
  "ok": false,
  "message": "..."
}
```

## Implementation Tasks

- [ ] **Step 1: Define the dogfood intent and manifest fixtures**

Create fixtures with:

- one fixed scenario: preparing a release;
- one entry skill `using-gr`;
- one real skill generated through the approved skill workflow;
- all four harnesses;
- no hooks beyond session bootstrap;
- explicit handoff artifacts.

- [ ] **Step 2: Add failing smoke stages**

Write tests for:

1. scaffold output exists;
2. all declared manifest paths exist;
3. generated validation passes;
4. bootstrap marker exists exactly once per adapter;
5. lifecycle output contains no `FAIL` findings;
6. cleanup removes the temporary target after success or failure.

Run:

```text
node --test tests/smoke/dogfood-smoke.test.mjs
```

Expected before T1–T4: FAIL at the first missing generated artifact or verifier stage.

- [ ] **Step 3: Implement static dogfood smoke test**

Use `fs.mkdtemp` outside the repository, invoke the scaffold and verifier CLIs with `child_process.spawnFile`, assert exit codes, and clean the target in a `finally` block. Do not invoke `git clean` or remove any repository path.

- [ ] **Step 4: Add optional live harness lanes**

For each harness, detect its CLI using the platform-native command lookup. If absent, report `SKIP` with the harness name; if present, run only a temporary project-scoped load check. Never write to global plugin directories.

Required live assertions:

- Claude Code loads the plugin directory and sees `using-gr`;
- pi loads the package and lists the generated skill;
- oh-my-pi loads the package using `omp` metadata;
- opencode loads the local plugin and discovers the skill path.

- [ ] **Step 5: Wire package scripts and verify**

Add:

```json
{
  "scripts": {
    "smoke": "node --test tests/smoke/dogfood-smoke.test.mjs",
    "smoke:live": "node tests/smoke/run-live.mjs"
  }
}
```

Run:

```text
npm test
npm run smoke
npm run validate
npm run validate:ps
```

Expected: static smoke passes on every platform; live lanes either pass or report an explicit unavailable-harness skip.

## Acceptance Criteria

- One command reproduces the complete generated-plugin path.
- No manual `cp -r skills ...` step is needed.
- Static smoke catches missing manifest targets, missing bootstrap adapters, and verifier regressions.
- Live checks never modify global configuration.
- The dogfood result is suitable as release evidence.

## Non-goals

- Do not use dogfood as a substitute for unit fixtures.
- Do not require every developer machine to have every harness installed.
- Do not commit generated temporary output as source-of-truth plugin content.

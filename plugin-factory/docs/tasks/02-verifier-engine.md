# Verifier and Lifecycle Probe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use a task-by-task implementation workflow with a review gate after every checkbox group.

**Goal:** Turn `pf-verify` and `pf-analyze` from prose checklists into one cross-platform executable audit engine with stable findings and exit codes.

**Architecture:** Implement all parsing and checks once in `scripts/verify.mjs`. Bash and PowerShell wrappers invoke it. The engine has a structural layer, a harness-contract layer, and an orchestration/lifecycle layer; all layers emit the same finding schema.

**Tech Stack:** Node.js built-ins (`fs`, `path`, `url`, `child_process` only where needed), Node `node:test`, JSON output, Bash, PowerShell.

## Global Constraints

- No duplicate Bash and PowerShell parsing logic.
- A `FAIL` finding exits with code 1; warnings exit with code 0.
- The engine must work against both the plugin-factory root and a generated plugin directory.
- The engine must never execute skill content or install dependencies.
- All checks operate on files and metadata only; runtime telemetry remains out of scope for v1.

## File Map

- Create `scripts/verify.mjs`: CLI, parsers, checks, output format.
- Create `scripts/validate-structure.sh`: wrapper invoking `verify.mjs structure`.
- Create `scripts/validate-structure.ps1`: wrapper invoking `verify.mjs structure`.
- Create `scripts/lifecycle-probes.sh` and `scripts/lifecycle-probes.ps1`: wrappers invoking `verify.mjs lifecycle`.
- Create `tests/verify/verify-engine.test.mjs`: valid and invalid fixtures.
- Create `tests/fixtures/verify-valid/` and `tests/fixtures/verify-invalid/`.
- Modify `package.json`: add `verify`, `verify:json`, `lifecycle`, and `test` scripts.
- Modify `skills/pf-verify/SKILL.md` and `commands/pf-verify.md`: reference executable checks and exact exit behavior.
- Modify `skills/pf-lifecycle/SKILL.md` and `commands/pf-analyze.md`: reference lifecycle probe output.
- Modify `references/lifecycle-matrix.md`: map each signal to an implemented probe name.

## Interfaces

The engine must expose:

```js
export function runChecks(root, { layers = ["structure", "harness", "orchestration"] } = {}) {
  return { root, findings };
}
```

Each finding must have this shape:

```json
{
  "signal": "missing-entry-skill",
  "file": "skills/using-demo/SKILL.md",
  "severity": "FAIL",
  "action": "Create the declared using-<plugin> entry skill or remove the methodology-plugin claim.",
  "impact": "The advertised entry path cannot activate the workflow."
}
```

CLI forms:

```text
node scripts/verify.mjs --root . --format table
node scripts/verify.mjs --root . --format json
node scripts/verify.mjs structure --root .
node scripts/verify.mjs lifecycle --root ./workspace/dogfood/git-release
```

## Implementation Tasks

- [ ] **Step 1: Add failing fixture tests**

Create fixtures covering:

- valid skill frontmatter;
- missing frontmatter delimiters;
- name mismatch and duplicate names;
- missing hook pair;
- manifest advertising an absent harness;
- missing `using-<plugin>` entry;
- orphan skill;
- broken handoff chain;
- version drift.

Run:

```text
node --test tests/verify/verify-engine.test.mjs
```

Expected before implementation: FAIL because no unified engine exists.

- [ ] **Step 2: Implement parsers and finding rendering**

Implement:

```js
parseFrontmatter(text)
readJson(path)
collectSkills(root)
collectHarnesses(root)
makeFinding(signal, file, severity, action, impact)
renderTable(findings)
```

Frontmatter parsing must require opening and closing `---` markers and must read only fields inside the frontmatter block.

- [ ] **Step 3: Implement structure checks**

Structure checks must enforce:

- every skill directory has `SKILL.md`;
- `name` equals the directory name;
- name matches the project regex;
- description starts with `Use when` and is at most 1024 characters;
- every command has a frontmatter `description`;
- every `.sh` hook has a `.ps1` peer;
- every declared JSON file is valid JSON.

- [ ] **Step 4: Implement harness checks**

For each advertised harness, verify the complete artifact set:

- Claude Code: `.claude-plugin/plugin.json`, root `skills/`, `commands/` when declared, and `hooks/hooks.json` when hooks are declared;
- pi: `package.json.pi.skills` and `package.json.pi.extensions` targets exist;
- oh-my-pi: `package.json.omp.skills` and `package.json.omp.extensions` targets exist;
- opencode: `.opencode/opencode.json`, `.opencode/plugins/`, and a discoverable skill path exist.

- [ ] **Step 5: Implement lifecycle probes**

Implement these signal names from `references/lifecycle-matrix.md`:

```text
skill-too-large
trigger-overlap
repeated-guidance
nested-skill-tree
harness-gap
zombie-skill
name-collision
version-drift
broken-handoff
orphan-skill
missing-entry-skill
```

Use deterministic thresholds already documented in the matrix. Trigger overlap may initially use normalized keyword intersection; report it as `WARN` unless the overlap is exact and both skills claim the same scenario.

- [ ] **Step 6: Add wrappers and package commands**

The wrappers must pass arguments unchanged to Node. `package.json` must expose:

```json
{
  "scripts": {
    "test": "node --test tests",
    "validate": "bash scripts/validate-structure.sh",
    "validate:ps": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-structure.ps1",
    "verify": "node scripts/verify.mjs --format table",
    "verify:json": "node scripts/verify.mjs --format json",
    "lifecycle": "node scripts/verify.mjs lifecycle --format table"
  }
}
```

- [ ] **Step 7: Verify parity and release blocking**

Run:

```text
node --test tests/verify/verify-engine.test.mjs
npm run validate
npm run validate:ps
npm run verify:json
npm run lifecycle
```

Expected:

- valid fixtures pass;
- invalid fixtures return code 1 with stable `signal` values;
- Bash and PowerShell structure wrappers produce equivalent findings;
- lifecycle output is severity-ranked and machine-readable when requested.

## Acceptance Criteria

- `pf-verify` can be executed without relying on manual checklist interpretation.
- `pf-analyze` produces the documented finding shape and exit behavior.
- The same source engine is used on Windows and Unix-like shells.
- Every lifecycle matrix signal either has a probe or is explicitly marked as a future runtime-only signal.

## Non-goals

- Do not execute or evaluate LLM behavior in this task.
- Do not collect telemetry.
- Do not automatically repair findings.

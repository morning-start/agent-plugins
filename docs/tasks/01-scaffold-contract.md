# Multi-harness Scaffold Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use a task-by-task implementation workflow with a review gate after every checkbox group.

**Goal:** Make scaffolding produce a valid standalone project for every advertised harness instead of declaring pi/oh-my-pi support while generating Claude-only files.

**Architecture:** Use one Node.js renderer as the cross-platform implementation. Keep `scaffold.sh` and `scaffold.ps1` as argument-normalizing wrappers. Store shared project files once and store only harness-specific manifests, bootstrap adapters, and install instructions under harness-specific template directories.

**Tech Stack:** Node.js built-ins, Bash, PowerShell, TypeScript templates, Node built-in test runner.

## Global Constraints

- Canonical skill bodies remain in one generated `skills/` directory.
- Harnesses must be explicit: `claude-code`, `pi`, `opencode`, and `oh-my-pi`.
- A harness is advertised only when all required artifacts are rendered.
- No external dependency is required for template rendering.
- User-supplied values must be escaped safely; do not interpolate raw values into `sed` or PowerShell replacement expressions.

## File Map

- Create `scripts/scaffold.mjs`: argument parsing, validation, template rendering, and output manifest.
- Modify `scripts/scaffold.sh`: thin Bash wrapper around `scripts/scaffold.mjs`.
- Modify `scripts/scaffold.ps1`: thin PowerShell wrapper around `scripts/scaffold.mjs`.
- Create `templates/shared/`: common README, AGENTS/CLAUDE, package metadata, install files, validator wrappers, and example skill.
- Create `templates/harnesses/claude-code/`: plugin manifest and Claude hook wiring.
- Create `templates/harnesses/pi/`: pi extension and package contribution.
- Create `templates/harnesses/oh-my-pi/`: oh-my-pi package contribution and compatibility notes.
- Create `templates/harnesses/opencode/`: `opencode.json`, plugin module, skill discovery link/copy strategy, and install notes.
- Create `tests/scaffold/scaffold-contract.test.mjs`: valid and invalid generation cases.
- Modify `skills/pf-build/SKILL.md`: replace Claude-only scaffold assumptions with the renderer contract.
- Modify `references/plugin-model.md` and `references/plugins-reference.md`: document generated artifact invariants.

## Interfaces

`scaffold.mjs` must expose a testable function and a CLI:

```js
export function scaffoldPlugin({
  name,
  prefix,
  target,
  description,
  userLang,
  harnesses,
}) {
  // returns { target, harnesses, files }
}
```

The CLI must accept:

```text
node scripts/scaffold.mjs \
  --name git-release \
  --prefix gr \
  --target ./workspace/dogfood/git-release \
  --description "Release workflow helper" \
  --user-lang zh-CN \
  --harnesses claude-code,pi,opencode,oh-my-pi
```

The returned `files` list is relative to `target` and is used by smoke tests to verify deterministic output.

## Implementation Tasks

- [ ] **Step 1: Add failing scaffold contract tests**

Create tests that assert:

1. all four harnesses produce their required artifacts;
2. a Claude-only request does not produce pi, omp, or opencode files;
3. a name containing uppercase characters is rejected;
4. a description containing `/`, `&`, `$`, backslashes, Unicode, and newlines is rendered literally;
5. an existing target directory is rejected without modifying it.

Run:

```text
node --test tests/scaffold/scaffold-contract.test.mjs
```

Expected before implementation: FAIL because `scripts/scaffold.mjs` and the harness templates do not exist.

- [ ] **Step 2: Implement the Node renderer**

Implement `validateOptions`, `renderTemplate`, and `scaffoldPlugin` in `scripts/scaffold.mjs`.

Required behavior:

- validate `name` and `prefix` with `^[a-z0-9]+(-[a-z0-9]+)*$`;
- reject an existing target before creating any file;
- render replacements through a function-based substitution, not shell replacement syntax;
- write UTF-8 files with stable LF line endings;
- return a sorted relative file list;
- fail if a requested harness has no template directory.

- [ ] **Step 3: Split shared and harness-specific templates**

Move the current common files from `templates/claude-code/` into `templates/shared/`. Create these required harness outputs:

```text
claude-code/.claude-plugin/plugin.json
claude-code/hooks/hooks.json
claude-code/hooks/session-start.sh
claude-code/hooks/session-start.ps1
pi/.pi/extensions/<prefix>-bootstrap.ts
opencode/.opencode/opencode.json
opencode/.opencode/plugins/<prefix>-bootstrap.ts
oh-my-pi/.pi/extensions/<prefix>-bootstrap.ts
```

The shared package metadata must not claim a harness-specific extension path unless the selected harness renderer created that file.

- [ ] **Step 4: Replace shell interpolation with the renderer wrapper**

Make `scaffold.sh` and `scaffold.ps1` pass normalized arguments to `node scripts/scaffold.mjs`. They must preserve the existing positional interface while also supporting `--harnesses`.

Both wrappers must return the Node process exit code unchanged and must not contain their own template substitution logic.

- [ ] **Step 5: Copy the validator into generated projects**

Add shared templates for the verifier entrypoints that the generated `package.json` references. The generated project must contain:

```text
scripts/verify.mjs
scripts/validate-structure.sh
scripts/validate-structure.ps1
```

The generated `npm run validate` command must not reference a file absent from the generated tree.

- [ ] **Step 6: Update build and adapter contracts**

Update `skills/pf-build/SKILL.md` so its acceptance section requires:

- requested harness list is recorded;
- each requested harness has all required files;
- no unrequested harness file is generated;
- generated project passes the shared verifier;
- no manual skill copy is required for opencode.

Update `references/plugin-model.md` and `references/plugins-reference.md` with the same artifact contract.

- [ ] **Step 7: Verify the generated matrix**

Run:

```text
node --test tests/scaffold/scaffold-contract.test.mjs
npm run validate
npm run validate:ps
```

Expected: all tests pass; Bash and PowerShell validators agree; the test fixture confirms the exact generated file set.

## Acceptance Criteria

- A four-harness scaffold contains valid Claude, pi, oh-my-pi, and opencode artifacts.
- A generated project does not contain a dangling `pi.extensions`, `omp.extensions`, or validator path.
- Special characters in user input survive byte-for-byte in generated text.
- Bash and PowerShell wrappers delegate to one renderer.
- The generated project can run its own validator immediately after scaffolding.

## Non-goals

- Do not author real generated skills in this task.
- Do not add install-time modification of user-global agent configuration.
- Do not implement lifecycle analysis or release publishing here.

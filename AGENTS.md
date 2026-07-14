# MoonBit Skills — Engineering Transformation

## Mission

Transform MoonBit agent skills from **academic/knowledge-oriented** (prose-heavy, reference-laden, suggestive) to **engineering/execution-oriented** (imperative command chains, hook-gated validation, template-driven scaffolding, error recovery playbooks).

## Layout

```
moonbit-skills/
├── AGENTS.md              ← this file
├── skills-lock.json       ← tracks installed skills (all 9 are from moonbitlang/skills)
├── .gitignore             ← **/skills/  (published copies are gitignored)
├── agents/                ← agent definitions for orchestration & engineering
│   ├── moonbit-engineer.md
│   └── moonbit-orchestrator.md
├── analysis_reference/    ← reference docs from real project analyses (miniio, mbtgraph, etc.)
│   ├── superpowers-orchestration-design.md
│   └── miniio-analysis.md
└── draft/
    └── skills/            ← clone of github.com/moonbitlang/skills (has its own git)
        ├── README.md      ← install/maintain docs
        ├── skills.sources.json  ← upstream repo mapping for vendored skills
        ├── scripts/sync-upstream-skills.py  ← pulls vendored skills from upstream
        ├── .github/workflows/sync-upstream-skills.yml ← daily sync cron
        ├── .claude-plugin/ ← marketplace metadata
        └── skills/        ← 9 skill directories, each with SKILL.md
            ├── make-moonbit-c-bindings/     ← LOCAL (not vendored)
            ├── moonbit-agent-guide/         ← VENDORED from moonbitlang/moonbit-agent-guide
            ├── moonbit-c-binding/           ← VENDORED from moonbitlang/moonbit-agent-guide
            ├── moonbit-extract-spec-test/   ← LOCAL
            ├── moonbit-orientation/         ← LOCAL
            ├── moonbit-proof/               ← VENDORED from moonbitlang/moonbit-agent-guide
            ├── moonbit-refactoring/         ← VENDORED from moonbitlang/moonbit-agent-guide
            ├── moonbit-spec-test-development/ ← VENDORED from bobzhang/moonbit-spec-test-development
            └── ocaml2moonbit-migration/     ← VENDORED from moonbitlang/moonbit-agent-guide
```

## Skill Anatomy

Every skill at `draft/skills/skills/<name>/` follows:

```
<name>/
├── SKILL.md               ← entry point (required)
├── references/            ← deep-dive docs (optional, academic pattern)
├── templates/             ← scaffolding templates (optional, engineering pattern)
├── scripts/               ← automation (optional)
└── agents/                ← OpenAI agent config (optional)
```

## Source Rules

| Skill | Editable here? | Edit upstream instead |
|-------|---------------|----------------------|
| `make-moonbit-c-bindings` | **Yes** — local | — |
| `moonbit-extract-spec-test` | **Yes** — local | — |
| `moonbit-orientation` | **Yes** — local | — |
| `moonbit-agent-guide` | No | `moonbitlang/moonbit-agent-guide` |
| `moonbit-c-binding` | No | `moonbitlang/moonbit-agent-guide` |
| `moonbit-proof` | No | `moonbitlang/moonbit-agent-guide` |
| `moonbit-refactoring` | No | `moonbitlang/moonbit-agent-guide` |
| `ocaml2moonbit-migration` | No | `moonbitlang/moonbit-agent-guide` |
| `moonbit-spec-test-development` | No | `bobzhang/moonbit-spec-test-development` |

Vendored skills get overwritten by `draft/skills/scripts/sync-upstream-skills.py`. Edit them upstream, or remove from `skills.sources.json` to take ownership.

## Engineering Transformation Workflow

A skill is engineering-ready only when it passes all 7 dimensions below. Apply them in order during transformation.

### 1. Command Integrity & Executability

Every operation must be a ` ``` ` code block ready to copy-paste, not prose advice embedded in paragraphs.

| Academic (bad) | Engineering (good) |
|---------------|-------------------|
| `Run moon check to catch type errors early` | ````moon check --warn-list +73```` |
| `You should create a moon.pkg.json with the right imports` | ````{templates/moon.pkg.json → src/moon.pkg.json}```` |

When platform matters, annotate inline:

```bash
moon test --target native
# Windows: moon test --target native
```

### 2. Error Recovery Protocol

Every command that can fail needs a recovery chain attached. Pattern:

```bash
moon test --target native
# If fails: moon test --target native -- --show-output  (detail)
# If type error E####: moon check --explain E####        (diagnose)
# If still fails after fix: escalate — likely ABI mismatch or missing dep
```

Three-layer recovery chain:
1. **Diagnose** — narrow the failure (`--explain`, `--show-output`, specific target)
2. **Fix** — the typical remediation
3. **Escalate** — when fix doesn't work, give up pattern with next step

### 3. Verification Pipeline

Every skill ends with a single copy-paste command that validates the outcome:

```bash
moon fmt --check && moon check --warn-list +73 && moon test --target native && moon info --target native
```

Rules:
- Must be a single ` ``` ` block (no bullet list of separate commands)
- Include `moon fmt`, `moon check`, `moon test`, `moon info` at minimum
- Add skill-specific checks (ASan, coverage, doc generation) after the baseline

### 4. Template Scaffolding

File templates live in `templates/` and map to destinations with variable substitution.

```
templates/
├── wrapper.c              → src/wrapper.c           (replace {name}, {return_type})
├── moon.pkg.json          → src/moon.pkg.json       (replace {link_libs})
├── moon.mod.json          → moon.mod.json           (replace {package_name})
├── ffi.mbt                → src/ffi.mbt             (replace {func_name})
└── prepare.py             → scripts/prepare.py      (no substitution needed)
```

Template rules:
- One file per role, not one file per project
- Use `{variable}` placeholders, document the substitution table
- Template path is from skill root; destination path is from project root

### 5. Precondition Gates

Opening section of every skill. Checks environment before execution:

```markdown
## Pre-check
- [ ] `moon --version` outputs ≥0.1.20250401
- [ ] `gcc --version` or `clang --version` available (for C bindings)
- [ ] Project has `moon.mod.json` with valid `name`
- [ ] Target source repository is accessible
```

If any check fails, the skill must output the install/fix command and stop. Do not proceed with missing deps.

### 6. Checkpoint System

After each major step, insert a mid-execution verification:

```markdown
### Checkpoint: post-wrapper-generation
moon check --target native
# If fails: check wrapper.c for type-width mismatches → fix → recheck
```

Checkpoint location rules:
- After file generation (verify the output compiles)
- After FFI declaration (verify C/MoonBit ABI alignment)
- After test commit (verify regression coverage)
- Before pushing to remote (verify commit hygiene)

### 7. Idempotency

Re-running the same skill must not produce different results or side effects.

| Do | Don't |
|----|-------|
| `if not exists: create` | unconditional overwrite |
| Check file existence before writing | Assume directory is empty |
| `--force` flag on destructive ops | Silent overwrite |
| `git status` as final state read | No state check |

### Application Pattern

```
Pre-check → Step 1 (+ recovery) → Checkpoint → Step 2 (+ recovery) → ... → Verification Pipeline
```

Start with `make-moonbit-c-bindings` as pilot (already scores 5/7, missing recovery + gates). Apply the 7-dimension checklist there, document the pattern, then cascade to `moonbit-extract-spec-test` and `moonbit-orientation`.

## Skill Orchestration Workflow

### Architecture

```
User Intent
    │
    ▼
moonbit-orientation (入口分类器)
    │
    ├──→ "写 C 绑定"       → make-moonbit-c-bindings
    ├──→ "提取 spec test"   → moonbit-extract-spec-test
    ├──→ "学 MoonBit"       → moonbit-agent-guide
    ├──→ "重构代码"         → moonbit-refactoring
    ├──→ "做证明"           → moonbit-proof
    ├──→ "迁移 OCaml"       → ocaml2moonbit-migration
    └──→ 其他              → references/ 中更细粒度的指引
```

### Orchestration Principles

**1. Single Entry Point**
`moonbit-orientation` is the mandatory gateway for all MoonBit requests. Its job: classify → route → load target skill. An agent must NOT skip orientation and jump directly into a domain skill.

**2. Description-Driven Trigger**
Each skill's `description` field (SKILL.md frontmatter) is the routing key. It must contain concrete trigger vocabulary for precise matching.

| Too vague | Specific enough |
|-----------|----------------|
| `"Use this skill for MoonBit development"` | `"Use when writing C FFI bindings: wrapper.c, moon.pkg.json with link:"` |
| `"For refactoring MoonBit code"` | `"Use when renaming, extracting, or restructuring MoonBit functions/types"` |

**3. Skill Composition**
Complex tasks chain multiple skills:

```
moonbit-orientation: "用户要做 C binding + spec test"
  → make-moonbit-c-bindings (generate wrapper + FFI)
  → moonbit-extract-spec-test (extract tests from implementation)
  → moonbit-orientation: verification wrap-up
```

Each skill returns a standard result summary so the next skill can continue.

**4. Fallback Chain**
If the target skill does not exist or does not apply:

```
Exact skill match → references/ sub-guide → moonbit-agent-guide (general) → state limitation
```

Do not silently proceed with an ill-fitting skill. State what is missing and route.

**5. Dependency Declaration**
Skills that depend on another skill's output must declare it:

```markdown
## Depends on
- moonbit-orientation: classify user intent first
- make-moonbit-c-bindings: must complete before extracting specs
```

### Orchestration Flow

```
1. User request arrives
2. moonbit-orientation classifies:
   a. Domain: binding / spec / refactor / learn / migrate / other
   b. Scope: single step / multi-step chain
3. Route to first skill by description match
4. Execute skill → produce output + state summary
5. If multi-step: route to next skill in chain
   If single-step: return result with verification
6. If no skill matches: fallback chain → references/ → general guidance
```

## Commands

```bash
# List all skills available
npx skills@latest add . --list   # run from draft/skills/

# Sync vendored skills from upstream
python3 scripts/sync-upstream-skills.py   # run from draft/skills/

# Validate skill structure (each needs SKILL.md)
# Manual: check draft/skills/skills/*/SKILL.md exists
```

## Key Constraints

- `.gitignore` has `**/skills/` — do not commit installed skill copies to git
- `skills-lock.json` at root tracks the universe of skills; update it when adding/removing
- Vendored skills must NOT be edited locally; the sync script replaces them
- Each skill directory is a self-contained unit; an agent loads only its SKILL.md
- The transformation is incremental — start with one skill, establish pattern, then apply to others
- `analysis_reference/` stores finished analysis reports from real project studies (miniio, mbtgraph, etc.) — these are MoonBit engineering knowledge artifacts to learn from, not methodology guides

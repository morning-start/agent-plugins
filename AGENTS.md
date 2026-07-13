# MoonBit Skills — Engineering Transformation

## Mission

Transform MoonBit agent skills from **academic/knowledge-oriented** (prose-heavy, reference-laden, suggestive) to **engineering/execution-oriented** (imperative command chains, hook-gated validation, template-driven scaffolding, error recovery playbooks).

## Layout

```
moonbit-skills/
├── AGENTS.md              ← this file
├── skills-lock.json       ← tracks installed skills (all 9 are from moonbitlang/skills)
├── .gitignore             ← **/skills/  (published copies are gitignored)
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

## Engineering Transformation Checklist

When editing a SKILL.md, shift from academic → engineering:

- [ ] Replace "consider X" with imperative commands the agent should run
- [ ] Add error recovery playbook (e.g., "if `moon check` fails → `moon check --explain` → fix → recheck")
- [ ] Add verification pipeline at end: `moon fmt && moon check --warn-list +73 && moon test && moon info`
- [ ] Include templates/ for scaffolding (moon.pkg, moon.mod.json, wrapper.c, etc.)
- [ ] Reduce references/ dependencies — inline what fits, surface what does not
- [ ] Add hook-style validation gates (pre-entry checks, mid-edit checks, completion gate)
- [ ] Prune prose that teaches MoonBit language basics (delegate to moonbit-agent-guide instead)
- [ ] Keep one narrow use case per skill; merge if overlap, split if too broad

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

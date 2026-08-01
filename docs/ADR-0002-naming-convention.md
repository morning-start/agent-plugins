# ADR-0002 — Skill Naming Convention (`pf-` prefix)

- **Status**: Accepted (2026-08-01)
- **Context**: sub-skill names must be short enough to invoke comfortably, distinct
  enough to avoid collisions in shared skill directories (`.agents/skills/`,
  `~/.agents/skills/`), and compliant with the Agent Skills standard (name == directory).

## Decision

- Directory and `name` both use `<project-prefix>-<short-name>`:
  `skills/pf-intent/SKILL.md` → `name: pf-intent`.
- Prefix is a short abbreviation (`pf`), never the full project name (`plugin-factory-intent`).
- Slash commands mirror the prefix: `/pf-new`, `/pf-intent`, `/pf-analyze`, …
- `tags`/`metadata` carry redundant brand info (`tags: [pf, pf-intent]`).

## Rationale

- name == directory keeps Claude Code (strict) loading the skill; pi is lenient,
  opencode v2 does not enforce, so the strictest harness wins.
- Short prefix keeps invocation ergonomic while preventing collisions.
- Generated plugins adopt the same convention with their own project prefix.

## Consequences

- verifier must check name == directory and cross-source uniqueness.
- Prefix choice is part of the plugin's identity (documented in `references/design-principles.md`).

## Alternatives considered

- Long prefix on folder (`plugin-factory-intent`) — rejected: unwieldy.
- Prefix only in `name` field — rejected: breaks Claude Code's name == directory rule.
- No prefix — rejected: collisions in shared directories.

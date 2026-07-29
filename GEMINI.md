# MoonBit Skills

You have MoonBit Skills loaded. When working on MoonBit projects, follow the guidance in the skills.

## Getting Started

When the user asks about MoonBit development, check the bootstrap skill at `skills/using-moonbit-skills/SKILL.md` to route the user's intent to the correct skill.

## Available Skills

The following skills are available in the `skills/` directory:
- `init` — Set up git hooks for quality gates
- `plan` — Clarify requirements and design architecture
- `writing-plans` — Break design into executable tasks
- `scaffold` — Dynamically generate project skeleton
- `implement` — TDD/Feature + Bug Fix Mode (dual-mode)
- `testing` — Design tests, organize test files, iterate on test code
- `perform` — Optimize performance with measurement-driven cycle
- `refactor` — Refactor code with test protection, eliminate code smells
- `code-review` — Code review gate between tasks
- `verify` — Full verification pipeline
- `evaluate` — Acceptance evaluation and release prep
- `learn` — Learn from bugs and update the skill system

## Rules

- Always check `skills/using-moonbit-skills/SKILL.md` before any MoonBit-related action
- Follow the skill pipeline: plan → writing-plans → scaffold → [testing ↔] implement → [perform ↔] → [refactor ↔] → verify → evaluate
- The user makes decisions; you execute
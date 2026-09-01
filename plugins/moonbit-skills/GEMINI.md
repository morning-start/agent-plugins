# MoonBit Skills

You have MoonBit Skills loaded. When working on MoonBit projects, follow the guidance in the skills.

## Getting Started

When the user asks about MoonBit development, check the bootstrap skill at `skills/using-moonbit-skills/SKILL.md` to route the user's intent to the correct skill.

## Available Skills

The following skills are available in the `skills/` directory:
- `plan` — Clarify requirements and design architecture/API
- `scaffold` — Dynamically generate project skeleton from approved design
- `testing` — Design tests, organize test files, iterate on test code
- `verify` — Full verification pipeline (B/C/E three tiers)
- `moonbit-ci` — CI pipeline, GitHub Actions, local hooks, branch protection

> 通用开发流程（实现、任务拆解、代码审查、发布、部署、性能、重构、git、文档、安全）不属于本插件，由用户或外部流程插件承担。

## Rules

- Always check `skills/using-moonbit-skills/SKILL.md` before any MoonBit-related action
- Follow the MoonBit-specific pipeline: plan → scaffold → testing → verify（CI 随时可调）; 实现与部署超出本插件范围
- The user makes decisions; you execute
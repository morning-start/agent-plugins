---
name: pf-verify
description: Use when a plugin project needs structural or compliance checks, when SKILL.md frontmatter or directory naming must be validated against the Agent Skills standard, when hooks need multi-shell verification, when running the pre-release audit, or when routed from /pf-verify. Triggers on "audit", "check plugin", "verify plugin".
tags: [pf, pf-verify, plugin, audit, compliance, validation]
metadata:
  prefix: pf
---

# pf-verify — Verification & Audit

## Overview

Checks a plugin project (generated or existing) against the quality bars
(`references/design-principles.md`): Agent Skills standard compliance, per-harness
adapter rules, and multi-shell hook completeness. **No audit, no release.**

## When to Use

- Before any release (`/pf-release`).
- After a build (`pf-build`) — mandatory for Medium/Heavy paths.
- When a skill fails to load in a harness (name==dir, description length, uniqueness).
- The user runs `/pf-verify` or says "audit"/"check" the plugin.

## Responsibilities (skeleton — completed in M1, audit upgraded in M3)

- Validate every SKILL.md: frontmatter, `name` == directory, description ≤ 1024 chars,
  trigger-style, third person.
- Validate names: `^[a-z0-9]+(-[a-z0-9]+)*$`, uniqueness across sources.
- Validate hooks: bash **and** PowerShell variants exist; `hooks.json` wiring.
- Validate manifests per harness (`references/agent-adapters.md`).
- Emit a pass/fail report with severity-ranked findings (scripts: `scripts/validate-structure.*`).

## Status

M0 scaffold: scripted structural checks exist in `scripts/`; full per-harness audit
lands in M1, lifecycle-aware audit in M3.

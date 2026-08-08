---
name: vv-hello
description: Use when a fixture hello skill applies.
tags: [vv, vv-hello]
---

# vv-hello

## Iron Law

```
Hello skills are read-only — no mutations.
```

## When to Use

- A fixture hello action is requested.
- Verifying the skill structure check passes.

## Steps

1. Produce the hello output.

## Red Flags — STOP and Rethink

- Mutating state in a hello skill
- Skipping the output contract

## 自检清单 (Post-routing Self-Check)

- [ ] Output is read-only
- [ ] No side effects produced

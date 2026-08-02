---
name: gr-check
description: Use when pre-release checks must run before publishing a release.
tags: [gr, gr-check, release]
metadata:
  prefix: gr
---

# gr-check — Pre-release checks

## Overview

Runs the pre-release checklist: version sync, changelog evidence, clean
worktree, and harness artifacts.

## Steps

1. Run the release gate and record results.
2. Report the checklist verdict.

## Common mistakes

- Skipping the changelog evidence check.

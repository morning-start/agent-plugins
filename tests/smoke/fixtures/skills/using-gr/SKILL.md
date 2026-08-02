---
name: using-gr
description: Use when preparing a release, when deciding whether pre-release checks must run, or when a session starts and release work is intended.
tags: [gr, using-gr, release]
metadata:
  prefix: gr
---

# using-gr — Release entry

## Overview

Entry skill for the git-release dogfood plugin. Before ANY release work,
determine intent and route: prepare → run gr-check, then verify → release.

## Routing

1. **Prepare a release** → run `gr-check`, then verify → release.
2. **Just a question** → answer directly; no scenario needed.

## Handoff

After this, route to `gr-check`.

---
description: Initialize a MoonBit project with git hooks and quality gates
---

I want to initialize a MoonBit project with quality gates. Follow the `moonbit-ci` skill to:

1. Detect if this is a MoonBit project (check for `moon.mod` or `moon.mod.json`)
2. Check if it's a git repository
3. Set up git hooks (pre-commit, pre-push, pre-completion)
4. Configure `core.hooksPath` and the local/remote CI infrastructure
5. Verify the hooks work

If the project is not a MoonBit project or not a git repository, tell me what's missing and how to fix it.
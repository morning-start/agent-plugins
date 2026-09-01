---
description: Start the MoonBit development pipeline (design → scaffold → testing → verify)
---

I want to start a MoonBit development task. Follow the MoonBit Skills pipeline:

1. **Plan** — Use `moonbit-plan` to clarify my requirements and design the architecture/API
2. **Scaffold** — Use `moonbit-scaffold` if this is a new project (skip if project exists)
3. **Testing** — Use `moonbit-testing` to design the test strategy
4. **Verify** — Use `moonbit-verify` for the full quality gate

CI (GitHub Actions, hooks) can be added any time via `moonbit-ci`. Implementation and deployment are outside this plugin's scope and handled by the user or an external workflow such as flowstate/fst.

Start by asking me what I want to build. Then route through the pipeline step by step, getting my approval at each stage before proceeding.
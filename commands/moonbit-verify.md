---
description: Run full MoonBit verification pipeline (fmt, check, test, audit)
---

Run the full MoonBit verification pipeline for this project. Follow the `moonbit-verify` skill to execute all quality gates:

1. **Format check** — `moon fmt --check`
2. **Type check** — `moon check`
3. **Tests** — `moon test`
4. **Workspace status** — `moon info`
5. **Security audit** — `moon-audit` (if available)

Report each check as pass/fail with actual command output. If any check fails, provide the root cause and suggested fix. Do not claim success without running the actual commands.

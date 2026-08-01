---
description: Release a plugin — run verification, bump SemVer, update CHANGELOG, sync the bilingual README, provide install scripts.
---

# /pf-release — Release

Prerequisites: `/pf-verify` passes; CHANGELOG entries exist for all changes.

## Steps

1. Run `pf-verify` — abort on any failure.
2. Bump version (SemVer) in `package.json` and every per-harness manifest
   (`.claude-plugin/plugin.json`, …).
3. Update `CHANGELOG.md` (Conventional Commits, current milestone).
4. Sync `README.md` and `README.zh-CN.md` (English docs, Chinese user-facing README).
5. Ensure `install.sh` / `install.ps1` exist and are executable.
6. Tag the release (e.g. `v0.1.0`).

Rules: no verify pass → no release; version sync across all manifests.

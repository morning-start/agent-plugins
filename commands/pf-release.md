---
description: Release a plugin — run verification, bump SemVer across all manifests, update CHANGELOG, sync the bilingual README, ensure install scripts, tag the release.
---

# /pf-release — Release

Prerequisites: `pf-verify` passes (exit 0); CHANGELOG entries exist for all changes.

## Steps

1. **Verify** — run `pf-verify`; abort on any FAIL finding.
2. **Version bump (SemVer)** — bump `version` in **all** of:
   - `package.json` (including the `pi` / `omp` fields if present);
   - `.claude-plugin/plugin.json`;
   - any versioned orchestration metadata in the component manifest.
3. **CHANGELOG** — Conventional Commits (`feat`/`fix`/`refactor`/`docs`/`test`/`chore`),
   current milestone; record which lifecycle action drove the change
   (split / merge / reorganize / port / retire) when applicable.
4. **Bilingual README** — sync `README.md` (English) and `README.zh-CN.md` (Chinese
   edition); both must reflect the new version and features.
5. **Install scripts** — ensure `install.sh` / `install.ps1` exist and are executable
   (`chmod +x` on Unix).
6. **Tag** — `git tag v<version>` (e.g. `v0.1.0`) and push, for a distributed release.

## Rules

- No verify pass → no release.
- Version must be **identical across every manifest** (drift = FAIL).
- Docs stay English; the user-facing README keeps the Chinese edition in sync.

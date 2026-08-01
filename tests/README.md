# tests/

Infrastructure tests for plugin-factory.

- **M0**: structural checks live in `scripts/validate-structure.sh` / `.ps1`
  (frontmatter, name == dir, description rules, multi-shell hook pairs) — run via
  `npm run validate`.
- **M1+**: behavior scenarios per skill (pressure tests following the writing-skills
  TDD methodology), adapter conformance tests, and generated-plugin smoke tests.
- **M4**: dogfood — generate an example plugin with plugin-factory itself and verify
  it passes `pf-verify`.

Full test scaffolding lands in M1; until then, `scripts/validate-structure.*` is the
regression gate.

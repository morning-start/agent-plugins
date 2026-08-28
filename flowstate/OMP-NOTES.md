# flowstate — oh-my-pi (omp) notes

oh-my-pi (omp) is a fork of pi. This plugin is installed via:

```sh
omp plugin install git:github.com/morning-start/agent-plugins
```

- The `package.json` carries both `pi` and `omp` fields (`pkg.omp` preferred,
  `pkg.pi` fallback — `omp.extensions` points to the same
  `.pi/extensions/fst-bootstrap.ts`).
- The bootstrap extension follows the pi extension API, which omp keeps
  compatible; it injects the entry skill `skills/using-fst/SKILL.md`
  (marker `FLOWSTATE_BOOTSTRAP:flowstate`).
- Reload plugins with `/reload-plugins`.
- Skills are discovered from `skills/` via `pkg.omp.skills`.

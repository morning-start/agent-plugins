// tests/hooks/pre-commit-security.test.mjs
// T-D5: pre-commit hook tests
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runChecks } from "../../tools/verify/verify.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES = join(here, "..", "fixtures");

test("plugin with hooks/ but no pre-commit gets WARN", async () => {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const tmp = join(FIXTURES, "tmp-pre-commit");
  await mkdir(join(tmp, "hooks"), { recursive: true });
  await writeFile(join(tmp, "hooks", "session-start.sh"), "#!/bin/bash\necho hello");
  try {
    const { findings } = await runChecks(tmp, { layers: ["structure"] });
    const hooks = findings.filter((f) => f.signal === "missing-pre-commit-hook");
    assert.ok(hooks.length > 0, "Expected missing-pre-commit-hook warning");
    assert.equal(hooks[0].severity, "WARN");
  } finally {
    const { rm } = await import("node:fs/promises");
    await rm(tmp, { recursive: true, force: true });
  }
});

test("plugin with pre-commit.sh passes check", async () => {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const tmp = join(FIXTURES, "tmp-pre-commit-ok");
  await mkdir(join(tmp, "hooks"), { recursive: true });
  await writeFile(join(tmp, "hooks", "session-start.sh"), "#!/bin/bash\necho hello");
  await writeFile(join(tmp, "hooks", "pre-commit.sh"), "#!/bin/bash\necho pre-commit");
  try {
    const { findings } = await runChecks(tmp, { layers: ["structure"] });
    const hooks = findings.filter((f) => f.signal === "missing-pre-commit-hook");
    assert.equal(hooks.length, 0, "Expected no warning when pre-commit.sh exists");
  } finally {
    const { rm } = await import("node:fs/promises");
    await rm(tmp, { recursive: true, force: true });
  }
});

test("plugin without hooks/ directory passes silently", async () => {
  const tmp = join(FIXTURES, "tmp-no-hooks");
  try {
    const { findings } = await runChecks(tmp, { layers: ["structure"] });
    const hooks = findings.filter((f) => f.signal === "missing-pre-commit-hook");
    assert.equal(hooks.length, 0, "No warning expected when no hooks/ exists");
  } finally {
    const { rm } = await import("node:fs/promises");
    await rm(tmp, { recursive: true, force: true });
  }
});

test("pre-commit hook is learnable", async () => {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const tmp = join(FIXTURES, "tmp-pre-commit-learnable");
  await mkdir(join(tmp, "hooks"), { recursive: true });
  await writeFile(join(tmp, "hooks", "session-start.sh"), "#!/bin/bash\necho hello");
  try {
    const { findings } = await runChecks(tmp, { layers: ["structure"] });
    const hooks = findings.filter((f) => f.signal === "missing-pre-commit-hook");
    assert.ok(hooks.length > 0);
    assert.equal(hooks[0].learnable, true, "missing-pre-commit-hook should be learnable");
  } finally {
    const { rm } = await import("node:fs/promises");
    await rm(tmp, { recursive: true, force: true });
  }
});

test("pre-commit.ps1 alone satisfies the check", async () => {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const tmp = join(FIXTURES, "tmp-pre-commit-ps1");
  await mkdir(join(tmp, "hooks"), { recursive: true });
  await writeFile(join(tmp, "hooks", "session-start.sh"), "#!/bin/bash\necho hello");
  await writeFile(join(tmp, "hooks", "pre-commit.ps1"), "# PowerShell pre-commit");
  try {
    const { findings } = await runChecks(tmp, { layers: ["structure"] });
    const hooks = findings.filter((f) => f.signal === "missing-pre-commit-hook");
    assert.equal(hooks.length, 0, "pre-commit.ps1 alone satisfies the check");
  } finally {
    const { rm } = await import("node:fs/promises");
    await rm(tmp, { recursive: true, force: true });
  }
});

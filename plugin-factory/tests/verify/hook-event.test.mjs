// tests/verify/hook-event.test.mjs
// hook-event contract tests: Claude Code hook event names must be on the
// 29-event whitelist (scripts/verify.mjs structure layer).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runChecks } from "../../scripts/verify.mjs";

async function withTemp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "pf-hookev-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function makeRepo(dir, hooksJson) {
  await mkdir(join(dir, "hooks"), { recursive: true });
  await writeFile(join(dir, "hooks", "hooks.json"), JSON.stringify(hooksJson, null, 2), "utf8");
  await writeFile(join(dir, "package.json"), JSON.stringify({ name: "x", version: "0.1.0" }, null, 2), "utf8");
}

test("valid Claude Code hook events produce no hook-event finding", async () => {
  await withTemp(async (dir) => {
    await makeRepo(dir, {
      hooks: {
        SessionStart: [{ hooks: [{ type: "command", command: "echo hi" }] }],
        PostToolUse: [{ matcher: "Write|Edit", hooks: [{ type: "command", command: "lint" }] }],
      },
    });
    const { findings } = await runChecks(dir, { layers: ["structure"] });
    assert.ok(
      !findings.some((f) => f.signal === "hook-event"),
      `unexpected hook-event findings: ${JSON.stringify(findings)}`,
    );
  });
});

test("a misspelled hook event is flagged as WARN", async () => {
  await withTemp(async (dir) => {
    await makeRepo(dir, {
      hooks: {
        postToolUse: [{ hooks: [{ type: "command", command: "lint" }] }], // lowercase t — typo
      },
    });
    const { findings } = await runChecks(dir, { layers: ["structure"] });
    const hookEv = findings.filter((f) => f.signal === "hook-event");
    assert.equal(hookEv.length, 1);
    assert.equal(hookEv[0].severity, "WARN");
    assert.match(hookEv[0].action, /postToolUse/);
  });
});

test("an invented event name is flagged", async () => {
  await withTemp(async (dir) => {
    await makeRepo(dir, {
      hooks: {
        OnEveryTurn: [{ hooks: [{ type: "command", command: "x" }] }],
      },
    });
    const { findings } = await runChecks(dir, { layers: ["structure"] });
    const hookEv = findings.filter((f) => f.signal === "hook-event");
    assert.equal(hookEv.length, 1);
    assert.match(hookEv[0].action, /OnEveryTurn/);
  });
});

test("hooks.json with no hooks key is not flagged", async () => {
  await withTemp(async (dir) => {
    await makeRepo(dir, {});
    const { findings } = await runChecks(dir, { layers: ["structure"] });
    assert.ok(!findings.some((f) => f.signal === "hook-event"));
  });
});

test("the 29-event whitelist covers the new v2.0 events", async () => {
  // Direct regression guard: DirectoryAdded + ElicitationResult must be valid.
  await withTemp(async (dir) => {
    await makeRepo(dir, {
      hooks: {
        DirectoryAdded: [{ hooks: [{ type: "command", command: "pwd" }] }],
        ElicitationResult: [{ hooks: [{ type: "command", command: "echo ok" }] }],
        SessionEnd: [{ hooks: [{ type: "command", command: "echo bye" }] }],
      },
    });
    const { findings } = await runChecks(dir, { layers: ["structure"] });
    assert.ok(
      !findings.some((f) => f.signal === "hook-event"),
      `v2.0 events should pass: ${JSON.stringify(findings)}`,
    );
  });
});

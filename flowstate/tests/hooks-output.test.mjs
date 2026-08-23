// tests/hooks-output.test.mjs
// Regression: session-start hooks (bash + PowerShell) must emit VALID JSON.
// Both variants embed a multi-line Markdown body into additionalContext —
// raw newlines/quotes inside a JSON string literal are illegal (RFC 8259).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const IS_POSIX = process.platform !== "win32";
const ROUTES = ["fst-init", "fst-change", "fst-review", "fst-iterate", "fst-workplace"];
const MARKER = "FLOWSTATE_BOOTSTRAP:flowstate";

async function assertHookJson(label, cmd, args) {
  const { stdout } = await run(cmd, args, { cwd: ROOT, shell: false });
  const parsed = JSON.parse(stdout); // throws on invalid JSON — the regression this guards
  assert.equal(parsed.hookSpecificOutput.hookEventName, "SessionStart", label);
  const ctx = parsed.hookSpecificOutput.additionalContext;
  assert.ok(ctx.startsWith(MARKER), `${label}: marker prefix`);
  for (const route of ROUTES) {
    assert.ok(ctx.includes(route), `${label}: routes ${route}`);
  }
  return ctx;
}

test("session-start.sh emits valid JSON with routing table", { skip: IS_POSIX ? false : "bash resolves to WSL on Windows; POSIX-only" }, async () => {
  const ctx = await assertHookJson("bash", "bash", [join(ROOT, "hooks", "session-start.sh")]);
  assert.ok(ctx.includes("using-flowstate"), "bash: entry skill named");
});

test("session-start.ps1 emits valid JSON with routing table", async () => {
  const ctx = await assertHookJson("powershell", "powershell", [
    "-NoProfile", "-ExecutionPolicy", "Bypass", join(ROOT, "hooks", "session-start.ps1"),
  ]);
  assert.ok(ctx.includes("using-flowstate"), "powershell: entry skill named");
});

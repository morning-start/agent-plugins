// tests/pipeline/pipeline-state.test.mjs
// T-B5: pipeline-state.mjs tests
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  readState,
  writeState,
  migrateState,
  validateState,
} from "../../tools/bootstrap/pipeline-state.mjs";

const tmpDir = join(fileURLToPath(new URL(".", import.meta.url)), "..", "fixtures", "tmp-pipeline");

function setup() {
  rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(tmpDir, { recursive: true });
}

function teardown() {
  rmSync(tmpDir, { recursive: true, force: true });
}

const validState = {
  schema_version: 1,
  pipeline: "development",
  phase: "build",
  status: "in_progress",
  tasks: { total: 5, completed: 2, current: 3 },
  last_updated: "2026-08-08T10:00:00Z",
  next: "build:task-3",
};

test("readState returns null when pipeline-state.json is absent", async () => {
  setup();
  try {
    const result = await readState(tmpDir);
    assert.equal(result, null);
  } finally {
    teardown();
  }
});

test("writeState and readState round-trip", async () => {
  setup();
  try {
    await writeState(tmpDir, validState);
    const result = await readState(tmpDir);
    assert.deepEqual(result, validState);
  } finally {
    teardown();
  }
});

test("migrateState passes through valid v1 state unchanged", () => {
  const result = migrateState(validState);
  assert.deepEqual(result, validState);
});

test("migrateState returns null for null input", () => {
  assert.equal(migrateState(null), null);
});

test("validateState accepts valid state", () => {
  const result = validateState(validState);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test("validateState rejects null input", () => {
  const result = validateState(null);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test("validateState rejects unknown schema_version", () => {
  const bad = { ...validState, schema_version: 99 };
  const result = validateState(bad);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("schema_version")));
});

test("validateState rejects invalid phase", () => {
  const bad = { ...validState, phase: "invalid-phase" };
  const result = validateState(bad);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("phase")));
});

test("validateState rejects completed > total", () => {
  const bad = { ...validState, tasks: { total: 3, completed: 5, current: 2 } };
  const result = validateState(bad);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("completed")));
});

test("validateState accepts completed === total", () => {
  const done = { ...validState, tasks: { total: 5, completed: 5, current: 5 } };
  const result = validateState(done);
  assert.equal(result.valid, true);
});

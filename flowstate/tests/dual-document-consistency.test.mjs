// tests/dual-document-consistency.test.mjs
// Regression suite for the iteration-aware dual-document system
// (.agent-workplace/ = private process workspace, docs/ = human-approved finals).
//
// The architecture's iron laws live in docs/agent-workplace.md and are enforced
// by fst-promote + HITL — but that is HUMAN-enforced. This suite turns them
// into MACHINE-enforced invariants so a drift fails `npm test` before it ships.
//
// Invariants checked (P1–P5):
//   P1  document-status.json is schema-valid and every path points at a real file
//   P2  REVIEW_NEEDED => confidence >= 0.8, source exists, promoted_to under docs/
//   P3  every finalized .md under docs/ has an APPROVED record (no back-door writes)
//   P4  status transitions obey the DRAFT→REVIEW_NEEDED→APPROVED→ARCHIVED/OBSOLETE state machine
//   P5  APPROVED records carry full provenance (source / promoted_to / approver)
//   P6  cross-iteration architecture decisions (shared/adr/, docs/adr/) are
//       managed and traceable back to an iteration design/ (promotion pipeline)
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm, stat, readdir, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "./lib/schema-validator.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const SCHEMAS_DIR = join(ROOT, "schemas");

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function loadJson(p) {
  return JSON.parse(await readFile(p, "utf8"));
}

async function listMd(dir, base = dir, acc = []) {
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await listMd(full, base, acc);
    else if (e.name.endsWith(".md")) acc.push(relative(base, full).replace(/\\/g, "/"));
  }
  return acc;
}

/* ------------------------------------------------------------------ */
/* P4 — state machine                                                  */
/* ------------------------------------------------------------------ */

export const DOC_STATES = ["DRAFT", "REVIEW_NEEDED", "APPROVED", "ARCHIVED", "OBSOLETE"];

// The only legal transitions. Everything else is a consistency violation.
export const ALLOWED_TRANSITIONS = {
  DRAFT: ["REVIEW_NEEDED"],
  REVIEW_NEEDED: ["APPROVED", "DRAFT"],
  APPROVED: ["ARCHIVED", "OBSOLETE", "REVIEW_NEEDED"],
  ARCHIVED: ["OBSOLETE"],
  OBSOLETE: [],
};

/**
 * Return an error string if `next` cannot legally follow `prev`, else null.
 */
export function assertValidTransition(prev, next) {
  if (!DOC_STATES.includes(prev)) return `unknown state "${prev}"`;
  if (!DOC_STATES.includes(next)) return `unknown state "${next}"`;
  if (!ALLOWED_TRANSITIONS[prev].includes(next)) {
    return `illegal transition ${prev} -> ${next}`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* The consistency invariant checker (P1/P2/P3/P5)                      */
/* ------------------------------------------------------------------ */

/**
 * Validate a project root's dual-document consistency.
 *
 * @param {string} root  project root containing .agent-workplace/ and docs/
 * @returns {Promise<string[]>} list of invariant violations (empty = consistent)
 */
export async function checkDualDocumentConsistency(root) {
  const errors = [];
  const statusPath = join(root, ".agent-workplace", "state", "document-status.json");

  // --- P4 schema of the index itself ------------------------------------
  if (!(await exists(statusPath))) {
    errors.push(`missing .agent-workplace/state/document-status.json`);
    return errors;
  }
  let index;
  try {
    index = await loadJson(statusPath);
  } catch (err) {
    errors.push(`document-status.json is not valid JSON: ${err.message}`);
    return errors;
  }

  // --- P1 schema + path existence ---------------------------------------
  const schema = await loadJson(join(SCHEMAS_DIR, "document-status.schema.json"));
  for (const err of validate(schema, index)) errors.push(`P1 schema: ${err}`);
  for (const doc of index.documents || []) {
    if (doc.path && !(await exists(join(root, doc.path)))) {
      errors.push(`P1 path: ${doc.path} does not exist on disk`);
    }
  }

  const docs = index.documents || [];
  const approvedByPath = new Map();
  for (const doc of docs) {
    // --- P2 promotion readiness ----------------------------------------
    if (doc.type === "REVIEW_NEEDED") {
      if (typeof doc.confidence !== "number" || doc.confidence < 0.8) {
        errors.push(`P2 confidence: ${doc.path} is REVIEW_NEEDED but confidence < 0.8`);
      }
      if (doc.path && !(await exists(join(root, doc.path)))) {
        errors.push(`P2 source: ${doc.path} is REVIEW_NEEDED but source file is missing`);
      }
      if (doc.promoted_to && !(doc.promoted_to.startsWith("docs/") || doc.promoted_to.startsWith(".agent-workplace/shared/"))) {
        errors.push(`P2 target: ${doc.path} promotes outside docs/ or shared/ (${doc.promoted_to})`);
      }
    }
    // --- P5 provenance for approved documents ---------------------------
    if (doc.type === "APPROVED") {
      if (!doc.source) errors.push(`P5 provenance: ${doc.path} is APPROVED but missing source`);
      if (!doc.promoted_to) errors.push(`P5 provenance: ${doc.path} is APPROVED but missing promoted_to`);
      if (!doc.approver) errors.push(`P5 provenance: ${doc.path} is APPROVED but missing approver (HITL evidence)`);
    }
    if (doc.type === "APPROVED" && doc.promoted_to) {
      approvedByPath.set(doc.promoted_to, doc.path);
    }
  }

  // --- P3 no un-approved back-door writes into docs/ --------------------
  const docsDir = join(root, "docs");
  const finalized = await listMd(docsDir);
  for (const rel of finalized) {
    const finalPath = `docs/${rel}`;
    if (!approvedByPath.has(finalPath)) {
      errors.push(`P3 authorization: ${finalPath} has no APPROVED record — it was written without fst-promote`);
    }
  }

  // --- P6 design → architecture-decision provenance ---------------------
  // Cross-iteration architecture decisions (ADR) live in shared/adr/ (process)
  // or docs/adr/ (finalized). Every ADR must be a managed record, and an
  // APPROVED one must trace its source back to an iteration design/ (or the
  // shared/adr/ chain) — i.e. it was promoted from a real design choice, not
  // invented out of thin air.
  const adrLocations = [
    { dir: join(root, ".agent-workplace", "shared", "adr"), prefix: ".agent-workplace/shared/adr/" },
    { dir: join(root, "docs", "adr"), prefix: "docs/adr/" },
  ];
  for (const { dir, prefix } of adrLocations) {
    for (const rel of await listMd(dir)) {
      const adrPath = `${prefix}${rel}`;
      const record = docs.find((d) => d.promoted_to === adrPath || d.path === adrPath);
      if (!record) {
        errors.push(`P6 provenance: ${adrPath} has no document-status record — ADRs must be managed`);
        continue;
      }
      if (record.type === "APPROVED") {
        const fromDesign = record.source && (
          record.source.includes("/design/") || record.source.startsWith(".agent-workplace/shared/adr/")
        );
        if (!record.source) {
          errors.push(`P6 provenance: ${adrPath} APPROVED but missing source`);
        } else if (!fromDesign) {
          errors.push(`P6 provenance: ${adrPath} source must come from an iteration design/ (got ${record.source})`);
        }
      }
    }
  }

  return errors;
}

/* ------------------------------------------------------------------ */
/* Helpers to build a synthetic project                                */
/* ------------------------------------------------------------------ */

async function makeProject(docs = [], statusDocs = []) {
  const dir = await mkdtemp(join(tmpdir(), "fst-dd-"));
  await mkdir(join(dir, ".agent-workplace", "state"), { recursive: true });
  await mkdir(join(dir, "docs"), { recursive: true });

  for (const rel of docs) {
    const p = join(dir, rel);
    await mkdir(dirname(p), { recursive: true });
    if (!(await exists(p))) await writeFile(p, "# draft\n", "utf8");
  }

  const index = {
    documents: statusDocs,
    metadata: {
      version: "1.0.0",
      created_at: "2026-08-26T00:00:00Z",
      updated_at: "2026-08-26T00:00:00Z",
      description: "文档状态索引",
    },
  };
  await writeFile(join(dir, ".agent-workplace", "state", "document-status.json"), JSON.stringify(index, null, 2), "utf8");
  return dir;
}

function statusDoc(overrides) {
  return {
    path: ".agent-workplace/iterations/current/development/feature.md",
    type: "REVIEW_NEEDED",
    confidence: 0.9,
    stage: "development",
    iteration: "iteration-001",
    ...overrides,
  };
}

// Tear down the synthetic project deterministically.
async function cleanup(dir) {
  await rm(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

test("P1 — template document-status.json is itself schema-valid", async () => {
  const tpl = join(ROOT, "templates", "agent-workplace", "state", "document-status.json");
  const schema = await loadJson(join(SCHEMAS_DIR, "document-status.schema.json"));
  const data = await loadJson(tpl);
  assert.deepEqual(validate(schema, data), [], "shipped template must not drift from its schema");
});

test("P4 — legal state-machine transitions are accepted", () => {
  assert.equal(assertValidTransition("DRAFT", "REVIEW_NEEDED"), null);
  assert.equal(assertValidTransition("REVIEW_NEEDED", "APPROVED"), null);
  assert.equal(assertValidTransition("APPROVED", "ARCHIVED"), null);
  assert.equal(assertValidTransition("APPROVED", "OBSOLETE"), null);
  assert.equal(assertValidTransition("REVIEW_NEEDED", "DRAFT"), null);
});

test("P4 — illegal state-machine transitions are rejected", () => {
  assert.ok(assertValidTransition("DRAFT", "APPROVED"));
  assert.ok(assertValidTransition("DRAFT", "OBSOLETE"));
  assert.ok(assertValidTransition("OBSOLETE", "APPROVED"));
  assert.ok(assertValidTransition("ARCHIVED", "REVIEW_NEEDED"));
  assert.ok(assertValidTransition("APPROVED", "DRAFT"));
});

test("P1/P2 — a fully consistent workspace has no violations", async () => {
  const dir = await makeProject(
    ["docs/architecture.md"],
    [
      statusDoc({
        path: "docs/architecture.md",
        type: "APPROVED",
        confidence: 0.95,
        source: ".agent-workplace/iterations/current/design/tradeoffs/storage.md",
        promoted_to: "docs/architecture.md",
        approver: "user@example.com",
        approved_at: "2026-08-26T11:05:00Z",
      }),
    ],
  );
  try {
    // APPROVED records point at a real docs/ file — create it
    await writeFile(join(dir, "docs", "architecture.md"), "# Architecture\n", "utf8");
    assert.deepEqual(await checkDualDocumentConsistency(dir), []);
  } finally {
    await cleanup(dir);
  }
});

test("P2 — low-confidence REVIEW_NEEDED is a violation", async () => {
  const dir = await makeProject([], [
    statusDoc({ path: ".agent-workplace/iterations/current/investigation/fact-checks.md", confidence: 0.6 }),
  ]);
  try {
    const errors = await checkDualDocumentConsistency(dir);
    assert.ok(errors.some((e) => e.includes("P2 confidence")), errors.join("\n"));
  } finally {
    await cleanup(dir);
  }
});

test("P2 — REVIEW_NEEDED with missing source file is a violation", async () => {
  const dir = await makeProject([], [
    statusDoc({ path: ".agent-workplace/iterations/current/does-not-exist.md" }),
  ]);
  try {
    const errors = await checkDualDocumentConsistency(dir);
    assert.ok(errors.some((e) => e.includes("P2 source")), errors.join("\n"));
  } finally {
    await cleanup(dir);
  }
});

test("P3 — a docs/ file without an APPROVED record is a back-door violation", async () => {
  const dir = await makeProject(["docs/leaked.md"], []);
  try {
    const errors = await checkDualDocumentConsistency(dir);
    assert.ok(errors.some((e) => e.includes("P3 authorization")), errors.join("\n"));
  } finally {
    await cleanup(dir);
  }
});

test("P5 — APPROVED record missing provenance is a violation", async () => {
  const dir = await makeProject(["docs/architecture.md"], [
    statusDoc({
      path: "docs/architecture.md",
      type: "APPROVED",
      confidence: 0.95,
      // no source, no promoted_to, no approver
    }),
  ]);
  try {
    const errors = await checkDualDocumentConsistency(dir);
    assert.ok(errors.some((e) => e.includes("P5 provenance")), errors.join("\n"));
  } finally {
    await cleanup(dir);
  }
});

test("P1 — P3 back-door check honours an APPROVED record that matches promoted_to", async () => {
  const dir = await makeProject(
    ["docs/architecture.md", ".agent-workplace/iterations/current/design/tradeoffs/storage.md"],
    [
    statusDoc({
      path: ".agent-workplace/iterations/current/design/tradeoffs/storage.md",
      type: "REVIEW_NEEDED",
      confidence: 0.9,
      promoted_to: "docs/architecture.md",
    }),
    statusDoc({
      path: "docs/architecture.md",
      type: "APPROVED",
      confidence: 0.95,
      source: ".agent-workplace/iterations/current/design/tradeoffs/storage.md",
      promoted_to: "docs/architecture.md",
      approver: "user@example.com",
      approved_at: "2026-08-26T11:05:00Z",
    }),
  ]);
  try {
    await writeFile(join(dir, "docs", "architecture.md"), "# Architecture\n", "utf8");
    const errors = await checkDualDocumentConsistency(dir);
    assert.deepEqual(errors, [], "an APPROVED record matching promoted_to must satisfy P3");
  } finally {
    await cleanup(dir);
  }
});

test("P6 — an ADR promoted from iteration design/ is consistent", async () => {
  const dir = await makeProject(
    [".agent-workplace/iterations/current/design/tradeoffs/storage.md", ".agent-workplace/shared/adr/storage.md", "docs/adr/storage.md"],
    [
      statusDoc({
        path: ".agent-workplace/iterations/current/design/tradeoffs/storage.md",
        type: "REVIEW_NEEDED",
        confidence: 0.9,
        promoted_to: ".agent-workplace/shared/adr/storage.md",
      }),
      statusDoc({
        path: ".agent-workplace/shared/adr/storage.md",
        type: "REVIEW_NEEDED",
        confidence: 0.9,
        source: ".agent-workplace/iterations/current/design/tradeoffs/storage.md",
        promoted_to: "docs/adr/storage.md",
      }),
      statusDoc({
        path: "docs/adr/storage.md",
        type: "APPROVED",
        confidence: 0.95,
        source: ".agent-workplace/shared/adr/storage.md",
        promoted_to: "docs/adr/storage.md",
        approver: "user@example.com",
        approved_at: "2026-08-26T11:05:00Z",
      }),
    ],
  );
  try {
    await writeFile(join(dir, ".agent-workplace", "shared", "adr", "storage.md"), "# ADR-001\n", "utf8");
    await writeFile(join(dir, "docs", "adr", "storage.md"), "# ADR-001 (final)\n", "utf8");
    const errors = await checkDualDocumentConsistency(dir);
    assert.deepEqual(errors, [], "a managed ADR chain with design provenance must pass P6");
  } finally {
    await cleanup(dir);
  }
});

test("P6 — an ADR file with no document-status record is a violation", async () => {
  const dir = await makeProject([".agent-workplace/shared/adr/orphan.md"], []);
  try {
    const errors = await checkDualDocumentConsistency(dir);
    assert.ok(errors.some((e) => e.includes("P6 provenance") && e.includes("no document-status record")), errors.join("\n"));
  } finally {
    await cleanup(dir);
  }
});

test("P6 — an APPROVED ADR whose source is not from design/ is a violation", async () => {
  const dir = await makeProject(["docs/adr/bar.md"], [
    statusDoc({
      path: "docs/adr/bar.md",
      type: "APPROVED",
      confidence: 0.95,
      source: "README.md",
      promoted_to: "docs/adr/bar.md",
      approver: "user@example.com",
      approved_at: "2026-08-26T11:05:00Z",
    }),
  ]);
  try {
    const errors = await checkDualDocumentConsistency(dir);
    assert.ok(errors.some((e) => e.includes("P6 provenance") && e.includes("must come from an iteration design/")), errors.join("\n"));
  } finally {
    await cleanup(dir);
  }
});

// tests/verify/verify-engine.test.mjs
// T2 contract tests for the cross-platform verifier/lifecycle engine.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runChecks, parseFrontmatter, makeFinding, renderTable } from "../../scripts/verify.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES = join(here, "..", "fixtures");
const VALID = join(FIXTURES, "verify-valid");
const INVALID = join(FIXTURES, "verify-invalid");

const bySignal = (findings) => Object.fromEntries(findings.map((f) => [f.signal, f]));

test("parseFrontmatter requires --- delimiters and reads only the block", () => {
  const fm = parseFrontmatter("---\nname: foo\ndescription: Use when x.\n---\n\nbody mentions name: bar");
  assert.equal(fm.name, "foo");
  assert.equal(fm.description, "Use when x.");
  assert.equal(parseFrontmatter("no delimiters here"), null);
  assert.equal(parseFrontmatter("---\nname: foo\nno closing marker"), null);
});

test("makeFinding produces the stable finding shape", () => {
  const f = makeFinding("missing-entry-skill", "skills/using-demo/SKILL.md", "FAIL", "Create it.", "Impact.");
  assert.deepEqual(f, {
    signal: "missing-entry-skill",
    file: "skills/using-demo/SKILL.md",
    severity: "FAIL",
    action: "Create it.",
    impact: "Impact.",
  });
});

test("renderTable renders severity-ranked rows", () => {
  const table = renderTable([
    makeFinding("a", "f1", "WARN", "act", "imp"),
    makeFinding("b", "f2", "FAIL", "act", "imp"),
  ]);
  const lines = table.split("\n");
  assert.ok(lines[0].includes("SEVERITY"));
  assert.ok(lines[1].startsWith("FAIL\tb"));
  assert.ok(lines[2].startsWith("WARN\ta"));
});

test("valid fixture passes structure and harness layers", async () => {
  const { root, findings } = await runChecks(VALID, { layers: ["structure", "harness"] });
  assert.equal(root, VALID);
  assert.deepEqual(findings, [], JSON.stringify(findings));
});

test("valid fixture lifecycle layer has no FAIL findings", async () => {
  const { findings } = await runChecks(VALID, { layers: ["orchestration"] });
  const fails = findings.filter((f) => f.severity === "FAIL");
  assert.deepEqual(fails, [], JSON.stringify(findings));
});

test("invalid fixture returns FAIL findings with stable signals", async () => {
  const { findings } = await runChecks(INVALID, { layers: ["structure", "harness"] });
  const by = bySignal(findings);

  // missing frontmatter delimiters
  assert.equal(by["missing-frontmatter"]?.severity, "FAIL");
  assert.equal(by["missing-frontmatter"]?.file, "skills/bad-frontmatter/SKILL.md");
  // name mismatch
  assert.equal(by["name-mismatch"]?.severity, "FAIL");
  assert.equal(by["name-mismatch"]?.file, "skills/name-mismatch/SKILL.md");
  // missing hook pair
  assert.equal(by["missing-hook-pair"]?.severity, "FAIL");
  assert.equal(by["missing-hook-pair"]?.file, "hooks/orphan.sh");
  // manifest advertising an absent harness artifact (pi + omp extensions missing)
  assert.ok(
    findings.some((f) => f.signal === "missing-harness-artifact" && f.file.includes("pi.extensions")),
    "pi.extensions missing target must be reported",
  );
  assert.ok(
    findings.some((f) => f.signal === "missing-harness-artifact" && f.file.includes("omp.extensions")),
    "omp.extensions missing target must be reported",
  );
});

test("invalid fixture lifecycle layer reports broken handoff", async () => {
  const { findings } = await runChecks(INVALID, { layers: ["orchestration"] });
  const by = bySignal(findings);
  // using-invalid routes to ghost-skill which does not exist
  assert.ok(by["broken-handoff"], JSON.stringify(findings));
});

test("runChecks with default layers covers all three", async () => {
  const { findings } = await runChecks(VALID);
  const signals = new Set(findings.map((f) => f.signal));
  // no FAIL findings anywhere for the valid fixture
  assert.ok(findings.every((f) => f.severity !== "FAIL"), JSON.stringify(findings));
  assert.ok(signals.size >= 0);
});

/* --- contract layer probes: adr-status and spec-trace (P1-3) --- */

const CONTRACT_VALID = join(FIXTURES, "contract-valid");
const CONTRACT_INVALID = join(FIXTURES, "contract-invalid");

test("contract-valid fixture passes adr-status and spec-trace probes cleanly", async () => {
  const { findings } = await runChecks(CONTRACT_VALID, { layers: ["orchestration"] });
  const by = bySignal(findings);
  assert.ok(!by["adr-status"], JSON.stringify(findings));
  assert.ok(!by["spec-trace"], JSON.stringify(findings));
});

test("contract-invalid fixture reports adr-status and spec-trace findings", async () => {
  const { findings } = await runChecks(CONTRACT_INVALID, { layers: ["orchestration"] });
  const by = bySignal(findings);

  // duplicate ADR number -> WARN
  assert.ok(
    findings.some((f) => f.signal === "adr-status" && f.severity === "WARN"),
    JSON.stringify(findings),
  );
  // broken schema JSON -> WARN
  assert.ok(
    findings.some((f) => f.signal === "spec-trace" && f.severity === "WARN"),
    JSON.stringify(findings),
  );
  assert.ok(
    findings.some((f) => f.signal === "spec-trace" && f.file === "schemas/broken.schema.json"),
    "broken schema must be reported",
  );
  // missing verify-invalid fixture dir -> WARN
  assert.ok(
    findings.some((f) => f.signal === "spec-trace" && f.file.includes("verify-invalid")),
    "missing negative contract fixture must be reported",
  );
  // superseded ADR without a link -> WARN
  assert.ok(
    findings.some((f) => f.signal === "adr-status" && f.file === "docs/ADR-0003-third.md"),
    "superseded ADR without link must be reported",
  );
  // ADR without a status field -> WARN
  assert.ok(
    findings.some((f) => f.signal === "adr-status" && f.file === "docs/ADR-0004-fourth.md"),
    "ADR without status field must be reported",
  );
});

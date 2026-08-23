import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..");

const PRD_SCHEMA = join(root, "tools", "shared", "schemas", "prd.schema.json");
const MANIFEST_SCHEMA = join(root, "tools", "shared", "schemas", "component-manifest.schema.json");
const VALID_PRD = join(root, "tests", "fixtures", "contract-valid", "prd.json");
const VALID_MANIFEST = join(root, "tests", "fixtures", "contract-valid", "component-manifest.json");
const INVALID_PRD = join(root, "tests", "fixtures", "contract-invalid", "prd.json");

// Import the validator (use file:// URL for Windows compatibility)
const validatorUrl = pathToFileURL(join(root, "tools", "verify", "validate-schema.mjs")).href;
const { validate, validateSchema } = await import(validatorUrl);

describe("validate()", () => {
  it("accepts a valid object with required fields", () => {
    const schema = {
      type: "object",
      required: ["name"],
      properties: { name: { type: "string" } },
    };
    assert.deepEqual(validate({ name: "test" }, schema), []);
  });

  it("rejects missing required field", () => {
    const schema = {
      type: "object",
      required: ["name"],
      properties: { name: { type: "string" } },
    };
    const errors = validate({}, schema);
    assert.ok(errors.length > 0);
    assert.ok(errors[0].includes("missing required field"));
  });

  it("rejects wrong type", () => {
    const schema = { type: "string" };
    const errors = validate(42, schema);
    assert.ok(errors.length > 0);
    assert.ok(errors[0].includes("expected string"));
  });

  it("validates pattern", () => {
    const schema = { type: "string", pattern: "^[a-z]+$" };
    assert.deepEqual(validate("abc", schema), []);
    assert.ok(validate("ABC!", schema).length > 0);
  });

  it("validates enum", () => {
    const schema = { type: "string", enum: ["a", "b", "c"] };
    assert.deepEqual(validate("a", schema), []);
    assert.ok(validate("d", schema).length > 0);
  });

  it("validates minimum", () => {
    const schema = { type: "integer", minimum: 0 };
    assert.deepEqual(validate(0, schema), []);
    assert.ok(validate(-1, schema).length > 0);
  });

  it("validates integer type rejects non-integer numbers", () => {
    const schema = { type: "integer" };
    assert.deepEqual(validate(42, schema), []);
    assert.ok(validate(3.14, schema).length > 0);
  });

  it("validates minItems", () => {
    const schema = { type: "array", minItems: 1, items: { type: "string" } };
    assert.deepEqual(validate(["a"], schema), []);
    assert.ok(validate([], schema).length > 0);
  });

  it("validates array items", () => {
    const schema = { type: "array", items: { type: "string" } };
    assert.deepEqual(validate(["a", "b"], schema), []);
    assert.ok(validate(["a", 42], schema).length > 0);
  });

  it("validates date format", () => {
    const schema = { type: "string", format: "date" };
    assert.deepEqual(validate("2026-08-09", schema), []);
    assert.ok(validate("not-a-date", schema).length > 0);
  });

  it("rejects additional properties when disallowed", () => {
    const schema = {
      type: "object",
      properties: { name: { type: "string" } },
      additionalProperties: false,
    };
    assert.deepEqual(validate({ name: "ok" }, schema), []);
    assert.ok(validate({ name: "ok", extra: "bad" }, schema).length > 0);
  });
});

describe("validateSchema()", () => {
  it("accepts valid PRD against prd.schema.json", () => {
    const result = validateSchema(PRD_SCHEMA, VALID_PRD);
    assert.ok(result.valid, `Expected valid, got errors: ${result.errors.join(", ")}`);
    assert.equal(result.errors.length, 0);
  });

  it("accepts valid manifest against component-manifest.schema.json", () => {
    const result = validateSchema(MANIFEST_SCHEMA, VALID_MANIFEST);
    assert.ok(result.valid, `Expected valid, got errors: ${result.errors.join(", ")}`);
    assert.equal(result.errors.length, 0);
  });

  it("rejects invalid PRD with multiple errors", () => {
    const result = validateSchema(PRD_SCHEMA, INVALID_PRD);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length >= 5, `Expected ≥5 errors, got ${result.errors.length}`);
  });

  it("reports specific missing required fields", () => {
    const result = validateSchema(PRD_SCHEMA, INVALID_PRD);
    assert.ok(result.errors.some((e) => e.includes('"background"')));
    assert.ok(result.errors.some((e) => e.includes('"features"')));
    assert.ok(result.errors.some((e) => e.includes('"signoff"')));
  });

  it("reports pattern violations", () => {
    const result = validateSchema(PRD_SCHEMA, INVALID_PRD);
    assert.ok(result.errors.some((e) => e.includes("pattern")));
  });
});

#!/usr/bin/env node
/**
 * validate-schemas.mjs — zero-dependency JSON Schema draft-07 validator for flowstate.
 *
 * Validates each schema in schemas/ against its test fixtures:
 *   - tests/fixtures/verify-valid/<name>.valid.json   → must pass
 *   - tests/fixtures/verify-invalid/<name>.invalid.json → must fail
 *
 * Usage:  node --test tests/validate-schemas.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const SCHEMAS_DIR = join(ROOT, "schemas");
const VALID_DIR = join(__dirname, "fixtures", "verify-valid");
const INVALID_DIR = join(__dirname, "fixtures", "verify-invalid");

/* ------------------------------------------------------------------ */
/* Lightweight JSON Schema draft-07 validator                          */
/* ------------------------------------------------------------------ */

/**
 * Validate data against a JSON Schema (draft-07 subset).
 * Returns an array of error strings (empty = valid).
 */
function validate(schema, data, path = "") {
  const errors = [];

  if (schema === true) return errors;
  if (schema === false) { errors.push(`${path || "/"}: rejected by false schema`); return errors; }

  // type check
  if (schema.type) {
    const actual = jsonType(data);
    const expected = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!expected.includes(actual)) {
      errors.push(`${path || "/"}: expected type ${expected.join("|")}, got ${actual}`);
      return errors; // no point checking further
    }
  }

  // enum
  if (schema.enum && !schema.enum.includes(data)) {
    errors.push(`${path || "/"}: value ${JSON.stringify(data)} not in enum [${schema.enum.map(v => JSON.stringify(v)).join(", ")}]`);
  }

  // object checks
  if (schema.type === "object" || (typeof data === "object" && data !== null && !Array.isArray(data))) {
    // required
    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in data)) {
          errors.push(`${path}/${key}: missing required property`);
        }
      }
    }
    // properties
    const props = schema.properties || {};
    for (const [key, val] of Object.entries(data)) {
      if (key in props) {
        errors.push(...validate(props[key], val, `${path}/${key}`));
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}/${key}: additional property not allowed`);
      }
    }
  }

  // array checks
  if (schema.type === "array" && Array.isArray(data)) {
    if (schema.items) {
      for (let i = 0; i < data.length; i++) {
        errors.push(...validate(schema.items, data[i], `${path}/${i}`));
      }
    }
  }

  return errors;
}

function jsonType(val) {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  if (typeof val === "number" && Number.isInteger(val)) return "integer";
  return typeof val; // string, number, boolean, object
}

/* ------------------------------------------------------------------ */
/* Test suite                                                          */
/* ------------------------------------------------------------------ */

async function loadJson(p) {
  return JSON.parse(await readFile(p, "utf8"));
}

async function discoverSchemas() {
  const files = (await readdir(SCHEMAS_DIR)).filter(f => f.endsWith(".schema.json"));
  return files.map(f => ({
    name: f.replace(".schema.json", ""),
    schemaPath: join(SCHEMAS_DIR, f),
  }));
}

const schemas = await discoverSchemas();

describe("flowstate schema validation", () => {
  for (const { name, schemaPath } of schemas) {
    describe(`${name}.schema.json`, () => {
      it("valid fixtures should pass", async () => {
        const schema = await loadJson(schemaPath);
        const validPath = join(VALID_DIR, `${name}.valid.json`);
        let data;
        try {
          data = await loadJson(validPath);
        } catch (err) {
          if (err.code === "ENOENT") {
            // No valid fixture — skip
            return;
          }
          throw err;
        }
        const errors = validate(schema, data);
        assert.deepEqual(errors, [], `Expected valid fixture to pass, but got errors:\n${errors.join("\n")}`);
      });

      it("invalid fixtures should be rejected", async () => {
        const schema = await loadJson(schemaPath);
        const invalidPath = join(INVALID_DIR, `${name}.invalid.json`);
        let data;
        try {
          data = await loadJson(invalidPath);
        } catch (err) {
          if (err.code === "ENOENT") {
            // No invalid fixture — skip
            return;
          }
          throw err;
        }
        const errors = validate(schema, data);
        assert.ok(errors.length > 0, "Expected invalid fixture to be rejected, but it passed validation");
      });
    });
  }
});

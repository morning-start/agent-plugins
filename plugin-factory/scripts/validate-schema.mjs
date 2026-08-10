#!/usr/bin/env node
/**
 * validate-schema.mjs — zero-dependency JSON Schema validator.
 *
 * Validates a JSON file against a JSON Schema (draft 2020-12 subset).
 * Supports: type, required, properties, pattern, enum, minimum, minItems,
 * items, format (date only), additionalProperties.
 *
 * CLI:
 *   node scripts/validate-schema.mjs --schema schemas/prd.schema.json --input .pf/prd.json
 *   node scripts/validate-schema.mjs --schema schemas/component-manifest.schema.json --input manifest.json
 *
 * Exit code: 0 pass, 1 validation errors, 2 usage/file error.
 *
 * Exported: validateSchema(schemaPath, inputPath) → { valid, errors }
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// ── Minimal JSON Schema validator (no external deps) ────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a value against a JSON Schema node.
 * @param {*} value
 * @param {object} schema
 * @param {string} path - dotted path for error messages
 * @returns {string[]} error messages (empty = valid)
 */
export function validate(value, schema, path = "") {
  const errors = [];
  const p = path || "(root)";

  // type check
  if (schema.type) {
    const actual = jsonType(value);
    if (schema.type === "integer") {
      if (actual !== "number" || !Number.isInteger(value)) {
        errors.push(`${p}: expected integer, got ${actual}`);
        return errors; // no point checking further
      }
    } else if (actual !== schema.type) {
      errors.push(`${p}: expected ${schema.type}, got ${actual}`);
      return errors;
    }
  }

  // enum
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${p}: value "${value}" not in enum [${schema.enum.join(", ")}]`);
  }

  // pattern (strings only)
  if (schema.pattern && typeof value === "string") {
    if (!new RegExp(schema.pattern).test(value)) {
      errors.push(`${p}: "${value}" does not match pattern ${schema.pattern}`);
    }
  }

  // minimum (numbers only)
  if (schema.minimum !== undefined && typeof value === "number") {
    if (value < schema.minimum) {
      errors.push(`${p}: ${value} < minimum ${schema.minimum}`);
    }
  }

  // format: date
  if (schema.format === "date" && typeof value === "string") {
    if (!DATE_RE.test(value)) {
      errors.push(`${p}: "${value}" is not a valid date (YYYY-MM-DD)`);
    }
  }

  // object: required + properties + additionalProperties
  if (schema.type === "object" && typeof value === "object" && value !== null) {
    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in value)) {
          errors.push(`${p}: missing required field "${key}"`);
        }
      }
    }
    if (schema.properties) {
      for (const [key, sub] of Object.entries(schema.properties)) {
        if (key in value) {
          errors.push(...validate(value[key], sub, `${p}.${key}`));
        }
      }
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(value)) {
        if (!(key in schema.properties)) {
          errors.push(`${p}: unexpected field "${key}"`);
        }
      }
    }
  }

  // array: minItems + items
  if (schema.type === "array" && Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${p}: array length ${value} < minItems ${schema.minItems}`);
    }
    if (schema.items) {
      for (let i = 0; i < value.length; i++) {
        errors.push(...validate(value[i], schema.items, `${p}[${i}]`));
      }
    }
  }

  return errors;
}

function jsonType(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Validate a JSON file against a JSON Schema file.
 * @param {string} schemaPath - path to .schema.json
 * @param {string} inputPath - path to the JSON file to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateSchema(schemaPath, inputPath) {
  const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
  const input = JSON.parse(readFileSync(inputPath, "utf8"));
  const errors = validate(input, schema);
  return { valid: errors.length === 0, errors };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

function usage() {
  console.log("Usage: node scripts/validate-schema.mjs --schema <path> --input <path>");
}

function main() {
  const argv = process.argv.slice(2);
  let schemaPath, inputPath;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--schema") schemaPath = argv[++i];
    else if (argv[i] === "--input") inputPath = argv[++i];
    else if (argv[i] === "--help" || argv[i] === "-h") { usage(); process.exit(0); }
  }
  if (!schemaPath || !inputPath) {
    usage();
    process.exit(2);
  }

  let result;
  try {
    result = validateSchema(schemaPath, inputPath);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }

  if (result.valid) {
    console.log("PASS — input is valid");
    process.exit(0);
  } else {
    for (const e of result.errors) console.error(`FAIL: ${e}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

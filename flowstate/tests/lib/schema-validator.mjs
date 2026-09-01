/**
 * schema-validator.mjs — zero-dependency JSON Schema draft-07 validator.
 *
 * Shared single source for schema validation across flowstate tests so the
 * validation logic lives in exactly one place (no copy-paste drift between
 * tests/validate-schemas.mjs and tests/dual-document-consistency.test.mjs).
 *
 * Usage:  import { validate } from "./lib/schema-validator.mjs";
 */

/**
 * Validate data against a JSON Schema (draft-07 subset).
 * Returns an array of error strings (empty = valid).
 */
export function validate(schema, data, path = "") {
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

export function jsonType(val) {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  if (typeof val === "number" && Number.isInteger(val)) return "integer";
  return typeof val; // string, number, boolean, object
}

#!/usr/bin/env node
/* Validate a moonbit-verify JSON artifact against its repository contract. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCHEMA_PATH = path.join(ROOT, "schemas", "moonbit-verification.schema.json");
const REQUIRED = ["schema_version", "status", "project_type", "targets", "checks", "started_at", "finished_at"];
const STATUSES = new Set(["pass", "blocked", "skipped"]);
const PROJECT_TYPES = new Set(["lib", "cli", "ffi", "wasm", "parser", "async"]);
const CHECK_KEY = /^[A-Z][0-9]+$/;

/** Compute {line, col} (1-based) for a character offset in text. */
function lineColAt(text, offset) {
  const before = text.slice(0, offset);
  const lines = before.split("\n");
  return { lineno: lines.length, colno: lines[lines.length - 1].length + 1 };
}

/**
 * Load a JSON file.
 * @returns {[data|null, error|null]}
 */
function loadJson(filePath) {
  try {
    return [JSON.parse(fs.readFileSync(filePath, "utf-8")), null];
  } catch (err) {
    if (err.code === "ENOENT") {
      return [null, `File not found: ${filePath}`];
    }
    if (err instanceof SyntaxError) {
      const m = /position (\d+)/.exec(err.message);
      if (m) {
        const pos = Number(m[1]);
        const { lineno, colno } = lineColAt(fs.readFileSync(filePath, "utf-8"), pos);
        return [null, `Invalid JSON at ${filePath}:${lineno}:${colno}: ${err.message}`];
      }
      return [null, `Invalid JSON at ${filePath}: ${err.message}`];
    }
    return [null, `Invalid JSON at ${filePath}: ${err.message}`];
  }
}

/**
 * Validate an artifact object against a schema.
 * @returns {string[]} list of errors (empty when valid)
 */
function validateArtifact(data, schema) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return ["Root must be a JSON object"];
  }

  const errors = [];
  const required = new Set(schema?.required ?? REQUIRED);
  for (const name of [...required].sort()) {
    if (!(name in data)) errors.push(`Missing required field: ${name}`);
  }

  const allowed = new Set(Object.keys(schema?.properties ?? {}));
  for (const name of Object.keys(data).sort()) {
    if (!allowed.has(name)) errors.push(`Unknown field: ${name}`);
  }
  if (errors.length) return errors;

  if (!Number.isInteger(data.schema_version) || data.schema_version < 1) {
    errors.push("schema_version must be an integer >= 1");
  }
  if (!STATUSES.has(data.status)) {
    errors.push(`status must be one of ${[...STATUSES].sort().join(", ")}`);
  }
  if (!PROJECT_TYPES.has(data.project_type)) {
    errors.push(`project_type must be one of ${[...PROJECT_TYPES].sort().join(", ")}`);
  }
  if (
    !Array.isArray(data.targets) ||
    data.targets.length === 0 ||
    data.targets.some((t) => typeof t !== "string")
  ) {
    errors.push("targets must be a non-empty array of strings");
  }
  if (typeof data.checks !== "object" || data.checks === null || Array.isArray(data.checks) || Object.keys(data.checks).length === 0) {
    errors.push("checks must be a non-empty object");
  }

  if (typeof data.checks === "object" && data.checks !== null && !Array.isArray(data.checks)) {
    for (const key of Object.keys(data.checks)) {
      const result = data.checks[key];
      if (!CHECK_KEY.test(key)) {
        errors.push(`Invalid check key: ${key}`);
      }
      if (typeof result !== "object" || result === null || Array.isArray(result)) {
        errors.push(`checks.${key} must be an object`);
        continue;
      }
      for (const field of ["status", "command", "exit_code"]) {
        if (!(field in result)) errors.push(`checks.${key} missing field: ${field}`);
      }
      if (typeof result.command !== "string" || result.command.trim() === "") {
        errors.push(`checks.${key}.command must be non-empty`);
      }
      const exitCode = result.exit_code;
      if (exitCode !== null && exitCode !== undefined && (!Number.isInteger(exitCode) || typeof exitCode === "boolean")) {
        errors.push(`checks.${key}.exit_code must be an integer or null`);
      }
      const status = result.status;
      if (!STATUSES.has(status)) {
        errors.push(`checks.${key}.status must be one of ${[...STATUSES].sort().join(", ")}`);
      }
      if (status === "skipped" && !result.reason) {
        errors.push(`checks.${key} skipped result requires reason`);
      }
      if (status === "blocked" && (!result.reason || !result.details)) {
        errors.push(`checks.${key} blocked result requires reason and details`);
      }
    }
  }

  for (const field of ["started_at", "finished_at"]) {
    if (typeof data[field] !== "string" || !data[field].includes("T")) {
      errors.push(`${field} must be an ISO 8601 date-time string`);
    }
  }

  return errors;
}

function usage() {
  console.error("usage: validate-verification.mjs --file <path>");
}

function main() {
  const args = process.argv.slice(2);
  let fileArg = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--file" || a === "-f") {
      fileArg = args[++i];
    } else if (a.startsWith("--file=")) {
      fileArg = a.slice("--file=".length);
    } else {
      usage();
      return 2;
    }
  }
  if (!fileArg) {
    usage();
    return 2;
  }

  const [schema, schemaError] = loadJson(SCHEMA_PATH);
  if (schemaError || typeof schema !== "object" || schema === null || Array.isArray(schema)) {
    console.error(`ERROR: ${schemaError || "verification schema must be an object"}`);
    return 1;
  }

  const [data, dataError] = loadJson(fileArg);
  if (dataError) {
    console.error(`ERROR: ${dataError}`);
    return 1;
  }

  const errors = validateArtifact(data, schema);
  if (errors.length) {
    console.error("Validation FAILED:");
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    return 1;
  }

  console.log(`Validation PASS: ${fileArg}`);
  return 0;
}

process.exitCode = main();

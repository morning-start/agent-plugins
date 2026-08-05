#!/usr/bin/env python3
"""Validate a moonbit-verify JSON artifact against its repository contract."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schemas" / "moonbit-verification.schema.json"
REQUIRED = {"schema_version", "status", "project_type", "targets", "checks", "started_at", "finished_at"}
STATUSES = {"pass", "blocked", "skipped"}
PROJECT_TYPES = {"lib", "cli", "ffi", "wasm", "parser", "async"}
CHECK_KEY = re.compile(r"^[A-Z][0-9]+$")


def load_json(path: Path) -> tuple[object | None, str | None]:
    try:
        return json.loads(path.read_text(encoding="utf-8")), None
    except FileNotFoundError:
        return None, f"File not found: {path}"
    except json.JSONDecodeError as exc:
        return None, f"Invalid JSON at {path}:{exc.lineno}:{exc.colno}: {exc.msg}"


def validate_artifact(data: object, schema: dict) -> list[str]:
    if not isinstance(data, dict):
        return ["Root must be a JSON object"]

    errors: list[str] = []
    required = set(schema.get("required", REQUIRED))
    errors.extend(f"Missing required field: {name}" for name in sorted(required - set(data)))

    allowed = set(schema.get("properties", {}))
    errors.extend(f"Unknown field: {name}" for name in sorted(set(data) - allowed))
    if errors:
        return errors

    if not isinstance(data["schema_version"], int) or data["schema_version"] < 1:
        errors.append("schema_version must be an integer >= 1")
    if data["status"] not in STATUSES:
        errors.append(f"status must be one of {sorted(STATUSES)}")
    if data["project_type"] not in PROJECT_TYPES:
        errors.append(f"project_type must be one of {sorted(PROJECT_TYPES)}")
    if not isinstance(data["targets"], list) or not data["targets"] or any(not isinstance(target, str) for target in data["targets"]):
        errors.append("targets must be a non-empty array of strings")
    if not isinstance(data["checks"], dict) or not data["checks"]:
        errors.append("checks must be a non-empty object")

    for key, result in data["checks"].items() if isinstance(data["checks"], dict) else []:
        if not CHECK_KEY.fullmatch(key):
            errors.append(f"Invalid check key: {key}")
        if not isinstance(result, dict):
            errors.append(f"checks.{key} must be an object")
            continue
        for field in ("status", "command", "exit_code"):
            if field not in result:
                errors.append(f"checks.{key} missing field: {field}")
        if not isinstance(result.get("command"), str) or not result["command"].strip():
            errors.append(f"checks.{key}.command must be non-empty")
        exit_code = result.get("exit_code")
        if exit_code is not None and (not isinstance(exit_code, int) or isinstance(exit_code, bool)):
            errors.append(f"checks.{key}.exit_code must be an integer or null")
        status = result.get("status")
        if status not in STATUSES:
            errors.append(f"checks.{key}.status must be one of {sorted(STATUSES)}")
        if status == "skipped" and not result.get("reason"):
            errors.append(f"checks.{key} skipped result requires reason")
        if status == "blocked" and (not result.get("reason") or not result.get("details")):
            errors.append(f"checks.{key} blocked result requires reason and details")

    for field in ("started_at", "finished_at"):
        if not isinstance(data[field], str) or "T" not in data[field]:
            errors.append(f"{field} must be an ISO 8601 date-time string")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate a moonbit-verify JSON artifact")
    parser.add_argument("--file", "-f", required=True, help="Verification artifact JSON path")
    args = parser.parse_args()

    schema, schema_error = load_json(SCHEMA_PATH)
    if schema_error or not isinstance(schema, dict):
        print(f"ERROR: {schema_error or 'verification schema must be an object'}", file=sys.stderr)
        return 1

    data, data_error = load_json(Path(args.file))
    if data_error:
        print(f"ERROR: {data_error}", file=sys.stderr)
        return 1

    errors = validate_artifact(data, schema)
    if errors:
        print("Validation FAILED:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(f"Validation PASS: {args.file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

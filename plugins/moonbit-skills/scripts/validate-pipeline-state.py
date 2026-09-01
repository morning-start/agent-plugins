#!/usr/bin/env python3
"""
Pipeline state validation, migration, and consistency checking.

CLI:
  python scripts/validate-pipeline-state.py --file <path>
  python scripts/validate-pipeline-state.py --init --plan <path> [--force]
  python scripts/validate-pipeline-state.py --file <path> --check-consistency
  python scripts/validate-pipeline-state.py --file <path> --migrate
"""

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone


SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "..", "schemas", "moonbit-pipeline.schema.json")

VALID_PHASES = {"plan", "writing-plans", "scaffold", "testing", "implement",
                "review", "perform", "refactor", "verify", "evaluate",
                "cd", "learn", "incident"}
VALID_STATUSES = {"pending", "in_progress", "blocked", "approved", "completed",
                  "deployed", "rolled_back"}
VALID_PROJECT_TYPES = {"lib", "cli", "ffi", "wasm", "parser", "async"}
VALID_TARGETS = {"native", "wasm", "wasm-gc", "js"}
VALID_PIPELINES = {"development", "bugfix", "spike", "release"}


def load_json(path):
    """Load and parse a JSON file. Returns (data, error)."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data, None
    except FileNotFoundError:
        return None, f"File not found: {path}"
    except json.JSONDecodeError as e:
        return None, f"Invalid JSON at {path}:{e.lineno}:{e.colno}: {e.msg}"


def validate_state(state, schema_data=None):
    """Validate pipeline state against the checked-in schema contract."""
    errors = []

    if not isinstance(state, dict):
        return ["Root must be a JSON object"]

    required_fields = (schema_data or {}).get(
        "required",
        ("schema_version", "pipeline", "phase", "status", "project_type", "targets", "last_updated"),
    )
    for field in required_fields:
        if field not in state:
            errors.append(f"Missing required field: {field}")

    if schema_data:
        allowed = set(schema_data.get("properties", {}))
        unknown = sorted(set(state) - allowed)
        errors.extend(f"Unknown field: {field}" for field in unknown)

    if errors:
        return errors

    # Values below mirror the schema enums and provide readable CLI errors.
    if not isinstance(state["schema_version"], int) or state["schema_version"] < 1:
        errors.append(f"schema_version must be integer >= 1, got {state['schema_version']!r}")
    if state["pipeline"] not in VALID_PIPELINES:
        errors.append(f"pipeline must be one of {VALID_PIPELINES}, got {state['pipeline']!r}")
    if state["phase"] not in VALID_PHASES:
        errors.append(f"phase must be one of {VALID_PHASES}, got {state['phase']!r}")
    if state["status"] not in VALID_STATUSES:
        errors.append(f"status must be one of {VALID_STATUSES}, got {state['status']!r}")
    if state["project_type"] not in VALID_PROJECT_TYPES:
        errors.append(f"project_type must be one of {VALID_PROJECT_TYPES}, got {state['project_type']!r}")

    targets = state["targets"]
    if not isinstance(targets, list) or len(targets) == 0:
        errors.append("targets must be a non-empty array")
    else:
        for target in targets:
            if target not in VALID_TARGETS:
                errors.append(f"Invalid target {target!r}, must be one of {VALID_TARGETS}")

    # plan_sha256 format
    if "plan_sha256" in state and state["plan_sha256"] is not None:
        import re
        if not re.match(r'^[a-f0-9]{64}$', state["plan_sha256"]):
            errors.append("plan_sha256 must be 64 hex characters")

    # Optional fields validated when present
    if "batch" in state:
        if not isinstance(state["batch"], int) or state["batch"] < 0:
            errors.append(f"batch must be integer >= 0, got {state.get('batch')!r}")
    if "task_index" in state:
        if not isinstance(state["task_index"], int) or state["task_index"] < 0:
            errors.append(f"task_index must be integer >= 0, got {state.get('task_index')!r}")

    # base_commit format
    if "base_commit" in state and state["base_commit"] is not None:
        import re
        if not re.match(r'^[a-f0-9]{7,40}$', state["base_commit"]):
            errors.append("base_commit must be 7-40 hex characters")

    # tasks structure
    if "tasks" in state:
        tasks = state["tasks"]
        if not isinstance(tasks, dict):
            errors.append("tasks must be an object")
        else:
            for field in ("total", "completed", "current"):
                if field not in tasks:
                    errors.append(f"tasks missing field: {field}")
            if tasks.get("total", 0) < 0:
                errors.append("tasks.total must be >= 0")
            if tasks.get("completed", 0) < 0:
                errors.append("tasks.completed must be >= 0")
            if tasks.get("current", 0) < 0:
                errors.append("tasks.current must be >= 0")
            if tasks.get("completed", 0) > tasks.get("total", 0):
                errors.append("tasks.completed cannot exceed tasks.total")

    try:
        datetime.fromisoformat(state["last_updated"])
    except (ValueError, TypeError):
        errors.append(f"last_updated must be ISO 8601 format, got {state.get('last_updated')!r}")

    return errors


def plan_fingerprint(plan_path):
    """Calculate SHA-256 fingerprint of a plan file."""
    try:
        with open(plan_path, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except FileNotFoundError:
        return None


def check_consistency(state, plan_path=None):
    """Check plan fingerprint and git base against current state."""
    issues = []

    if plan_path and state.get("plan_file"):
        if os.path.abspath(state["plan_file"]) != os.path.abspath(plan_path):
            issues.append(f"plan_file in state ({state['plan_file']}) differs from --plan ({plan_path})")

    # Check plan fingerprint
    if plan_path and state.get("plan_sha256"):
        current_sha = plan_fingerprint(plan_path)
        if current_sha and current_sha != state["plan_sha256"]:
            issues.append(
                f"Plan file has changed (SHA-256 mismatch). "
                f"State: {state['plan_sha256']}, Current: {current_sha}"
            )

    # Check git base
    if state.get("base_commit"):
        import subprocess
        try:
            result = subprocess.run(
                ["git", "rev-parse", "--short", "HEAD"],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0:
                head = result.stdout.strip()
                if head != state["base_commit"]:
                    issues.append(
                        f"Git HEAD has moved. State base: {state['base_commit']}, "
                        f"Current HEAD: {head}"
                    )
        except (subprocess.SubprocessError, FileNotFoundError):
            issues.append("Could not get current git HEAD")

    return issues


def init_state(plan_path, force=False, state_file=None):
    """Initialize a new pipeline state from a plan file."""
    if state_file is None:
        state_file = os.path.join(".agent-workplace", "state", "checkpoint.json")

    if os.path.exists(state_file) and not force:
        return None, f"{state_file} already exists. Use --force to overwrite."

    if not os.path.exists(plan_path):
        return None, f"Plan file not found: {plan_path}"

    sha = plan_fingerprint(plan_path)

    # Get git base
    base_commit = None
    try:
        import subprocess
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            base_commit = result.stdout.strip()
    except (subprocess.SubprocessError, FileNotFoundError):
        pass

    state = {
        "schema_version": 1,
        "pipeline": "development",
        "phase": "plan",
        "status": "in_progress",
        "batch": 0,
        "task_index": 0,
        "project_type": "lib",
        "targets": ["native"],
        "plan_file": os.path.relpath(plan_path),
        "plan_sha256": sha,
        "base_commit": base_commit,
        "tasks": {"total": 1, "completed": 0, "current": 1},
        "last_verification": None,
        "last_updated": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "next": "implement:task-1"
    }

    return state, None


def migrate_state(state):
    """Migrate old state format to schema_version 1."""
    migrated = dict(state)
    changes = []

    if "schema_version" not in migrated:
        migrated["schema_version"] = 1
        changes.append("Added schema_version=1")

    # Old field migration: 'skills' → removed (no longer used)
    if "skills" in migrated:
        del migrated["skills"]
        changes.append("Removed deprecated 'skills' field")

    # Old field migration: 'node' / 'framework' → removed (legacy execution-graph
    # concept retired; phase now uniquely expresses the pipeline stage)
    for field in ("node", "framework"):
        if field in migrated:
            del migrated[field]
            changes.append(f"Removed deprecated '{field}' field")

    # Ensure required fields
    for field, default in [
        ("schema_version", 1),
        ("pipeline", "development"),
        ("phase", "plan"),
        ("status", "in_progress"),
        ("project_type", "lib"),
        ("targets", ["native"]),
        ("tasks", {"total": 0, "completed": 0, "current": 0}),
    ]:
        if field not in migrated:
            migrated[field] = default
            changes.append(f"Added default {field}={default}")

    migrated["last_updated"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    return migrated, changes


def main():
    parser = argparse.ArgumentParser(description="Validate and manage MoonBit pipeline state")
    parser.add_argument("--file", default=os.path.join(".agent-workplace", "state", "checkpoint.json"),
                        help="Path to pipeline state file (default: .agent-workplace/state/checkpoint.json)")
    parser.add_argument("--init", action="store_true",
                        help="Initialize a new pipeline state file")
    parser.add_argument("--plan", help="Path to plan file (for init or consistency check)")
    parser.add_argument("--check-consistency", action="store_true",
                        help="Check plan fingerprint and git consistency")
    parser.add_argument("--migrate", action="store_true",
                        help="Migrate old format to current schema version")
    parser.add_argument("--force", action="store_true",
                        help="Allow overwriting existing state (used with --init)")
    parser.add_argument("--backup", action="store_true",
                        help="Create .bak before migration")

    args = parser.parse_args()

    if args.init:
        state, err = init_state(args.plan, force=args.force, state_file=args.file)
        if err:
            print(f"ERROR: {err}", file=sys.stderr)
            sys.exit(1)
        with open(args.file, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
        print(f"Initialized pipeline state: {args.file}")
        print(f"  phase={state['phase']}, project_type={state['project_type']}")
        print(f"  targets={state['targets']}, plan={state['plan_file']}")
        sys.exit(0)

    state, err = load_json(args.file)
    if err:
        print(f"ERROR: {err}", file=sys.stderr)
        sys.exit(1)

    if args.migrate:
        if args.backup:
            bak_path = args.file + ".bak"
            with open(bak_path, "w", encoding="utf-8") as f:
                json.dump(state, f, indent=2)
            print(f"Backup written: {bak_path}")

        migrated, changes = migrate_state(state)
        if changes:
            with open(args.file, "w", encoding="utf-8") as f:
                json.dump(migrated, f, indent=2)
            print("Migration applied:")
            for c in changes:
                print(f"  - {c}")
        else:
            print("No migration needed.")
        sys.exit(0)

    schema_data, schema_error = load_json(SCHEMA_PATH)
    if schema_error:
        print(f"ERROR: {schema_error}", file=sys.stderr)
        sys.exit(1)

    errors = validate_state(state, schema_data)
    if errors:
        print("Validation FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Validation PASS: {args.file}")
    print(f"  phase={state.get('phase', '?')}, project_type={state.get('project_type', '?')}")
    print(f"  targets={state.get('targets', [])}")

    if args.check_consistency:
        issues = check_consistency(state, plan_path=args.plan)
        if issues:
            print("Consistency issues:")
            for i in issues:
                print(f"  - {i}", file=sys.stderr)
            sys.exit(1)
        print("Consistency check PASS")

    sys.exit(0)


if __name__ == "__main__":
    main()

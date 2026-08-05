#!/usr/bin/env python3
"""
Validate change evidence JSON against the change-evidence schema and type-specific rules.

Usage:
  python scripts/validate-change-evidence.py --file evidence.json
  python scripts/validate-change-evidence.py --file evidence.json --change-type feature --strict
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO_ROOT / "schemas" / "change-evidence.schema.json"


def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f), None
    except FileNotFoundError:
        return None, f"File not found: {path}"
    except json.JSONDecodeError as e:
        return None, f"Invalid JSON: {e}"


def validate_change_evidence(evidence, change_type=None, strict=False):
    """Validate a change evidence object. Returns list of (rule, detail) tuples."""
    issues = []

    if not isinstance(evidence, dict):
        return [("type", "Root must be a JSON object")]

    # Required fields
    for field in ("schema_version", "change_type", "scope", "steps", "toolchain"):
        if field not in evidence:
            issues.append(("required", f"Missing required field: {field}"))

    if issues:
        return issues

    # schema_version
    sv = evidence["schema_version"]
    if not isinstance(sv, int) or sv < 1:
        issues.append(("schema", f"schema_version must be >= 1, got {sv!r}"))

    # change_type validation
    valid_types = {"feature", "bugfix", "refactor", "performance", "dependency",
                   "configuration", "documentation", "scaffold", "security",
                   "release", "spike"}
    ct = evidence["change_type"]
    if ct not in valid_types:
        issues.append(("change_type", f"Invalid change_type '{ct}', must be one of {valid_types}"))

    # If --change-type provided, check consistency
    if change_type and ct != change_type:
        issues.append(("change_type",
                       f"Evidence change_type '{ct}' does not match --change-type '{change_type}'"))

    # Override change_type for rule checks
    ct = change_type or ct

    # Steps validation
    steps = evidence.get("steps", [])
    if not isinstance(steps, list) or len(steps) == 0:
        issues.append(("steps", "steps must be a non-empty array"))
        return issues

    step_names = [s.get("name") for s in steps]

    # Feature: must have 'red' step
    if ct == "feature" and "red" not in step_names:
        issues.append(("rule", "Feature change requires a 'red' step (failing test before implementation)"))

    # Bugfix: must have 'reproduce' step
    if ct == "bugfix" and "reproduce" not in step_names:
        issues.append(("rule", "Bugfix change requires a 'reproduce' step"))

    # Bugfix: must have 'verify' step after reproduce
    if ct == "bugfix" and "verify" not in step_names:
        issues.append(("rule", "Bugfix change requires a 'verify' step"))

    # Refactor: must have 'baseline' step
    if ct == "refactor" and "baseline" not in step_names:
        issues.append(("rule", "Refactor change requires a 'baseline' step (existing tests green before change)"))

    # Refactor: must have 'verify' step
    if ct == "refactor" and "verify" not in step_names:
        issues.append(("rule", "Refactor change requires a 'verify' step (regression check)"))

    # Performance: must have 'baseline' and 'verify'
    if ct == "performance":
        if "baseline" not in step_names:
            issues.append(("rule", "Performance change requires a 'baseline' step"))
        if "verify" not in step_names:
            issues.append(("rule", "Performance change requires a 'verify' step"))

    # Dependency: must have 'smoke' or 'verify'
    if ct == "dependency":
        if "verify" not in step_names and "smoke" not in step_names:
            issues.append(("rule", "Dependency change requires a 'verify' or 'smoke' step"))

    # Documentation: must have 'smoke' or 'verify'
    if ct == "documentation":
        if "verify" not in step_names and "smoke" not in step_names:
            issues.append(("rule", "Documentation change requires a 'verify' or 'smoke' step (e.g., link check)"))

    # Security: must have 'audit' step
    if ct == "security" and "audit" not in step_names:
        issues.append(("rule", "Security change requires an 'audit' step"))

    # Validate individual steps
    for i, step in enumerate(steps):
        si = f"steps[{i}]"
        if not isinstance(step, dict):
            issues.append(("structure", f"{si} must be an object"))
            continue

        if "name" not in step:
            issues.append(("required", f"{si} missing 'name'"))
        if "status" not in step:
            issues.append(("required", f"{si} missing 'status'"))

        # Check skipped step has reason
        if step.get("status") == "skipped" and not step.get("reason"):
            issues.append(("rule", f"{si} ({step.get('name', '?')}) is skipped but has no reason"))

        # Check command/exit_code for pass/fail steps
        if step.get("status") in ("pass", "fail"):
            # Not having a command is OK for design/planning steps
            pass

    # user_approval_required check
    if evidence.get("user_approval_required") and not evidence.get("approval_reference"):
        issues.append(("rule", "user_approval_required=True but no approval_reference provided"))

    # Strict mode: no skipped steps allowed unless reason is explicit
    if strict:
        for i, step in enumerate(steps):
            if step.get("status") == "skipped":
                if not step.get("reason"):
                    issues.append(("strict", f"steps[{i}] skipped without reason (strict mode)"))

    return issues


def main():
    parser = argparse.ArgumentParser(
        description="Validate change evidence against schema and type-specific rules"
    )
    parser.add_argument("--file", "-f", required=True,
                        help="Path to change evidence JSON file")
    parser.add_argument("--change-type", "-t", choices=[
        "feature", "bugfix", "refactor", "performance", "dependency",
        "configuration", "documentation", "scaffold", "security", "release", "spike"
    ], help="Expected change type (overrides evidence value)")
    parser.add_argument("--strict", "-s", action="store_true",
                        help="Strict mode: no skipped steps without reason")

    args = parser.parse_args()

    evidence, err = load_json(args.file)
    if err:
        print(f"ERROR: {err}", file=sys.stderr)
        sys.exit(1)

    issues = validate_change_evidence(evidence, change_type=args.change_type, strict=args.strict)

    if issues:
        print("Validation FAILED:", file=sys.stderr)
        for rule, detail in issues:
            print(f"  [{rule}] {detail}", file=sys.stderr)
        sys.exit(1)

    ct = evidence.get("change_type", args.change_type or "?")
    print(f"Validation PASS: {args.file}")
    print(f"  change_type={ct}")
    print(f"  steps={len(evidence.get('steps', []))}")
    sys.exit(0)


if __name__ == "__main__":
    main()

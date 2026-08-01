#!/usr/bin/env python3
"""Validate the repository's declarative Agent evaluation scenarios."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EVALS_PATH = ROOT / "evals" / "evals.json"
REQUIRED_FIELDS = {"id", "name", "prompt", "expected_output", "assertions", "should_trigger", "files", "skills"}


def main() -> int:
    try:
        data = json.loads(EVALS_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"ERROR: missing {EVALS_PATH}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as exc:
        print(f"ERROR: invalid JSON at {exc.lineno}:{exc.colno}: {exc.msg}", file=sys.stderr)
        return 1

    errors: list[str] = []
    if not isinstance(data, dict) or data.get("skill_name") != "moonbit-pipeline":
        errors.append("root.skill_name must be 'moonbit-pipeline'")
    scenarios = data.get("evals") if isinstance(data, dict) else None
    if not isinstance(scenarios, list) or not scenarios:
        errors.append("evals must be a non-empty array")
        scenarios = []

    ids: set[int] = set()
    names: set[str] = set()
    for index, scenario in enumerate(scenarios):
        prefix = f"evals[{index}]"
        if not isinstance(scenario, dict):
            errors.append(f"{prefix} must be an object")
            continue
        missing = sorted(REQUIRED_FIELDS - set(scenario))
        errors.extend(f"{prefix} missing field: {field}" for field in missing)
        scenario_id = scenario.get("id")
        if not isinstance(scenario_id, int) or isinstance(scenario_id, bool):
            errors.append(f"{prefix}.id must be an integer")
        elif scenario_id in ids:
            errors.append(f"duplicate scenario id: {scenario_id}")
        else:
            ids.add(scenario_id)
        name = scenario.get("name")
        if not isinstance(name, str) or not name.strip():
            errors.append(f"{prefix}.name must be non-empty")
        elif name in names:
            errors.append(f"duplicate scenario name: {name}")
        else:
            names.add(name)
        for field in ("prompt", "expected_output"):
            if not isinstance(scenario.get(field), str) or not scenario[field].strip():
                errors.append(f"{prefix}.{field} must be non-empty")
        if not isinstance(scenario.get("assertions"), list) or not scenario["assertions"]:
            errors.append(f"{prefix}.assertions must be a non-empty array")
        if not isinstance(scenario.get("should_trigger"), bool):
            errors.append(f"{prefix}.should_trigger must be boolean")
        for field in ("files", "skills"):
            value = scenario.get(field)
            if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
                errors.append(f"{prefix}.{field} must be an array of strings")

    if errors:
        print("Evaluation validation FAILED:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(f"Evaluation validation PASS: {len(scenarios)} scenarios")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

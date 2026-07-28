#!/usr/bin/env python3
"""Check that plugin metadata across all platforms stays in sync."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# All platform plugin descriptors that use plugin.json format
PLUGIN_JSONS = [
    ROOT / ".claude-plugin" / "plugin.json",
    ROOT / ".codex-plugin" / "plugin.json",
    ROOT / ".cursor-plugin" / "plugin.json",
    ROOT / ".kimi-plugin" / "plugin.json",
]

# Gemini uses a different filename but same structural fields
EXTRA_DESCRIPTORS = [
    ROOT / "gemini-extension.json",
]

# Fields that must be identical across all plugin descriptors
SYNC_FIELDS = ("name", "repository", "version")


def collect_descriptors() -> list[tuple[Path, dict]]:
    """Load all plugin descriptors, returning (path, data) pairs."""
    result = []
    for path in PLUGIN_JSONS:
        if path.exists():
            result.append((path, json.loads(path.read_text(encoding="utf-8"))))
        else:
            print(f"⚠  Missing: {path}")
    for path in EXTRA_DESCRIPTORS:
        if path.exists():
            result.append((path, json.loads(path.read_text(encoding="utf-8"))))
        else:
            print(f"⚠  Missing: {path}")
    return result


def check_sync_fields(descriptors: list[tuple[Path, dict]]) -> list[str]:
    """Check SYNC_FIELDS are identical across all descriptors."""
    failures = []
    for field in SYNC_FIELDS:
        values = {data.get(field) for _, data in descriptors}
        if len(values) != 1:
            failures.append(f"{field}: {sorted(values, key=str)}")
    return failures


def check_author(descriptors: list[tuple[Path, dict]]) -> list[str]:
    """Check author name (or author.name) is consistent."""
    failures = []
    authors = set()
    for _, data in descriptors:
        author = data.get("author")
        if isinstance(author, dict):
            authors.add(author.get("name"))
        else:
            authors.add(author)
    if len(authors) != 1:
        failures.append(f"author: {sorted(authors, key=str)}")
    return failures


def check_hooks(descriptors: list[tuple[Path, dict]]) -> list[str]:
    """Check hooks field consistency (gemini-extension.json may not need it)."""
    failures = []
    for path, data in descriptors:
        # Only plugin.json files are expected to declare hooks
        if path.suffix == ".json" and "plugin" in path.name:
            hooks_val = data.get("hooks")
            expected = "hooks/hooks.json"
            if hooks_val is not None and hooks_val != expected:
                failures.append(f"{path}: hooks must point to {expected!r}, got {hooks_val!r}")
    return failures


def main() -> int:
    descriptors = collect_descriptors()
    if not descriptors:
        print("No plugin descriptors found")
        return 0

    failures = []
    failures.extend(check_sync_fields(descriptors))
    failures.extend(check_author(descriptors))
    failures.extend(check_hooks(descriptors))

    if failures:
        print(f"Plugin metadata mismatch ({len(descriptors)} descriptors checked):")
        print("\n".join(f"- {f}" for f in failures))
        return 1

    platforms = ", ".join(
        p.relative_to(ROOT).parent.as_posix()
        for p, _ in descriptors
    )
    print(f"✅ Plugin metadata consistent across all platforms")
    print(f"   {len(descriptors)} descriptors, {len(SYNC_FIELDS)} sync fields")
    print(f"   Platforms: {platforms}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

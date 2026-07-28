#!/usr/bin/env python3
"""Check that plugin metadata across all platforms stays in sync."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# All platform plugin descriptors that use plugin.json format
# OMP uses root plugin.json (Claude-Code-compatible layout)
PLUGIN_JSONS = [
    ROOT / "plugin.json",  # OMP
    ROOT / ".claude-plugin" / "plugin.json",
    ROOT / ".codex-plugin" / "plugin.json",
    ROOT / ".cursor-plugin" / "plugin.json",
    ROOT / ".kimi-plugin" / "plugin.json",
]

# Gemini uses a different filename with different fields
GEMINI_DESCRIPTOR = ROOT / "gemini-extension.json"

# OpenCode uses opencode.json
OPENCODE_DESCRIPTOR = ROOT / ".opencode" / "opencode.json"

# Pi uses package.json
PI_DESCRIPTOR = ROOT / "package.json"

# Pi extension file
PI_EXTENSION = ROOT / ".pi" / "extensions" / "moonbit-skills.ts"

# OMP TypeScript hook for session bootstrap
OMP_HOOK = ROOT / "hooks" / "pre" / "session-start.ts"

# OMP commands directory
OMP_COMMANDS_DIR = ROOT / "commands"

# Fields that must be identical across all plugin.json descriptors
SYNC_FIELDS = ("name", "version", "description")

# Fields that must be identical across plugin.json descriptors (excluding Gemini)
PLUGIN_ONLY_SYNC_FIELDS = ("repository", "license", "skills")


def collect_descriptors() -> tuple[list[tuple[Path, dict]], dict | None, dict | None, dict | None]:
    """Load all descriptors, returning (plugin_jsons, gemini, opencode, pi)."""
    result = []
    for path in PLUGIN_JSONS:
        if path.exists():
            result.append((path, json.loads(path.read_text(encoding="utf-8"))))
        else:
            print(f"⚠  Missing: {path}")

    gemini = None
    if GEMINI_DESCRIPTOR.exists():
        gemini = json.loads(GEMINI_DESCRIPTOR.read_text(encoding="utf-8"))
    else:
        print(f"⚠  Missing: {GEMINI_DESCRIPTOR}")

    opencode = None
    if OPENCODE_DESCRIPTOR.exists():
        opencode = json.loads(OPENCODE_DESCRIPTOR.read_text(encoding="utf-8"))
    else:
        print(f"⚠  Missing: {OPENCODE_DESCRIPTOR}")

    pi = None
    if PI_DESCRIPTOR.exists():
        pi = json.loads(PI_DESCRIPTOR.read_text(encoding="utf-8"))
    else:
        print(f"⚠  Missing: {PI_DESCRIPTOR}")

    return result, gemini, opencode, pi


def check_sync_fields(descriptors: list[tuple[Path, dict]]) -> list[str]:
    """Check SYNC_FIELDS are identical across all plugin.json descriptors."""
    failures = []
    for field in SYNC_FIELDS:
        values = {data.get(field) for _, data in descriptors}
        if len(values) != 1:
            failures.append(f"{field}: {sorted(values, key=str)}")
    return failures


def check_plugin_only_fields(descriptors: list[tuple[Path, dict]]) -> list[str]:
    """Check PLUGIN_ONLY_SYNC_FIELDS are identical across plugin.json descriptors."""
    failures = []
    for field in PLUGIN_ONLY_SYNC_FIELDS:
        if field == "skills":
            # Claude Code and OMP don't have a skills field in their schema
            # (OMP discovers skills/ directory automatically)
            values = {
                data.get(field)
                for path, data in descriptors
                if ".claude-plugin" not in str(path) and path.parent != ROOT
            }
        else:
            values = {data.get(field) for _, data in descriptors}
        if len(values) != 1:
            failures.append(f"{field}: {sorted(values, key=str)}")
    return failures


def check_author(descriptors: list[tuple[Path, dict]]) -> list[str]:
    """Check author name is consistent across all plugin.json descriptors."""
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
    """Check hooks field is declared in plugin.json files that support it."""
    failures = []
    for path, data in descriptors:
        hooks_val = data.get("hooks")
        expected = "hooks/hooks.json"
        if hooks_val is None:
            # Claude Code and Kimi Code should declare hooks
            # OMP (root plugin.json) uses TypeScript hooks, not shell hooks
            pname = path.parent.name
            if pname in (".claude-plugin", ".kimi-plugin"):
                failures.append(f"{path}: hooks field missing, expected {expected!r}")
        elif hooks_val != expected:
            failures.append(f"{path}: hooks must point to {expected!r}, got {hooks_val!r}")
    return failures


def check_gemini(gemini: dict | None) -> list[str]:
    """Check Gemini CLI specific fields."""
    failures = []
    if gemini is None:
        return failures
    if "contextFileName" not in gemini:
        failures.append("gemini-extension.json: missing contextFileName")
    # Check no non-official fields are present
    unofficial = {"author", "repository", "license", "skills", "homepage", "interface"}
    found = unofficial & set(gemini.keys())
    if found:
        failures.append(f"gemini-extension.json: non-official fields: {sorted(found)}")
    return failures


def check_kimi_session_start(descriptors: list[tuple[Path, dict]]) -> list[str]:
    """Check Kimi Code has sessionStart.skill configured."""
    failures = []
    for path, data in descriptors:
        if ".kimi-plugin" in str(path):
            ss = data.get("sessionStart")
            if not isinstance(ss, dict) or not ss.get("skill"):
                failures.append(f"{path}: missing sessionStart.skill")
            break
    return failures


def check_kimi_interface(descriptors: list[tuple[Path, dict]]) -> list[str]:
    """Check Kimi Code interface only contains official Kimi Code fields."""
    failures = []
    for path, data in descriptors:
        if ".kimi-plugin" in str(path):
            iface = data.get("interface")
            if isinstance(iface, dict):
                non_official = {"category", "capabilities"}
                found = non_official & set(iface.keys())
                if found:
                    failures.append(f"{path}: interface contains non-official fields: {sorted(found)}")
            break
    return failures


def check_interface_absence(descriptors: list[tuple[Path, dict]]) -> list[str]:
    """Check non-Kimi platforms don't have interface field."""
    failures = []
    for path, data in descriptors:
        if ".kimi-plugin" not in str(path):
            if "interface" in data:
                failures.append(f"{path}: interface field should not be present (not in official schema)")
    return failures


def check_opencode(opencode: dict | None) -> list[str]:
    """Check OpenCode descriptor."""
    failures = []
    if opencode is None:
        return failures
    instructions = opencode.get("instructions", [])
    if len(instructions) > 1:
        failures.append(f"opencode.json: instructions should only contain the bootstrap skill, got {len(instructions)} entries")
    if "plugin" not in opencode:
        failures.append("opencode.json: missing plugin field")
    return failures


def check_pi(pi: dict | None) -> list[str]:
    """Check Pi package.json descriptor and extension file."""
    failures = []
    if pi is None:
        return failures
    pi_config = pi.get("pi", {})
    if "skills" not in pi_config:
        failures.append("package.json: missing pi.skills field")
    if "extensions" not in pi_config or not pi_config["extensions"]:
        failures.append("package.json: missing pi.extensions field")
    elif not PI_EXTENSION.exists():
        failures.append(f"package.json: pi.extensions points to {PI_EXTENSION.name} but file does not exist")
    return failures


def check_nested_codex() -> list[str]:
    """Check nested Codex plugin is consistent with root."""
    failures = []
    nested = ROOT / "plugins" / "moonbit-skills" / ".codex-plugin" / "plugin.json"
    root = ROOT / ".codex-plugin" / "plugin.json"
    if not nested.exists():
        failures.append(f"Missing nested: {nested}")
        return failures
    if not root.exists():
        return failures
    nested_data = json.loads(nested.read_text(encoding="utf-8"))
    root_data = json.loads(root.read_text(encoding="utf-8"))
    for field in ("name", "version", "description", "repository", "license"):
        rv = root_data.get(field)
        nv = nested_data.get(field)
        if rv != nv:
            failures.append(f"nested Codex {field}: root={rv!r}, nested={nv!r}")
    return failures


def check_omp() -> list[str]:
    """Check OMP TypeScript hook and commands exist."""
    failures = []
    if not OMP_HOOK.exists():
        failures.append(f"OMP hook missing: {OMP_HOOK.relative_to(ROOT)}")
    elif "session_start" not in OMP_HOOK.read_text(encoding="utf-8"):
        failures.append(f"OMP hook: session_start handler not found in {OMP_HOOK.relative_to(ROOT)}")

    if not OMP_COMMANDS_DIR.exists():
        failures.append(f"OMP commands directory missing: {OMP_COMMANDS_DIR.relative_to(ROOT)}")
    else:
        cmd_files = list(OMP_COMMANDS_DIR.glob("*.md"))
        if not cmd_files:
            failures.append(f"OMP commands directory empty: {OMP_COMMANDS_DIR.relative_to(ROOT)}")
    return failures


def main() -> int:
    plugin_descriptors, gemini, opencode, pi = collect_descriptors()
    if not plugin_descriptors:
        print("No plugin descriptors found")
        return 0

    failures = []
    failures.extend(check_sync_fields(plugin_descriptors))
    failures.extend(check_plugin_only_fields(plugin_descriptors))
    failures.extend(check_author(plugin_descriptors))
    failures.extend(check_hooks(plugin_descriptors))
    failures.extend(check_gemini(gemini))
    failures.extend(check_kimi_session_start(plugin_descriptors))
    failures.extend(check_kimi_interface(plugin_descriptors))
    failures.extend(check_interface_absence(plugin_descriptors))
    failures.extend(check_opencode(opencode))
    failures.extend(check_pi(pi))
    failures.extend(check_nested_codex())
    failures.extend(check_omp())

    if failures:
        total = len(plugin_descriptors) + (1 if gemini else 0) + (1 if opencode else 0) + (1 if pi else 0)
        print(f"Plugin metadata mismatch ({total} descriptors checked):")
        print("\n".join(f"- {f}" for f in failures))
        return 1

    platforms = ", ".join(
        p.relative_to(ROOT).parent.as_posix()
        for p, _ in plugin_descriptors
    )
    extras = []
    if gemini:
        extras.append("gemini-extension.json")
    if opencode:
        extras.append("opencode.json")
    if pi:
        extras.append("package.json")
    print(f"✅ Plugin metadata consistent across all platforms")
    print(f"   {len(plugin_descriptors)} plugin.json, {len(extras)} extra descriptors")
    print(f"   {len(SYNC_FIELDS) + len(PLUGIN_ONLY_SYNC_FIELDS)} sync fields")
    print(f"   Platforms: {platforms} + {', '.join(extras)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
#!/usr/bin/env python3
"""Check that plugin metadata across all platforms stays in sync.

Platform field whitelist (official schema only — non-official fields cause
inconsistent behavior across platforms and must not be added):

| Platform              | Allowed fields                                                |
|-----------------------|---------------------------------------------------------------|
| OMP (root plugin.json + package.json)| name, version, description, author{name}, homepage, repository, license, omp.extensions |
| Claude Code           | name, version, description, author{name}, homepage, repository, license, hooks |
| Codex CLI             | name, version, description, author{name,url}, homepage, repository, license |
| Cursor                | name, version, description, author{name}, repository, license |
| Kimi Code             | name, version, description, author{name,url}, repository, license, sessionStart, hooks |
| Gemini CLI           | name, version, description, contextFileName                   |
| OpenCode             | plugin, instructions                                          |

Non-official fields removed in this revision:
- `skills` (Codex/Cursor/Kimi Code): platforms discover skills/ automatically
- `interface` (Kimi Code): displayName/shortDescription are non-official
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# All platform plugin descriptors that use plugin.json format
# OMP uses root plugin.json for shared metadata and package.json for runtime extensions
PLUGIN_JSONS = [
    ROOT / "plugin.json",  # OMP shared metadata
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

# OMP TypeScript hooks
OMP_PRE_HOOK = ROOT / "hooks" / "pre" / "session-start.ts"
OMP_POST_HOOK = ROOT / "hooks" / "post" / "verify-moonbit.ts"

# OMP commands directory
OMP_COMMANDS_DIR = ROOT / "commands"

# Shared verification modules
SHARED_VERIFY_TS = ROOT / "hooks" / "shared" / "verify-moonbit.ts"
SHARED_VERIFY_SH = ROOT / "hooks" / "post-tool-verify.sh"

# Platform-specific post-tool hook configs
CODEX_HOOKS = ROOT / ".codex-plugin" / "hooks.json"
CURSOR_HOOKS = ROOT / ".cursor-plugin" / "hooks.json"
GEMINI_SETTINGS = ROOT / ".gemini" / "settings.json"
OPENCODE_PLUGIN = ROOT / ".opencode" / "plugins" / "moonbit-verify.ts"

# Fields that must be identical across all plugin.json descriptors
SYNC_FIELDS = ("name", "version", "description")

# Fields that must be identical across plugin.json descriptors (excluding Gemini)
# Note: "skills" field is non-official and has been removed from all platforms.
# Platforms discover skills/ directory automatically (OMP) or via sessionStart hook (Kimi Code).
PLUGIN_ONLY_SYNC_FIELDS = ("repository", "license")


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
    """Check Pi and OMP package.json descriptors and the Pi extension file."""
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
    else:
        ext_content = PI_EXTENSION.read_text(encoding="utf-8")
        if "session_start" not in ext_content:
            failures.append(f"Pi extension: session_start handler not found in {PI_EXTENSION.relative_to(ROOT)}")
        # Note: tool_result and shared/verify-moonbit checks are in check_post_tool_hooks()
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


def check_omp(pi: dict | None) -> list[str]:
    """Check OMP package metadata, TypeScript hooks, and commands."""
    failures = []

    if pi is None:
        failures.append("package.json: missing OMP manifest")
    else:
        omp_config = pi.get("omp", {})
        extensions = omp_config.get("extensions", [])
        if not extensions:
            failures.append("package.json: missing omp.extensions field")
        else:
            for entry in extensions:
                entry_path = ROOT / entry
                if not entry_path.exists():
                    failures.append(f"package.json: omp.extensions entry missing: {entry}")

    # Pre-hook: session start bootstrap
    if not OMP_PRE_HOOK.exists():
        failures.append(f"OMP pre-hook missing: {OMP_PRE_HOOK.relative_to(ROOT)}")
    elif "session_start" not in OMP_PRE_HOOK.read_text(encoding="utf-8"):
        failures.append(f"OMP pre-hook: session_start handler not found in {OMP_PRE_HOOK.relative_to(ROOT)}")

    # Post-hook: post-tool verification
    if not OMP_POST_HOOK.exists():
        failures.append(f"OMP post-hook missing: {OMP_POST_HOOK.relative_to(ROOT)}")
    else:
        post_content = OMP_POST_HOOK.read_text(encoding="utf-8")
        if "tool_result" not in post_content:
            failures.append(f"OMP post-hook: tool_result handler not found in {OMP_POST_HOOK.relative_to(ROOT)}")
        if "shared/verify-moonbit" not in post_content:
            failures.append(f"OMP post-hook: must import shared verification module in {OMP_POST_HOOK.relative_to(ROOT)}")

    if not OMP_COMMANDS_DIR.exists():
        failures.append(f"OMP commands directory missing: {OMP_COMMANDS_DIR.relative_to(ROOT)}")
    else:
        cmd_files = list(OMP_COMMANDS_DIR.glob("*.md"))
        if not cmd_files:
            failures.append(f"OMP commands directory empty: {OMP_COMMANDS_DIR.relative_to(ROOT)}")
    return failures


def check_post_tool_hooks() -> list[str]:
    """Check post-tool verification hooks are configured on all platforms."""
    failures = []

    # Shared modules must exist
    if not SHARED_VERIFY_TS.exists():
        failures.append(f"Shared TS verify module missing: {SHARED_VERIFY_TS.relative_to(ROOT)}")
    if not SHARED_VERIFY_SH.exists():
        failures.append(f"Shared shell verify script missing: {SHARED_VERIFY_SH.relative_to(ROOT)}")

    # Claude Code + Kimi Code: hooks.json must have PostToolUse event
    hooks_json_path = ROOT / "hooks" / "hooks.json"
    if hooks_json_path.exists():
        hooks_data = json.loads(hooks_json_path.read_text(encoding="utf-8"))
        hooks = hooks_data.get("hooks", {})
        if "PostToolUse" not in hooks:
            failures.append("hooks/hooks.json: missing PostToolUse event (Claude Code + Kimi Code)")
        else:
            # Verify it references post-tool-verify.sh
            post_hooks = hooks["PostToolUse"]
            found_verify = False
            for entry in post_hooks:
                for h in entry.get("hooks", []):
                    cmd = h.get("command", "")
                    if "post-tool-verify" in cmd:
                        found_verify = True
                        break
            if not found_verify:
                failures.append("hooks/hooks.json: PostToolUse does not reference post-tool-verify.sh")
    else:
        failures.append("hooks/hooks.json: file missing")

    # Codex CLI: .codex-plugin/hooks.json must have PostToolUse
    if CODEX_HOOKS.exists():
        codex_data = json.loads(CODEX_HOOKS.read_text(encoding="utf-8"))
        codex_hooks = codex_data.get("hooks", {})
        if "PostToolUse" not in codex_hooks:
            failures.append(f"{CODEX_HOOKS.relative_to(ROOT)}: missing PostToolUse event")
    else:
        failures.append(f"{CODEX_HOOKS.relative_to(ROOT)}: file missing")

    # Cursor: .cursor-plugin/hooks.json must have afterFileEdit
    if CURSOR_HOOKS.exists():
        cursor_data = json.loads(CURSOR_HOOKS.read_text(encoding="utf-8"))
        cursor_hooks = cursor_data.get("hooks", {})
        if "afterFileEdit" not in cursor_hooks:
            failures.append(f"{CURSOR_HOOKS.relative_to(ROOT)}: missing afterFileEdit event")
    else:
        failures.append(f"{CURSOR_HOOKS.relative_to(ROOT)}: file missing")

    # Gemini CLI: .gemini/settings.json must have AfterTool
    if GEMINI_SETTINGS.exists():
        gemini_data = json.loads(GEMINI_SETTINGS.read_text(encoding="utf-8"))
        gemini_hooks = gemini_data.get("hooks", {})
        if "AfterTool" not in gemini_hooks:
            failures.append(f"{GEMINI_SETTINGS.relative_to(ROOT)}: missing AfterTool event")
    else:
        failures.append(f"{GEMINI_SETTINGS.relative_to(ROOT)}: file missing")

    # OpenCode: .opencode/plugins/moonbit-verify.ts must exist with tool.execute.after
    if OPENCODE_PLUGIN.exists():
        plugin_content = OPENCODE_PLUGIN.read_text(encoding="utf-8")
        if "tool.execute.after" not in plugin_content:
            failures.append(f"{OPENCODE_PLUGIN.relative_to(ROOT)}: missing tool.execute.after handler")
        if "shared/verify-moonbit" not in plugin_content:
            failures.append(f"{OPENCODE_PLUGIN.relative_to(ROOT)}: must import shared verification module")
    else:
        failures.append(f"{OPENCODE_PLUGIN.relative_to(ROOT)}: file missing")

    # Pi: extension must have tool_result handler
    if PI_EXTENSION.exists():
        ext_content = PI_EXTENSION.read_text(encoding="utf-8")
        if "tool_result" not in ext_content:
            failures.append(f"{PI_EXTENSION.relative_to(ROOT)}: missing tool_result handler")
        if "shared/verify-moonbit" not in ext_content:
            failures.append(f"{PI_EXTENSION.relative_to(ROOT)}: must import shared verification module")
    else:
        failures.append(f"{PI_EXTENSION.relative_to(ROOT)}: file missing")

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
    failures.extend(check_omp(pi))
    failures.extend(check_post_tool_hooks())

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
#!/usr/bin/env nu
# SessionStart hook for moonbit-skills plugin (Nushell, cross-platform)
# Injects the using-moonbit-skills bootstrap into agent session
# Routes to the correct skill based on user intent

# Get plugin root directory
let script_dir = ($env.CURRENT_FILE | path dirname)
let plugin_root = ($script_dir | path join "..")
let skill_path = ($plugin_root | path join "skills" "using-moonbit-skills" "SKILL.md")

# Read bootstrap skill
let skill_content = (open --raw $skill_path | str replace --all '\' '\\' | str replace --all '"' '\"' | str replace --all "\n" '\n' | str replace --all "\r" '\r' | str replace --all "\t" '\t')

let session_context = $'<EXTREMELY-IMPORTANT>\nYou have MoonBit Skills loaded.\n\n**Below is the full MoonBit Skills bootstrap — your introduction to using skills:**\n\n($skill_content)\n</EXTREMELY-IMPORTANT>'

# Multi-platform dispatch
let is_copilot = ($env.COPILOT_CLI? | is-not-empty)
let is_cursor = ($env.CURSOR_PLUGIN_ROOT? | is-not-empty)
let is_claude = ($env.CLAUDE_PLUGIN_ROOT? | is-not-empty) and (not $is_copilot)

let output = if $is_cursor {
    { additionalContext: $session_context }
} else if $is_claude {
    { hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: $session_context } }
} else {
    # Copilot CLI or unknown platform — SDK standard format
    { additionalContext: $session_context }
}

$output | to json --compact
exit 0
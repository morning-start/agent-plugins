#!/usr/bin/env nu
# SessionStart hook for moonbit-skills plugin (Nushell, cross-platform)
# Injects the using-moonbit-skills bootstrap into agent session
# Routes to the correct skill based on user intent
#
# FST Detection: Checks if flowstate is already loaded or available,
# and injects FST_DETECTED:true marker when found.

# Get plugin root directory
let script_dir = if ($env.CURRENT_FILE? | is-not-empty) {
    $env.CURRENT_FILE | path dirname
} else {
    (($env.CLAUDE_PLUGIN_ROOT? | default (pwd)) | path join "hooks")
}
let plugin_root = ($script_dir | path join "..")
let skill_path = ($plugin_root | path join "skills" "using-moonbit-skills" "SKILL.md")

# --- FST (flowstate) Detection ---
mut fst_detected = false

# Signal 1: Check if flowstate plugin exists as a sibling directory
let flowstate_candidates = [
    ($plugin_root | path join ".." "flowstate" "skills" "using-fst" "SKILL.md"),
    ($plugin_root | path join "flowstate" "skills" "using-fst" "SKILL.md")
]
for candidate in $flowstate_candidates {
    if ($candidate | path exists) {
        $fst_detected = true
        break
    }
}

# Signal 2: Check if project root has flowstate workspace structure
let project_root = (pwd)
let modes_dir = ($project_root | path join ".agent-workplace" "modes")
let state_dir = ($project_root | path join ".agent-workplace" "state")
if (($modes_dir | path exists) and ($state_dir | path exists)) {
    $fst_detected = true
}

# --- Read bootstrap skill ---
let skill_content = (open --raw $skill_path | str replace --all '\' '\\' | str replace --all '"' '\"' | str replace --all "\n" '\n' | str replace --all "\r" '\r' | str replace --all "\t" '\t')

let fst_marker = if $fst_detected { "FST_DETECTED:true\n\n" } else { "" }

let session_context = $'<EXTREMELY-IMPORTANT>\nYou have MoonBit Skills loaded.\n\n($fst_marker)**Below is the full MoonBit Skills bootstrap — your introduction to using skills:**\n\n($skill_content)\n</EXTREMELY-IMPORTANT>'

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

print ($output | to json)
exit 0

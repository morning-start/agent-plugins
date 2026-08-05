#!/usr/bin/env nu
# SessionStart hook runner for Nushell (cross-platform)
# Injects the using-moonbit-skills bootstrap into agent session
# Detects platform and routes to the correct skill based on user intent

let hook_name = ($env.HOOK_NAME? | default "")

if $hook_name != "session-start" {
    print $"Unknown hook: ($hook_name)"
    exit 1
}

# Run the session-start hook script
let plugin_root = ($env.CURRENT_FILE | path dirname | path join "..")
nu $"($plugin_root)/hooks/session-start.nu"
exit $env.LAST_EXIT_CODE
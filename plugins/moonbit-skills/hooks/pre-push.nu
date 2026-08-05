#!/usr/bin/env nu
# Pre-push hook for MoonBit projects — heavy checks (test + security audit)
# Fast checks (fmt + type check) are in pre-commit.nu

print "=== MoonBit Pre-Push ==="

# Check if we're in a MoonBit project
if not ("moon.mod" | path exists) and not ("moon.mod.json" | path exists) {
    print "Not a MoonBit project, skipping hooks"
    exit 0
}

let strict_audit = ($env.MOONBIT_STRICT_AUDIT? | default "0")

print "-> moon test --target native"
moon test --target native
print "OK Tests passed"

let has_audit = (which moon-audit | length) > 0
if $has_audit {
    print "-> moon-audit --fail-on-error ."
    moon-audit --fail-on-error .
    print "OK Security audit passed"
} else {
    if $strict_audit == "1" {
        print "Security audit unavailable and MOONBIT_STRICT_AUDIT=1"
        exit 1
    }
    print "! moon-audit not installed, skipping security audit"
    print "  Install: moon add minie135/moon-audit"
}

print "=== Pre-push passed ==="
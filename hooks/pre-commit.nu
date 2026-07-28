#!/usr/bin/env nu
# Pre-commit hook for MoonBit projects — fast checks only (fmt + type check)
# Heavy checks (test + audit) are in pre-push.nu

print "=== MoonBit Pre-Commit ==="

# Check if we're in a MoonBit project
if not ("moon.mod" | path exists) and not ("moon.mod.json" | path exists) {
    print "Not a MoonBit project, skipping hooks"
    exit 0
}

print "-> moon fmt --check"
moon fmt --check
print "OK Format check passed"

print "-> moon check --target native --warn-list +73"
moon check --target native --warn-list +73
print "OK Type check passed"

print "=== Pre-commit passed ==="
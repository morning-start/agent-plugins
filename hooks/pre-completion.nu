#!/usr/bin/env nu
# Pre-completion hook for MoonBit projects
# Hard condition: runs before agent claims completion
# Executes: fmt --check + check + test + moon-audit

print "=== MoonBit Pre-Completion ==="

let project_dir = (if ($env.PROJECT_DIR? | is-empty) { "." } else { $env.PROJECT_DIR })
cd $project_dir

# Check if we're in a MoonBit project
if not ("moon.mod" | path exists) and not ("moon.mod.json" | path exists) {
    print $"Not a MoonBit project: ($project_dir)"
    print "Skipping MoonBit completion gate"
    exit 0
}

let strict_audit = ($env.MOONBIT_STRICT_AUDIT? | default "1")
mut failed = 0

# 1. Format check
print "→ moon fmt --check..."
let fmt_result = (try { moon fmt --check; true } catch { false })
if $fmt_result {
    print "✅ Format check passed"
} else {
    print "❌ Format check failed. Run: moon fmt"
    $failed = 1
}

# 2. Type check with warnings
print "→ moon check --target native --warn-list +73..."
let check_result = (try { moon check --target native --warn-list +73; true } catch { false })
if $check_result {
    print "✅ Type check passed"
} else {
    print "❌ Type check failed. Run: moon explain --diagnostic E####"
    $failed = 1
}

# 3. Test
print "→ moon test --target native..."
let test_result = (try { moon test --target native; true } catch { false })
if $test_result {
    print "✅ Tests passed"
} else {
    print "❌ Tests failed. Run: moon test -f \"failing_test\""
    $failed = 1
}

# 4. Security audit
let has_audit = (which moon-audit | length) > 0
if $has_audit {
    print "→ moon-audit pipeline..."
    let audit_result = (try { moon-audit --fail-on-error .; true } catch { false })
    if $audit_result {
        print "✅ Security audit passed"
    } else {
        print "❌ Security audit found issues. Run: moon-audit ."
        $failed = 1
    }
} else {
    print "⚠️  moon-audit not installed, skipping"
}

# 5. Package info
let info_result = (try { moon info --target native; true } catch { false })
if $info_result {
    print "✅ Package info OK"
} else {
    print "⚠️  moon info failed (non-fatal)"
}

print "=== Summary ==="
if $failed == 0 {
    print "✅ All checks passed"
    exit 0
} else {
    print "❌ Some checks failed. Fix the issues above before completing."
    exit 1
}
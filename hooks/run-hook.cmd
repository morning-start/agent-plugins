@echo off
REM SessionStart hook runner for Windows with graceful fallback
REM Usage: run-hook.cmd session-start

if "%1"=="session-start" (
  where powershell >nul 2>&1
  if errorlevel 1 (
    echo {"additionalContext": "[MoonBit Skills] powershell not found, bootstrap skill fallback active."}
    exit /b 0
  )
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0session-start.ps1" "%1" 2>nul
  if errorlevel 1 (
    echo {"additionalContext": "[MoonBit Skills] session-start script execution fallback active."}
    exit /b 0
  )
  exit /b 0
)

if "%~1"=="" (
  echo Usage: run-hook.cmd ^<hook_name^>
  exit /b 1
)

echo Unknown hook: %1
exit /b 1
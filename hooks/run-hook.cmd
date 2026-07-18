@echo off
REM SessionStart hook runner for Windows
REM Usage: run-hook.cmd session-start

if "%1"=="session-start" (
  powershell -ExecutionPolicy Bypass -File "%~dp0session-start.ps1"
  exit /b %errorlevel%
)

echo Unknown hook: %1
exit /b 1
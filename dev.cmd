@echo off
REM Start Odoggle locally (web :3000 + server :3001)
cd /d "%~dp0"

where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm not found. Install Node.js from https://nodejs.org
  exit /b 1
)

if not exist node_modules (
  echo Run setup.cmd first.
  exit /b 1
)

if not exist apps\server\.env (
  echo Run setup.cmd first ^(missing apps\server\.env^).
  exit /b 1
)

call npm run dev

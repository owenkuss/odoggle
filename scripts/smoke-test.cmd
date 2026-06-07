@echo off
REM Quick local smoke test (server must be running via dev.cmd)
cd /d "%~dp0.."

set API=http://localhost:3001
set WEB=http://localhost:3000

echo Testing %API%/health ...
curl -sf %API%/health >nul 2>&1
if errorlevel 1 (
  echo FAIL: Game server not running on :3001. Start dev.cmd first.
  exit /b 1
)
echo OK: server health

echo Testing %API%/api/stats ...
curl -sf %API%/api/stats >nul 2>&1
if errorlevel 1 (
  echo FAIL: /api/stats
  exit /b 1
)
echo OK: stats API

echo Testing %API%/api/matches/voting ...
curl -sf %API%/api/matches/voting >nul 2>&1
if errorlevel 1 (
  echo FAIL: /api/matches/voting
  exit /b 1
)
echo OK: spectate API

echo Testing %WEB% ...
curl -sf %WEB% >nul 2>&1
if errorlevel 1 (
  echo WARN: Web not on :3000 ^(may be on another port^)
) else (
  echo OK: web home
)

echo.
echo Smoke test passed. Manual: Lab scan, Arena match, /spectate vote.

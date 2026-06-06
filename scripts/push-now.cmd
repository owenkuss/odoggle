@echo off
REM Push local commits to github.com/owenkuss/odoggle
cd /d "%~dp0.."

echo Commits to push:
git log origin/main..HEAD --oneline 2>nul
if errorlevel 1 git log -5 --oneline

echo.
echo Attempting push...
git push -u origin main

if errorlevel 1 (
  echo.
  echo === Push failed ===
  echo Run:  scripts\setup-github.cmd
  echo Or create a NEW token at github.com/settings/tokens ^(repo scope^)
  echo Then run this script again and paste the token when asked for Password.
  exit /b 1
)

echo.
echo Success: https://github.com/owenkuss/odoggle
echo Next: open LAUNCH.md for Vercel + Fly deploy steps.

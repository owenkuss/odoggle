@echo off
REM One-time GitHub authentication + push for owenkuss/odoggle
cd /d "%~dp0.."

where gh >nul 2>&1
if errorlevel 1 (
  echo Installing GitHub CLI...
  winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
  set "PATH=%PATH%;C:\Program Files\GitHub CLI"
)

where gh >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERROR: GitHub CLI ^(gh^) not found in PATH.
  echo Close this window, open a NEW Command Prompt, and run:
  echo   scripts\setup-github.cmd
  echo.
  echo Or add to PATH: C:\Program Files\GitHub CLI
  exit /b 1
)

echo.
echo Step 1: Log in to GitHub as owenkuss
echo   A browser window will open — approve access.
echo.
gh auth login -h github.com -p https -w
if errorlevel 1 exit /b 1

echo.
echo Step 2: Configure git to use GitHub CLI credentials
gh auth setup-git

echo.
echo Step 3: Push to https://github.com/owenkuss/odoggle
git push -u origin main

if errorlevel 1 (
  echo Push failed. Check errors above.
  exit /b 1
)

echo.
echo Done! https://github.com/owenkuss/odoggle

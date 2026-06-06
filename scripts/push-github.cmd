@echo off
REM Push Odoggle to https://github.com/owenkuss/odoggle
cd /d "%~dp0.."

where git >nul 2>&1 || (echo Install Git: https://git-scm.com & exit /b 1)

git status
echo.
echo Pushing to origin main...
git push -u origin main
if errorlevel 1 (
  echo.
  echo Push failed — authenticate with GitHub:
  echo   winget install GitHub.cli
  echo   gh auth login
  echo   git push -u origin main
  exit /b 1
)
echo.
echo Live at: https://github.com/owenkuss/odoggle

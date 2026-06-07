@echo off
REM One-time: Fly login + GitHub Actions deploy token
cd /d "%~dp0.."

echo.
echo === GitHub Actions Fly deploy setup ===
echo.

call scripts\fly.cmd auth whoami >nul 2>&1
if errorlevel 1 (
  echo Log in to Fly.io first:
  call scripts\fly.cmd auth login
)

echo.
echo Creating deploy token ^(valid ~5 years^)...
call scripts\fly.cmd tokens create deploy -x 43800h
echo.
echo Copy the token above, then paste when prompted:
echo.

where gh >nul 2>&1
if errorlevel 1 set "PATH=%PATH%;C:\Program Files\GitHub CLI"
gh secret set FLY_API_TOKEN --repo owenkuss/odoggle

echo.
echo Done. Trigger deploy from:
echo   https://github.com/owenkuss/odoggle/actions/workflows/deploy.yml
echo.

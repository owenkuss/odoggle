@echo off
REM Odoggle full launch pipeline: build, push, deploy hints
cd /d "%~dp0.."

echo.
echo ========================================
echo   Odoggle launch-all
echo ========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm not found
  exit /b 1
)

echo [1/4] Building...
call npm run build
if errorlevel 1 (
  echo Build failed.
  exit /b 1
)
echo Build OK.
echo.

echo [2/4] Pushing to GitHub...
git push -u origin main
if errorlevel 1 (
  echo.
  echo Push failed — run:  scripts\setup-github.cmd
  echo Or create a PAT at github.com/settings/tokens ^(repo scope^)
  goto deploy
)
echo Push OK: https://github.com/owenkuss/odoggle
echo.

:deploy
echo [3/4] Fly.io server
set "FLYCTL=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Fly-io.flyctl_Microsoft.Winget.Source_8wekyb3d8bbwe\flyctl.exe"
if not exist "%FLYCTL%" set "FLYCTL=fly"
where fly >nul 2>&1
if errorlevel 1 if not exist "%FLYCTL%" (
  echo   flyctl not installed. Run: winget install Fly-io.flyctl
  echo   Then: fly auth login
) else (
  if exist "%FLYCTL%" set "FLY= %FLYCTL%" else set "FLY=fly"
  %FLY% auth whoami >nul 2>&1
  if errorlevel 1 (
    echo   Not logged in. Run: %FLY% auth login
  ) else (
    echo   Logged in. Deploy with:
    echo   %FLY% secrets set WEB_ORIGIN=https://YOUR-VERCEL-URL --app odoggle-server
    echo   %FLY% deploy --config infra/fly.toml --dockerfile infra/Dockerfile
  )
)
echo.

echo [4/4] Vercel web
echo   1. https://vercel.com/new -^> Import owenkuss/odoggle
echo   2. Root Directory: apps/web
echo   3. Env from infra/env.production.web.example
echo   4. Set NEXT_PUBLIC_API_URL to your Fly URL
echo.

echo Full checklist: LAUNCH.md
echo Quick deploy:  scripts\deploy-fly.cmd  then  scripts\deploy-vercel.cmd
echo.

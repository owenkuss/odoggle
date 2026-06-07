@echo off
REM Guided Fly.io deploy for odoggle-server
cd /d "%~dp0.."

echo.
echo === Odoggle Fly.io deploy ===
echo.

call scripts\fly.cmd auth whoami >nul 2>&1
if errorlevel 1 (
  echo Step 1: Log in to Fly.io ^(browser will open^)
  call scripts\fly.cmd auth login
  if errorlevel 1 exit /b 1
)

echo.
echo Step 2: Ensure app exists ^(odoggle-server^)
call scripts\fly.cmd apps list 2>nul | findstr /i "odoggle-server" >nul
if errorlevel 1 (
  echo Creating app odoggle-server...
  call scripts\fly.cmd apps create odoggle-server
)

echo.
set /p WEB_ORIGIN="Step 3: Enter your Vercel URL (e.g. https://odoggle.vercel.app): "
if "%WEB_ORIGIN%"=="" (
  echo WEB_ORIGIN required.
  exit /b 1
)

echo.
set /p SET_DB="Set DATABASE_URL from Neon now? (y/N): "
if /i "%SET_DB%"=="y" (
  set /p DATABASE_URL="Paste DATABASE_URL: "
  call scripts\fly.cmd secrets set DATABASE_URL="%DATABASE_URL%" WEB_ORIGIN="%WEB_ORIGIN%" --app odoggle-server
) else (
  echo Deploying without Postgres ^(in-memory until you add DATABASE_URL^)
  call scripts\fly.cmd secrets set WEB_ORIGIN="%WEB_ORIGIN%" DEV_JURY="true" --app odoggle-server
)

echo.
echo Step 4: Deploying...
call scripts\fly.cmd deploy --config infra/fly.toml --dockerfile infra/Dockerfile --app odoggle-server
if errorlevel 1 exit /b 1

echo.
echo === Done ===
call scripts\fly.cmd status --app odoggle-server
echo.
echo Health: https://odoggle-server.fly.dev/health
echo WebSocket: wss://odoggle-server.fly.dev/signal
echo.
echo Add to Vercel env:
echo   NEXT_PUBLIC_API_URL=https://odoggle-server.fly.dev
echo   NEXT_PUBLIC_WS_URL=wss://odoggle-server.fly.dev/signal
echo.

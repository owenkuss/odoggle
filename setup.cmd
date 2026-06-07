@echo off
REM Odoggle setup for Command Prompt (cmd.exe)
REM Run from anywhere:  C:\Users\owenk\Projects\odoggle\setup.cmd

cd /d "%~dp0"

echo.
echo === Odoggle setup ===
echo Project: %CD%
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm not found. Install Node.js from https://nodejs.org
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

echo Copying env files...
if not exist apps\web mkdir apps\web
if not exist apps\server mkdir apps\server
copy /Y infra\env.web.example apps\web\.env.local >nul
copy /Y infra\.env.example apps\server\.env >nul
echo   apps\web\.env.local
echo   apps\server\.env

where docker >nul 2>&1
if errorlevel 1 (
  echo.
  echo NOTE: Docker not installed — Postgres/Redis URLs left commented in .env
  echo The app runs fine in-memory without Docker.
  echo To add persistence later: install Docker Desktop, then run: npm run db:up
) else (
  echo.
  echo Starting Postgres + Redis...
  call npm run db:up
  if not errorlevel 1 (
    echo Enabling DATABASE_URL and REDIS_URL in apps\server\.env...
    powershell -NoProfile -Command ^
      "$p='apps/server/.env'; $c=Get-Content $p -Raw; if ($c -notmatch 'DATABASE_URL=') { $c += \"`nDATABASE_URL=postgresql://odoggle:odoggle@localhost:5432/odoggle`nREDIS_URL=redis://localhost:6379`n\"; Set-Content $p $c -NoNewline }"
  )
)

echo.
echo Building shared package...
call npm run build -w @odoggle/shared
if errorlevel 1 exit /b 1

echo.
echo === Ready ===
echo Start the app:  dev.cmd
echo   (or npm run dev from Command Prompt — not PowerShell if scripts are blocked)
echo Then open:       http://localhost:3000
echo.

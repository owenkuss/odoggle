@echo off
REM Open Vercel import + print required env vars
cd /d "%~dp0.."

echo.
echo === Odoggle Vercel deploy ===
echo.
echo 1. Import repo at https://vercel.com/new
echo    Repository: owenkuss/odoggle
echo    Root Directory: apps/web
echo.
echo 2. Add these Environment Variables ^(Production^):
echo.
type infra\env.production.web.example
echo.
echo 3. After Fly deploy, set:
echo    NEXT_PUBLIC_API_URL=https://odoggle-server.fly.dev
echo    NEXT_PUBLIC_WS_URL=wss://odoggle-server.fly.dev/signal
echo    NEXT_PUBLIC_URL=https://YOUR-VERCEL-URL.vercel.app
echo    NEXTAUTH_URL=same as NEXT_PUBLIC_URL
echo.
echo 4. Generate NEXTAUTH_SECRET:
powershell -NoProfile -Command "[Convert]::ToBase64String((1..32|ForEach-Object {Get-Random -Max 256})|ForEach-Object {[byte]$_})"
echo.
start https://vercel.com/new/clone?repository-url=https://github.com/owenkuss/odoggle
echo Opened Vercel in browser.
echo.

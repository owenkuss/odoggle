@echo off
REM Open free-tier deploy services + print Porkbun DNS
cd /d "%~dp0.."

echo.
echo ========================================
echo   Odoggle FREE deploy ($0/month)
echo   Domain only: odoggle.com on Porkbun
echo ========================================
echo.
echo Full guide: infra\FREE-DEPLOY.md
echo.

echo --- Porkbun DNS (after Vercel + Render setup) ---
echo.
echo   Type    Host    Value
echo   A       @       76.76.21.21
echo   CNAME   www     cname.vercel-dns.com
echo   CNAME   api     odoggle-api.onrender.com
echo.
echo   ^(Confirm A record in Vercel -^> Domains if different^)
echo.

echo --- Vercel env (Production) ---
type infra\env.production.web.example
echo.

echo Opening deploy dashboards...
start https://vercel.com/new/clone?repository-url=https://github.com/owenkuss/odoggle
timeout /t 2 >nul
start https://dashboard.render.com/select-repo?type=blueprint
timeout /t 2 >nul
start https://console.neon.tech/
timeout /t 2 >nul
start https://porkbun.com/account/domainsSpeedy

echo.
echo Order: Vercel -^> Render Blueprint -^> Neon -^> set Render env -^> Porkbun DNS
echo.

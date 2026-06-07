@echo off
REM Check DNS + HTTP for odoggle.com deployment
echo.
echo === Odoggle deploy check ===
echo.

echo DNS odoggle.com:
nslookup odoggle.com 2>nul | findstr /i "Address Name Alias"
echo.

echo DNS api.odoggle.com:
nslookup api.odoggle.com 2>nul | findstr /i "Address Name Alias"
echo.

echo %DATE% %TIME% | findstr "." >nul
nslookup api.odoggle.com 2>nul | findstr /i "uixie.porkbun.com" >nul
if not errorlevel 1 (
  echo [FAIL] api still points to Porkbun parking. See infra\PORKBUN-DNS.md
) else (
  echo [OK] api not on Porkbun parking
)

echo.
echo HTTP checks:
curl.exe -sf https://api.odoggle.com/health 2>nul
if errorlevel 1 (
  echo [FAIL] https://api.odoggle.com/health
) else (
  echo.
  echo [OK] api.odoggle.com/health
)

curl.exe -sf -o NUL https://odoggle.com 2>nul
if errorlevel 1 (
  echo [FAIL] https://odoggle.com
) else (
  echo [OK] https://odoggle.com
)

curl.exe -sf https://odoggle-api.onrender.com/health 2>nul
if errorlevel 1 (
  echo [FAIL] Render default URL — deploy Blueprint on Render first
) else (
  echo [OK] odoggle-api.onrender.com/health
)

echo.
echo Full fix guide: infra\PORKBUN-DNS.md
echo.

@echo off
REM Resolve flyctl from winget install or PATH
set "FLYCTL="
if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\Fly-io.flyctl_Microsoft.Winget.Source_8wekyb3d8bbwe\flyctl.exe" (
  set "FLYCTL=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Fly-io.flyctl_Microsoft.Winget.Source_8wekyb3d8bbwe\flyctl.exe"
) else (
  where fly >nul 2>&1 && set "FLYCTL=fly"
  where flyctl >nul 2>&1 && set "FLYCTL=flyctl"
)
if not defined FLYCTL (
  echo Installing flyctl...
  winget install --id Fly-io.flyctl -e --accept-source-agreements --accept-package-agreements
  if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\Fly-io.flyctl_Microsoft.Winget.Source_8wekyb3d8bbwe\flyctl.exe" (
    set "FLYCTL=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Fly-io.flyctl_Microsoft.Winget.Source_8wekyb3d8bbwe\flyctl.exe"
  )
)
if not defined FLYCTL (
  echo ERROR: flyctl not found. Install: winget install Fly-io.flyctl
  exit /b 1
)
"%FLYCTL%" %*

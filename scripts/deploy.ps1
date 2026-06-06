# Odoggle deploy helpers — run after GitHub push
param(
    [ValidateSet("vercel", "fly", "all")]
    [string]$Target = "all"
)

$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "Odoggle deploy from $Root" -ForegroundColor Cyan

function Ensure-Gh {
    if (Get-Command gh -ErrorAction SilentlyContinue) { return $true }
    Write-Host "Installing GitHub CLI..." -ForegroundColor Yellow
    winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements 2>$null
    return [bool](Get-Command gh -ErrorAction SilentlyContinue)
}

function Deploy-Vercel {
    if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
        Write-Host "Node/npx required for Vercel deploy" -ForegroundColor Red
        return
    }
    Write-Host "`n=== Vercel (apps/web) ===" -ForegroundColor Green
    Write-Host "1. Go to https://vercel.com/new"
    Write-Host "2. Import owenkuss/odoggle"
    Write-Host "3. Root Directory: apps/web"
    Write-Host "4. Env vars: copy from infra/env.production.web.example"
    Write-Host ""
    $run = Read-Host "Run 'npx vercel' interactively now? (y/N)"
    if ($run -eq "y") {
        Set-Location "$Root\apps\web"
        npx vercel@latest
    }
}

function Deploy-Fly {
    if (-not (Get-Command fly -ErrorAction SilentlyContinue)) {
        Write-Host "Installing flyctl..." -ForegroundColor Yellow
        iwr https://fly.io/install.ps1 -useb | iex
    }
    if (-not (Get-Command fly -ErrorAction SilentlyContinue)) {
        Write-Host "Install flyctl: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Red
        return
    }
    Write-Host "`n=== Fly.io server ===" -ForegroundColor Green
    Write-Host "Set secrets from infra/env.production.server.example"
    Write-Host "  fly secrets set DATABASE_URL=... REDIS_URL=... WEB_ORIGIN=https://your-domain"
    $run = Read-Host "Run 'fly deploy' now? (y/N)"
    if ($run -eq "y") {
        fly deploy --config infra/fly.toml --dockerfile infra/Dockerfile
    }
}

Ensure-Gh | Out-Null
if ($Target -eq "vercel" -or $Target -eq "all") { Deploy-Vercel }
if ($Target -eq "fly" -or $Target -eq "all") { Deploy-Fly }

Write-Host "`nFull guide: infra/DEPLOY.md" -ForegroundColor Cyan

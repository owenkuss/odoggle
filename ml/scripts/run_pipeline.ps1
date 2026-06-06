# Run from repo root: .\ml\scripts\run_pipeline.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..\..
python ml/scripts/run_pipeline.py @args

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$repo = "inspira-legal/builder-setup"
$asset = "setup-windows-x64.exe"
$url = "https://github.com/$repo/releases/latest/download/$asset"
$tmp = "$env:TEMP\$asset"

Write-Host ""
Write-Host "  Builder's Setup" -ForegroundColor White
Write-Host ""
Write-Host "  Baixando..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $tmp

Write-Host "  Solicitando acesso de administrador..." -ForegroundColor Cyan
Start-Process powershell -Verb RunAs -Wait -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command & '$tmp'; pause"
Remove-Item $tmp -ErrorAction SilentlyContinue

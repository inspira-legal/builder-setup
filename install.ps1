$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$repo = "inspira-legal/builder-setup"
$asset = "setup-windows-x64.exe"
$url = "https://github.com/$repo/releases/latest/download/$asset"
$tmp = "$env:TEMP\$asset"

Write-Host "Downloading builder-setup..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $tmp

Write-Host "Running builder-setup..." -ForegroundColor Cyan
Start-Process -FilePath $tmp -Wait

Remove-Item $tmp -ErrorAction SilentlyContinue

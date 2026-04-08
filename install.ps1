# Thin wrapper: downloads the Windows binary from GitHub Releases and runs it.
# Must be run as Administrator.

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This script must be run as Administrator." -ForegroundColor Red
    Write-Host "Right-click PowerShell -> 'Run as Administrator' and try again." -ForegroundColor Yellow
    exit 1
}

$ErrorActionPreference = "Stop"

$repo    = "inspira-legal/builder-setup"
$binary  = "setup-windows-x64.exe"
$url     = "https://github.com/$repo/releases/latest/download/$binary"
$dest    = "$env:TEMP\$binary"

Write-Host "Downloading $binary..."
Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing

Write-Host "Running setup..."
& $dest

Remove-Item $dest -ErrorAction SilentlyContinue

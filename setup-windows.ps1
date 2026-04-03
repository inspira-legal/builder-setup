# Windows Setup Script - Run as Administrator
# Handles WSL install (requires restart) and winget installs
# Re-run after restart to continue where it left off

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This script must be run as Administrator." -ForegroundColor Red
    Write-Host "Right-click PowerShell -> 'Run as Administrator' and try again." -ForegroundColor Yellow
    exit 1
}

$ErrorActionPreference = "Stop"

function Write-Step { param([string]$msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Skip { param([string]$msg) Write-Host "    [SKIP] $msg" -ForegroundColor Yellow }
function Write-Done { param([string]$msg) Write-Host "    [DONE] $msg" -ForegroundColor Green }

# ---- WSL ----
Write-Step "Checking WSL..."
$wslInstalled = $false
try {
    $wslOutput = wsl --status 2>&1
    if ($LASTEXITCODE -eq 0) { $wslInstalled = $true }
} catch {}

if (-not $wslInstalled) {
    Write-Host "    Installing WSL..." -ForegroundColor White
    wsl --install --no-launch
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  WSL installed. RESTART your PC now.  " -ForegroundColor Red
    Write-Host "  Then re-run this script.             " -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 0
} else {
    Write-Skip "WSL already installed"
}

# ---- Ubuntu ----
Write-Step "Checking Ubuntu..."
$ubuntuInstalled = $false
$distros = (wsl -l -q 2>&1) -replace "`0", ""
if ($distros -match "Ubuntu") {
    $ubuntuInstalled = $true
}

if (-not $ubuntuInstalled) {
    Write-Host "    Installing Ubuntu..." -ForegroundColor White
    winget install --id=Canonical.Ubuntu -e --accept-source-agreements --accept-package-agreements
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Yellow
    Write-Host "  Ubuntu installed. Open it from Start Menu to set up   " -ForegroundColor Yellow
    Write-Host "  your username and password, then re-run this script.  " -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Yellow
    exit 0
} else {
    Write-Skip "Ubuntu already installed"
}

# ---- VS Code ----
Write-Step "Checking VS Code..."
$vscodeInstalled = Get-Command code -ErrorAction SilentlyContinue
if (-not $vscodeInstalled) {
    Write-Host "    Installing VS Code..." -ForegroundColor White
    winget install --id=Microsoft.VisualStudioCode -e --accept-source-agreements --accept-package-agreements
    Write-Done "VS Code installed"
} else {
    Write-Skip "VS Code already installed"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Windows setup complete!               " -ForegroundColor Green
Write-Host "  Now open Ubuntu and run:              " -ForegroundColor Green
Write-Host "  curl -fsSL https://raw.githubusercontent.com/inspira-legal/builder-setup/main/setup-wsl.sh | bash" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$repo = "inspira-legal/builder-setup"
$asset = "setup-windows-x64.exe"
$url = "https://github.com/$repo/releases/latest/download/$asset"
$tmp = "$env:TEMP\$asset"

Write-Host ""
Write-Host "  Builder's Setup (slim)" -ForegroundColor White
Write-Host ""
Write-Host "  Baixando..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $tmp

Unblock-File $tmp

# Install elevated (winget needs admin). Env vars don't cross the UAC boundary,
# so set them inside the elevated process. lexflow login is intentionally left
# out here: an elevated process can't open the user's browser, so login runs
# below in this original, non-elevated shell.
Write-Host "  Solicitando acesso de administrador..." -ForegroundColor Cyan
Start-Process powershell -Verb RunAs -Wait -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `$env:SLIM='1'; & '$tmp'; pause"
Remove-Item $tmp -ErrorAction SilentlyContinue

# lexflow was installed into this user's profile during the elevated step, but
# our PATH predates that. Refresh from the registry so `lexflow` resolves.
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User")

$lexflow = (Get-Command lexflow -ErrorAction SilentlyContinue).Source
if (-not $lexflow) {
  $candidate = "$env:USERPROFILE\.local\bin\lexflow.exe"
  if (Test-Path $candidate) { $lexflow = $candidate }
}

if ($lexflow) {
  Write-Host ""
  Write-Host "  lexflow login..." -ForegroundColor Cyan
  & $lexflow login
  if ($LASTEXITCODE -eq 0) {
    Write-Host "  lexflow doctor..." -ForegroundColor Cyan
    & $lexflow doctor
  } else {
    Write-Host "  lexflow login falhou ou foi cancelado; pulando doctor." -ForegroundColor Yellow
  }
} else {
  Write-Host "  lexflow nao encontrado no PATH; rode 'lexflow login' manualmente." -ForegroundColor Yellow
}

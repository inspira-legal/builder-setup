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
# out here: an elevated process can't open the user's browser, so login (and
# wave-cli, which needs it) runs below in this original, non-elevated shell.
Write-Host "  Solicitando acesso de administrador..." -ForegroundColor Cyan
Start-Process powershell -Verb RunAs -Wait -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `$env:SLIM='1'; & '$tmp'; pause"
Remove-Item $tmp -ErrorAction SilentlyContinue

# lexflow was installed during the elevated step (via `uv tool install`), but
# that ran in a separate, elevated process whose PATH never reaches us. uv drops
# the CLI in %USERPROFILE%\.local\bin — the exact dir the lexflow installer puts
# on PATH — so add it here explicitly, then fall back to the full path.
$lexflowBin = "$env:USERPROFILE\.local\bin"
$env:Path = "$lexflowBin;$env:Path"

$lexflow = (Get-Command lexflow -ErrorAction SilentlyContinue).Source
if (-not $lexflow -and (Test-Path "$lexflowBin\lexflow.exe")) {
  $lexflow = "$lexflowBin\lexflow.exe"
}

if ($lexflow) {
  Write-Host ""
  Write-Host "  lexflow login..." -ForegroundColor Cyan
  & $lexflow login
  if ($LASTEXITCODE -eq 0) {
    Write-Host "  lexflow doctor..." -ForegroundColor Cyan
    & $lexflow doctor

    # wave-cli lives on the lexflow git host, so it needs the login above.
    # uv came from winget in the elevated step; reload PATH from the registry
    # so this shell sees it, keeping ~\.local\bin (uv tool bin) in front.
    $env:Path = "$lexflowBin;" + [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
    if (Get-Command uv -ErrorAction SilentlyContinue) {
      Write-Host "  Instalando wave-cli..." -ForegroundColor Cyan
      uv tool install "wave-cli @ git+https://lexflow.internal.inspira.legal/git/inspira/wave-cli.git#subdirectory=cli"
      if ($LASTEXITCODE -ne 0) {
        Write-Host "  Falha ao instalar wave-cli." -ForegroundColor Yellow
      } elseif (Get-Command wave -ErrorAction SilentlyContinue) {
        Write-Host "  wave skill install..." -ForegroundColor Cyan
        wave skill install
        Write-Host "  wave doctor..." -ForegroundColor Cyan
        wave doctor
      } else {
        Write-Host "  wave nao encontrado; rode 'wave skill install' e 'wave doctor' manualmente." -ForegroundColor Yellow
      }
    } else {
      Write-Host "  uv nao encontrado; pulando wave-cli." -ForegroundColor Yellow
    }
  } else {
    Write-Host "  lexflow login falhou ou foi cancelado; pulando doctor e wave-cli." -ForegroundColor Yellow
  }
} else {
  Write-Host "  lexflow nao encontrado no PATH; rode 'lexflow login' manualmente." -ForegroundColor Yellow
}

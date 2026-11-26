$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# install-slim.ps1 sets SLIM=1 and runs this script. LEXFLOW=0 skips login and wave-cli.
$slim = $env:SLIM -eq '1'
$repo = "inspira-legal/builder-setup"
$asset = "setup-windows-x64.exe"
$url = "https://github.com/$repo/releases/latest/download/$asset"
$tmp = "$env:TEMP\$asset"

Write-Host ""
Write-Host "  Builder's Setup$(if ($slim) { ' (slim)' })" -ForegroundColor White
Write-Host ""
Write-Host "  Baixando..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $tmp

Unblock-File $tmp

# Install elevated (winget needs admin). Env vars don't cross the UAC boundary,
# so set them inside the elevated process. lexflow login is intentionally left
# out here: an elevated process can't open the user's browser, so login (and
# wave-cli, which needs it) runs below in this original, non-elevated shell.
Write-Host "  Solicitando acesso de administrador..." -ForegroundColor Cyan
Start-Process powershell -Verb RunAs -Wait -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `$env:SLIM='$env:SLIM'; & '$tmp'; pause"
Remove-Item $tmp -ErrorAction SilentlyContinue

if ($env:LEXFLOW -ne '0') {
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

  # Steps that failed, shown together at the end instead of lost in the log.
  $pending = @()

  # uv came from winget in the elevated step; reload PATH from the registry
  # so this shell sees it, keeping ~\.local\bin (uv tool bin) in front.
  $env:Path = "$lexflowBin;" + [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
  $hasUv = [bool](Get-Command uv -ErrorAction SilentlyContinue)

  # The elevated step skips lexflow when it is already installed, so an old CLI
  # would stick forever (pre-1.2 sessions expire after 1h and break git). Upgrade
  # through uv, not `lexflow self-update`: on Windows a running lexflow.exe can't
  # replace itself ("Acesso negado") and is left half-uninstalled. The CLI repo
  # is readable without credentials, so this works before login.
  if ($lexflow -and $hasUv) {
    Write-Host ""
    Write-Host "  Atualizando lexflow..." -ForegroundColor Cyan
    uv tool install --force --quiet "git+https://lexflow.internal.inspira.legal/git/inspira/cli.git"
    if ($LASTEXITCODE -ne 0) {
      $pending += "lexflow: nao foi possivel atualizar. Rode o setup de novo."
    }
  }

  if ($lexflow) {
    Write-Host ""
    Write-Host "  lexflow login..." -ForegroundColor Cyan
    & $lexflow login
    if ($LASTEXITCODE -eq 0) {
      Write-Host "  lexflow doctor..." -ForegroundColor Cyan
      & $lexflow doctor

      # wave-cli lives on the lexflow git host, which (unlike the CLI repo) needs
      # credentials. `lexflow clone` only wires its credential helper into each
      # clone, and `lexflow login` only refreshes the helper file if it exists,
      # so `uv tool install git+...` has nothing to authenticate with. Mirror
      # what `wave doctor` asks for, with the Windows fixes:
      #   - `lexflow refs <app>` writes the helper file via the CLI itself and
      #     doubles as an access check on the wave repo;
      #   - forward slashes (git can't find the file with backslashes);
      #   - the lexflow tool's own python (python3 is often the Store stub);
      #   - the empty reset entry passed through --% (Windows PowerShell 5.1
      #     drops empty arguments to native commands).
      $gitOk = $false
      $helperFile = "$env:USERPROFILE\.config\lexflow\git-credentials-helper.py"
      $helperKey = 'credential.https://lexflow.internal.inspira.legal.helper'
      Write-Host "  Configurando o git para o host do lexflow..." -ForegroundColor Cyan
      & $lexflow refs inspira/wave-cli | Out-Null
      if ($LASTEXITCODE -ne 0 -or -not (Test-Path $helperFile)) {
        $pending += "wave-cli: sem acesso ao repositorio inspira/wave-cli no lexflow. Confira o login ('lexflow login') e rode o setup de novo."
      } else {
        $values = @(git config --global --get-all $helperKey)
        $gitOk = $values.Count -ge 2 -and $values[0] -eq '' -and [bool]($values | Select-Object -Skip 1 | Where-Object { $_ })
        if (-not $gitOk) {
          $py = $null
          if ($hasUv) {
            $candidate = Join-Path ((uv tool dir) | Out-String).Trim() 'lexflow-deploy-cli\Scripts\python.exe'
            if (Test-Path $candidate) { $py = $candidate }
          }
          if (-not $py) { $py = 'python' }
          $directive = "!'" + $py.Replace('\', '/') + "' '" + $helperFile.Replace('\', '/') + "'"
          git --% config --global --replace-all credential.https://lexflow.internal.inspira.legal.helper ""
          $resetOk = $LASTEXITCODE -eq 0
          git config --global --add $helperKey $directive
          $gitOk = $resetOk -and $LASTEXITCODE -eq 0
          if (-not $gitOk) {
            $pending += "git: nao foi possivel configurar a credencial do lexflow. Rode 'wave doctor' e siga a linha que ele sugerir."
          }
        }
      }

      if (-not $gitOk) {
        # Already reported above.
      } elseif ($hasUv) {
        Write-Host "  Instalando wave-cli..." -ForegroundColor Cyan
        $waveSpec = "wave-cli @ git+https://lexflow.internal.inspira.legal/git/inspira/wave-cli.git#subdirectory=cli"
        uv tool install --upgrade $waveSpec
        if ($LASTEXITCODE -ne 0) {
          # One retry: the lexflow git host returns 500 now and then (wave-cli
          # README), and right after a lexflow upgrade the first git call may
          # still miss auth.
          Write-Host "  Tentando de novo em 10s..." -ForegroundColor Cyan
          Start-Sleep -Seconds 10
          uv tool install --upgrade $waveSpec
        }
        if ($LASTEXITCODE -ne 0) {
          Write-Host "  Falha ao instalar wave-cli." -ForegroundColor Yellow
          $pending += "wave-cli: falhou ao instalar. Rode o setup de novo; se repetir, rode 'wave doctor'."
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
        $pending += "wave-cli: uv nao encontrado. Rode o setup de novo."
      }
    } else {
      Write-Host "  lexflow login falhou ou foi cancelado; pulando doctor e wave-cli." -ForegroundColor Yellow
      $pending += "lexflow: login nao concluido. Rode o setup de novo."
    }
  } else {
    Write-Host "  lexflow nao encontrado no PATH; rode 'lexflow login' manualmente." -ForegroundColor Yellow
    $pending += "lexflow: nao encontrado. Rode o setup de novo."
  }

  if ($pending.Count -gt 0) {
    Write-Host ""
    Write-Host "  Pendencias" -ForegroundColor White
    foreach ($item in $pending) { Write-Host "  ! $item" -ForegroundColor Yellow }
    Write-Host ""
  }
}

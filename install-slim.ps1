# Slim setup: install.ps1 with SLIM=1 (lean AI + lexflow set, then login and wave-cli).
$env:SLIM = '1'
try {
  irm https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.ps1 | iex
} finally {
  Remove-Item Env:SLIM -ErrorAction SilentlyContinue
}

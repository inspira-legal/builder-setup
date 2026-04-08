# builder-setup

Automated dev environment setup. Single binary per platform, distributed via GitHub Releases.

## Quick Start

### Linux / macOS / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.sh | bash
```

### Windows (PowerShell as Administrator)

```powershell
irm https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.ps1 | iex
```

> The install script downloads the binary and launches it with Administrator privileges via UAC prompt.

## What it does

| | Windows | macOS | Linux | WSL |
|--|---------|-------|-------|-----|
| System packages | ⬚ | ✅ | ✅ | ✅ |
| unzip (dep of fnm and uv) | ⬚ | ⬚ | ✅ | ✅ |
| Git | ✅ | ✅ | ✅ | ✅ |
| Docker | ✅ | ✅ | ✅ | ✅ |
| GitHub CLI | ✅ | ✅ | ✅ | ✅ |
| Node.js (fnm) | ✅ | ✅ | ✅ | ✅ |
| Bun | ✅ | ✅ | ✅ | ✅ |
| pnpm | ✅ | ✅ | ✅ | ✅ |
| Go | ✅ | ✅ | ✅ | ✅ |
| uv | ✅ | ✅ | ✅ | ✅ |
| Google Cloud SDK | ✅ | ✅ | ✅ | ✅ |
| VS Code | ✅ | ✅ | ✅ | ✅ |
| Claude Code | ✅ | ✅ | ✅ | ✅ |
| Git config | ✅ | ✅ | ✅ | ✅ |
| WSL config (editor, browser) | ⬚ | ⬚ | ⬚ | ✅ |

> ✅ supported &nbsp; ⬚ not applicable

## Coming soon

- `gh auth login` — GitHub authentication
- `gcloud auth login` — Google Cloud authentication
- Git SSH key setup
- Interactive Claude-guided setup

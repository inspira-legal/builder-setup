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

> Windows requires PowerShell with Administrator privileges. CMD is not supported.

## What it installs

| Tool | Linux | macOS | Windows |
|------|-------|-------|---------|
| System packages (apt/brew) | ✅ | ✅ | ☑️ |
| Git | ☑️ | ☑️ | ✅ |
| Git defaults (`init.defaultBranch main`) | ✅ | ✅ | ✅ |
| Docker | ✅ | ✅ | ✅ |
| GitHub CLI | ✅ | ✅ | ✅ |
| Node.js (fnm) | ✅ | ✅ | ✅ |
| Bun | ✅ | ✅ | ✅ |
| pnpm | ✅ | ✅ | ✅ |
| Go | ✅ | ✅ | ✅ |
| uv | ✅ | ✅ | ✅ |
| Google Cloud SDK | ✅ | ✅ | ✅ |
| VS Code | ✅ | ✅ | ✅ |
| Claude Code | ✅ | ✅ | ✅ |
| WSL post config | ✅ | ⬚ | ⬚ |

> ✅ installs &nbsp; ☑️ already on system &nbsp; ⬚ not applicable

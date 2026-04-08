# builder-setup

Setup automático do ambiente de desenvolvimento. Binário único por plataforma, distribuído via GitHub Releases.

## Início rápido

### Linux / macOS / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.sh | bash
```

### Windows

```powershell
irm https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.ps1 | iex
```

> O script de instalação baixa o binário e executa com privilégios de Administrador via prompt UAC.

## O que faz

| | Windows | macOS | Linux | WSL |
|--|---------|-------|-------|-----|
| System packages | ⬚ | ✅ | ✅ | ✅ |
| unzip (dep de fnm e uv) | ⬚ | ⬚ | ✅ | ✅ |
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

> ✅ suportado &nbsp; ⬚ não se aplica

## Em breve

- `gh auth login` — autenticação GitHub
- `gcloud auth login` — autenticação Google Cloud
- Setup de chave SSH do Git
- Setup interativo guiado por Claude

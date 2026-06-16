# builder-setup

Setup automático do ambiente de desenvolvimento. Binário único por plataforma, distribuído via GitHub Releases.

## Início rápido

Setup completo do ambiente de builder.

### Linux / macOS / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.sh | bash
```

### Windows

```powershell
irm https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.ps1 | iex
```

> O script de instalação baixa o binário e executa com privilégios de Administrador via prompt UAC.

## Slim (AI + lexflow)

Versão enxuta para começar a desenvolver com AI + lexflow: instala só o essencial
(ver coluna **Slim** abaixo) e termina rodando `lexflow login` + `lexflow doctor`.
Bem mais rápido — pula Docker, VS Code, Google Cloud SDK e afins.

### Linux / macOS / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install-slim.sh | bash
```

### Windows

```powershell
irm https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install-slim.ps1 | iex
```

## O que faz

| | Slim | Windows | macOS | Linux | WSL |
|--|------|---------|-------|-------|-----|
| System packages | ✅ | ⬚ | ✅ | ✅ | ✅ |
| Linux dependencies | ✅ | ⬚ | ⬚ | ✅ | ✅ |
| Git | ✅ | ✅ | ✅ | ✅ | ✅ |
| Docker | ⬚ | ✅ | ✅ | ✅ | ✅ |
| GitHub CLI | ✅ | ✅ | ✅ | ✅ | ✅ |
| fnm | ✅ | ✅ | ✅ | ✅ | ✅ |
| Node.js | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bun | ✅ | ✅ | ✅ | ✅ | ✅ |
| pnpm | ⬚ | ✅ | ✅ | ✅ | ✅ |
| uv | ✅ | ✅ | ✅ | ✅ | ✅ |
| pyenv | ⬚ | ⬚ | ✅ | ✅ | ✅ |
| Python | ⬚ | ✅ | ✅ | ✅ | ✅ |
| Google Cloud SDK | ⬚ | ✅ | ✅ | ✅ | ✅ |
| VS Code | ⬚ | ✅ | ✅ | ✅ | ⬚ |
| Claude Code | ⬚ | ✅ | ✅ | ✅ | ✅ |
| lexflow | ✅ | ✅ | ✅ | ✅ | ✅ |
| Git config | ✅ | ✅ | ✅ | ✅ | ✅ |
| fnm profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| pyenv profile | ⬚ | ⬚ | ✅ | ✅ | ✅ |
| WSL config (editor, browser) | ✅ | ⬚ | ⬚ | ⬚ | ✅ |

> ✅ suportado / incluído &nbsp; ⬚ não se aplica / fora do slim

## Avançado

O binário é configurado por variáveis de ambiente — os scripts `install-slim.*`
nada mais são do que `install.*` com elas definidas. Para compor manualmente:

- `SLIM=1` — instala só o conjunto enxuto (coluna **Slim**).
- `LEXFLOW=1` — ao final, roda `lexflow login` seguido de `lexflow doctor`.

```bash
curl -fsSL https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.sh | SLIM=1 bash
```

## Em breve

- `gh auth login` — autenticação GitHub
- `gcloud auth login` — autenticação Google Cloud
- Setup de chave SSH do Git
- Setup interativo guiado por Claude

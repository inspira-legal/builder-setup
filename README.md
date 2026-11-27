# builder-setup

Setup automático do ambiente de desenvolvimento. Binário único por plataforma, distribuído via GitHub Releases.

## Início rápido

Setup completo do ambiente de builder. Termina rodando `lexflow login` + `lexflow doctor`,
depois instala o `wave` CLI com a skill do Claude (`wave skill install`) e roda `wave doctor`.

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
(ver coluna **Slim** abaixo) e termina rodando `lexflow login` + `lexflow doctor`,
depois instala o `wave` CLI com a skill do Claude (`wave skill install`) e roda `wave doctor`.
Bem mais rápido — pula Docker, VS Code, Google Cloud SDK e afins.

### Linux / macOS / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install-slim.sh | bash
```

### Windows

```powershell
irm https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install-slim.ps1 | iex
```

## Atualizar ou consertar

Rode o mesmo comando de novo. O setup é seguro para repetir: atualiza o `lexflow`
(quem instalou antes de outubro/2026 está numa versão cuja sessão vence em 1h),
configura o git para o host do lexflow e reinstala o `wave`. O que não der certo
aparece em **Pendências** no final, com o que fazer.

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
| Claude Desktop | ✅ | ✅ | ✅ | ⬚ | ⬚ |
| Coder CLI (Safira) | ✅ | ✅ | ✅ | ✅ | ✅ |
| lexflow | ✅ | ✅ | ✅ | ✅ | ✅ |
| Git config | ✅ | ✅ | ✅ | ✅ | ✅ |
| fnm profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| pyenv profile | ⬚ | ⬚ | ✅ | ✅ | ✅ |
| WSL config (editor, browser) | ✅ | ⬚ | ⬚ | ⬚ | ✅ |

> ✅ suportado / incluído &nbsp; ⬚ não se aplica / fora do slim

**Safira:** com Claude Desktop e Coder CLI instalados, abra o portal Safira, escolha o projeto
e use **Conectar Claude Desktop**. O portal conduz o `coder login` e o `coder config-ssh` do ambiente.

## Avançado

O binário é configurado por variáveis de ambiente: os scripts `install-slim.*`
nada mais são do que `install.*` com elas definidas. Para compor manualmente:

- `SLIM=1` — instala só o conjunto enxuto (coluna **Slim**).
- `LEXFLOW=1` (padrão nos scripts `install*`) — ao final, atualiza o `lexflow`
  (`uv tool install --force`, o mesmo que o `lexflow self-update` faz), roda `lexflow login`
  e `lexflow doctor`, configura o credential helper do lexflow no git global só para o host
  do lexflow (o repositório do wave exige credencial), instala o `wave` CLI
  (`uv tool install --upgrade`), a skill do Claude, e roda `wave doctor`. `LEXFLOW=0` pula
  essa etapa.

```bash
curl -fsSL https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.sh | SLIM=1 bash
```

## Em breve

- `gh auth login` — autenticação GitHub
- `gcloud auth login` — autenticação Google Cloud
- Setup de chave SSH do Git
- Setup interativo guiado por Claude

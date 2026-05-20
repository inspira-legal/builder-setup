# Builder Setup — Fluxo macOS vs Windows

## Cenário: Primeiro uso (Funcionário não-técnico, sem conta GitHub)

---

## 🍎 macOS (MacBook Air M2)

### Passo 1 — Executar o comando

**O que o usuário vê no Terminal:**

```bash
$ curl -fsSL https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.sh | bash
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  2345  100  2345    0     0   8920      0 --:--:-- --:--:-- --:--:--  8920
Baixando builder-setup para macOS (arm64)...
[████████████████████████████████] 100% - 12MB
```

**Boas-vindas:**

```
  +==========================================================+
  |     BEM-VINDO À JORNADA BUILDER - INSPIRA LEGAL          |
  +==========================================================+
  |  Este é o Passo 1: preparar sua máquina.                  |
  |                                                          |
  |  Depois vêm os próximos passos:                          |
  |    • Conhecer o código e os projetos                     |
  |    • Entender nossos processos de trabalho                 |
  |                                                          |
  |  Não se preocupe: vou guiar você por cada parte.         |
  |  Nada será feito sem que você saiba o que está           |
  |  acontecendo.                                            |
  +----------------------------------------------------------+

  Pressione Enter para iniciar (ou Ctrl+C para sair)...
```

### Passo 2 — Identidade

```
  ▸ Passo 1.1 — Identidade
  Precisamos confirmar sua conta GitHub para conectar você
  aos projetos da Inspira.

  Digite seu username do GitHub (Enter vazio se sem conta):
  (é o @ do seu perfil, ex: leandromedeiros — não é o email)
  > 
```

**Usuário pressiona Enter (não tem conta):**

```
  Você precisa de uma conta GitHub na organização Inspira
  para usar este ambiente. Sem conta agora, você pode:

    [1] Sair e voltar quando tiver conta (recomendado)
    [2] Prosseguir e instalar as ferramentas mesmo assim

  Escolha (1/2): 2

    [AVISO] Prosseguindo sem conta GitHub.
  IMPORTANTE: termine de criar a conta em https://github.com/signup
  e solicite ao HOLANDA a inclusão na organização Inspira
  antes de tentar usar o ambiente.

  Pressione Enter para continuar com a instalação...
```

### Passo 3 — Instalação (progresso)

```
  Verificando ferramentas...
    11 ferramenta(s) para instalar/configurar.

  ▸ Passo 1.2 — Ferramentas
  Instalando stack essencial.

  [1/11] Instalando System packages...
    [FEITO] System packages

  [2/11] Instalando Git...
    [FEITO] Git

  [3/11] Instalando GitHub CLI...
    [FEITO] GitHub CLI

  [4/11] Instalando fnm...
    [FEITO] fnm

  [5/11] Instalando Node.js...
    [FEITO] Node.js

  [6/11] Instalando pnpm...
    [FEITO] pnpm

  [7/11] Instalando uv...
    [FEITO] uv

  [8/11] Instalando Python...
    [FEITO] Python

  [9/11] Instalando Claude Code...
    [FEITO] Claude Code

  [10/11] Instalando Antigravity...
    [AVISO] Antigravity no macOS requer instalação manual via .dmg
    [INFO] Abrindo https://antigravity.google/download no seu navegador...
    [FEITO] Antigravity

  [11/11] Configurando Git config...
    [FEITO] Git config
```

> Safari abre automaticamente em `antigravity.google/download` para a Maria baixar o `.dmg` e arrastar para `Applications`. O setup continua em paralelo — a fase `Verificação` no fim confere se o `.app` realmente apareceu.

### Passo 4 — Verificação

```
  Verificação
  ✔  Git                  /opt/homebrew/bin/git
  ✔  GitHub CLI           /opt/homebrew/bin/gh
  ✔  fnm                  /Users/maria/.local/share/fnm/fnm
  ✔  Node.js              v22.14.0
  ✔  pnpm                 10.8.0
  ✔  uv                   0.6.17
  ✔  Python               3.13.3
  ✔  Claude Code          /Users/maria/.claude/bin/claude
  ✔  Antigravity          /Applications/Antigravity.app
```

### Passo 5 — Resumo final

```
  ========================================
    ✅ Passo 1 da Jornada Builder           
  ========================================

  ⏳ Passo 1.1 — Identidade: pendente
     Conta GitHub: ainda não criada

  ✔ Passo 1.2 — Ferramentas: instaladas e configuradas

  Seu computador está pronto, mas falta sua identidade:

  Ação necessária:
    1. Criar conta em https://github.com/signup
    2. Solicitar ao HOLANDA a inclusão na organização Inspira
    3. Rode builder-setup novamente

  ▸ Próximo passo da jornada: criar conta e conectar
```

### Passo 6 — Re-execução (dias depois, com conta)

```
  $ builder-setup

  +==========================================================+
  |     BEM-VINDO À JORNADA BUILDER - INSPIRA LEGAL          |
  +==========================================================+

  Pressione Enter para iniciar (ou Ctrl+C para sair)...

  ▸ Passo 1.1 — Identidade
  Precisamos confirmar sua conta GitHub...

  Digite seu username do GitHub (Enter vazio se sem conta):
  > mariasilva-adv

    Validando "mariasilva-adv"...
    [FEITO] Conta GitHub confirmada: mariasilva-adv

  Verificando acesso à organização Inspira...
    ✔ Acesso confirmado à organização Inspira

  Verificando ferramentas...
    0 ferramenta(s) para instalar/configurar.

  ========================================
    ✅ Passo 1 da Jornada Builder           
  ========================================

  ✔ Passo 1.1 — Identidade: completo
     Conta: mariasilva-adv  |  Org Inspira: confirmada

  ✔ Passo 1.2 — Ferramentas: já estavam prontas

  Seu computador está pronto e conectado.

  Próximos passos da jornada:
    1. Abra um novo terminal para as mudanças entrarem em vigor
    2. Peça ao seu líder o link do primeiro projeto
    3. Rode no novo terminal:
       git clone git@github.com:inspira-legal/...

  Te vejo no Passo 2 👋
```

---

## 🪟 Windows (Windows 11, PowerShell)

### Passo 1 — Executar o comando

**O que o usuário vê no PowerShell:**

```powershell
PS C:\Users\joao> irm https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.ps1 | iex
Baixando builder-setup para Windows (x64)...
[████████████████████████████████] 100% - 14MB
```

**Boas-vindas:**

```
  +==========================================================+
  |     BEM-VINDO À JORNADA BUILDER - INSPIRA LEGAL          |
  +==========================================================+
  |  Este é o Passo 1: preparar sua máquina.                  |
  |                                                          |
  |  Depois vêm os próximos passos:                          |
  |    • Conhecer o código e os projetos                     |
  |    • Entender nossos processos de trabalho                 |
  |                                                          |
  |  Não se preocupe: vou guiar você por cada parte.         |
  |  Nada será feito sem que você saiba o que está           |
  |  acontecendo.                                            |
  +----------------------------------------------------------+

  Pressione Enter para iniciar (ou Ctrl+C para sair)...
```

### Passo 2 — Identidade (igual ao macOS)

### Passo 3 — Instalação (progresso, com setups Windows)

```
  Verificando ferramentas...
    13 ferramenta(s) para instalar/configurar.

  ▸ Passo 1.2 — Ferramentas
  Instalando stack essencial.

  [1/13] Instalando Git...
    [FEITO] Git

  [2/13] Instalando GitHub CLI...
    [FEITO] GitHub CLI

  [3/13] Instalando fnm...
    [FEITO] fnm

  [4/13] Instalando Node.js...
    [FEITO] Node.js

  [5/13] Instalando pnpm...
    [FEITO] pnpm

  [6/13] Instalando uv...
    [FEITO] uv

  [7/13] Instalando Python...
    [FEITO] Python

  [8/13] Instalando Claude Code...
    [FEITO] Claude Code

  [9/13] Instalando Antigravity...
    [AVISO] Antigravity no Windows requer instalação manual via .exe
    [INFO] Abrindo https://antigravity.google/download no seu navegador...
    [FEITO] Antigravity

  [10/13] Configurando Git config...
    [FEITO] Git config

  [11/13] Configurando fnm PowerShell...
    [FEITO] fnm PowerShell

  [12/13] Configurando fnm Git Bash...
    [FEITO] fnm Git Bash

  [13/13] Configurando fnm CMD...
    [FEITO] fnm CMD
```

> Edge/Chrome abre automaticamente em `antigravity.google/download` para o João baixar e executar o `.exe`. A fase `Verificação` confere se o `Antigravity.exe` apareceu em `%LOCALAPPDATA%\Programs\Antigravity`.

### Passo 4 — Verificação

```
  Verificação
  ✔  Git                  C:\Program Files\Git\bin\git.exe
  ✔  GitHub CLI           C:\Program Files\GitHub CLI\gh.exe
  ✔  fnm                  C:\Users\joao\.fnm\fnm.exe
  ✔  Node.js              v22.14.0
  ✔  pnpm                 10.8.0
  ✔  uv                   0.6.17
  ✔  Python               C:\Users\joao\.local\bin\python.exe
  ✔  Claude Code          C:\Users\joao\.claude\bin\claude.exe
  ✔  Antigravity          C:\Users\joao\AppData\Local\Programs\Antigravity\Antigravity.exe
```

### Passo 5 — Resumo final (igual ao macOS)

```
  ========================================
    ✅ Passo 1 da Jornada Builder           
  ========================================

  ⏳ Passo 1.1 — Identidade: pendente
     Conta GitHub: ainda não criada

  ✔ Passo 1.2 — Ferramentas: instaladas e configuradas

  Seu computador está pronto, mas falta sua identidade:

  Ação necessária:
    1. Criar conta em https://github.com/signup
    2. Solicitar ao HOLANDA a inclusão na organização Inspira
    3. Rode builder-setup novamente

  ▸ Próximo passo da jornada: criar conta e conectar
```

### Passo 6 — Re-execução (igual ao macOS)

```
  PS C:\Users\joao> builder-setup
  # (mesmo fluxo de verificação rápida, sem reinstalar nada)
```

---

## 📊 Comparativo macOS vs Windows

| Aspecto | macOS | Windows |
|---------|-------|---------|
| **Comando inicial** | `curl ... \| bash` | `irm ... \| iex` |
| **System packages** | Homebrew | ⬚ Não aplica |
| **fnm profile** | `.zshrc` | PowerShell + Git Bash + CMD |
| **Linux dependencies** | ⬚ Não aplica | ⬚ Não aplica |
| **Python path** | `python3` | `python` (via uv) |
| **WSL config** | ⬚ Não aplica | ⬚ Não aplica (só se WSL) |
| **Antigravity** | Download `.dmg` manual (navegador abre) | Download `.exe` manual (navegador abre) |
| **Editor padrão** | Antigravity (entrada Jornada Builder) | Antigravity (entrada Jornada Builder) |
| **Novo terminal** | "Abra um novo Terminal" | "Abra novo PowerShell/Git Bash" |

---

## 🎯 Cenários específicos por perfil

### Perfil 1: Advogado (não-técnico, macOS)
- ❌ Sem conta GitHub ainda
- ✅ Instala: Git, GitHub CLI, fnm, Node.js, pnpm, uv, Python, Claude Code, Antigravity
- 📋 Mensagem final: "Crie conta no GitHub e volte"

### Perfil 2: Produto (semi-técnico, macOS)
- ✅ Tem conta GitHub
- ✅ Instala: stack essencial completo (mesmo conjunto)
- 📋 Mensagem final: "Tudo pronto! Clone o projeto"

### Perfil 3: DevOps (técnico, Windows + WSL)
- ✅ Tem conta GitHub
- 🔧 Roda com `BUILDER_PROFILE=platform` no comando inicial
- ✅ Instala TUDO: stack essencial + Docker + Google Cloud SDK
- 🐧 WSL config automático (editor + browser)
- 📋 Mensagem final: "Tudo pronto! Abra novo terminal"

---

## ✅ Cobertura completa confirmada

| Item | macOS | Windows | Linux | WSL |
|------|-------|---------|-------|-----|
| Identidade GitHub | ✅ | ✅ | ✅ | ✅ |
| Stack essencial | ✅ | ✅ | ✅ | ✅ |
| Antigravity (core, novato) | 🌐 .dmg | 🌐 .exe | ✅ APT | ✅ APT |
| Stack Plataforma (`BUILDER_PROFILE=platform`) | ✅ | ✅ | ✅ | ✅ |
| Setups específicos | .zshrc | PS + Git Bash + CMD | .bashrc | WSL config |
| Verificação automática | ✅ | ✅ | ✅ | ✅ |
| Re-execução rápida | ✅ | ✅ | ✅ | ✅ |
| Mensagens contextualizadas | ✅ | ✅ | ✅ | ✅ |

**Tudo coberto!** 🚀

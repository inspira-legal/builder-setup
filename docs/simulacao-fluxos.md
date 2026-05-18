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

### Passo 3 — Pergunta sobre o time

```
  Pergunta rápida: você faz parte do time de Plataforma
  (infraestrutura, DevOps, ou desenvolvimento de backend)?

  (s)im / (n)ão: n

  Verificando ferramentas...
    8 ferramenta(s) para instalar/configurar.

  ▸ Passo 1.2 — Ferramentas
  Instalando stack essencial para todos os setores.
```

### Passo 4 — Instalação (progresso)

```
  [1/10] Instalando System packages...
    [FEITO] System packages

  [2/10] Instalando Git...
    [FEITO] Git

  [3/10] Instalando GitHub CLI...
    [FEITO] GitHub CLI

  [4/10] Instalando fnm...
    [FEITO] fnm

  [5/10] Instalando Node.js...
    [FEITO] Node.js

  [6/10] Instalando pnpm...
    [FEITO] pnpm

  [7/10] Instalando uv...
    [FEITO] uv

  [8/10] Instalando Python...
    [FEITO] Python

  [9/10] Configurando Git config...
    [FEITO] Git config

  [10/10] Configurando fnm profile...
    [FEITO] fnm profile
```

### Passo 5 — Verificação

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
```

### Passo 6 — Resumo final

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

### Passo 7 — Re-execução (dias depois, com conta)

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

### Antigravity no macOS (instalação manual)

**Se o usuário escolher time de Plataforma = sim:**

```
  [8/11] Instalando Antigravity...
    [AVISO] Antigravity no macOS requer instalação manual via .dmg
    [INFO] Abrindo https://antigravity.google/download no seu navegador...

  # Safari abre automaticamente
  # Usuário baixa o .dmg, arrasta para Applications
  # Pronto!
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

### Passo 3 — Pergunta sobre o time

```
  Pergunta rápida: você faz parte do time de Plataforma
  (infraestrutura, DevOps, ou desenvolvimento de backend)?

  (s)im / (n)ão: n

  Verificando ferramentas...
    8 ferramenta(s) para instalar/configurar.

  ▸ Passo 1.2 — Ferramentas
  Instalando stack essencial para todos os setores.
```

### Passo 4 — Instalação (progresso, com setups Windows)

```
  [1/11] Instalando System packages...
    (pulado — não se aplica no Windows)

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

  [9/11] Configurando Git config...
    [FEITO] Git config

  [10/11] Configurando fnm PowerShell...
    [FEITO] fnm PowerShell

  [11/11] Configurando fnm CMD...
    [FEITO] fnm CMD
```

### Passo 5 — Verificação

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
```

### Passo 6 — Resumo final (igual ao macOS)

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

### Passo 7 — Re-execução (igual ao macOS)

```
  PS C:\Users\joao> builder-setup
  # (mesmo fluxo de verificação rápida, sem reinstalar nada)
```

### Antigravity no Windows (instalação manual)

**Se o usuário escolher time de Plataforma = sim:**

```
  [9/12] Instalando Antigravity...
    [AVISO] Antigravity no Windows requer instalação manual via .exe
    [INFO] Abrindo https://antigravity.google/download no seu navegador...

  # Edge/Chrome abre automaticamente
  # Usuário baixa o .exe, executa o instalador
  # Pronto!
```

---

## 📊 Comparativo macOS vs Windows

| Aspecto | macOS | Windows |
|---------|-------|---------|
| **Comando inicial** | `curl ... \| bash` | `irm ... \| iex` |
| **System packages** | Homebrew | ⬚ Não aplica |
| **fnm profile** | `.zshrc` | PowerShell + CMD |
| **Linux dependencies** | ⬚ Não aplica | ⬚ Não aplica |
| **Python path** | `python3` | `python` (via uv) |
| **WSL config** | ⬚ Não aplica | ⬚ Não aplica (só se WSL) |
| **Antigravity** | Download .dmg manual | Download .exe manual |
| **Editor padrão** | code (se VS Code instalado) | code (se VS Code instalado) |
| **Novo terminal** | "Abra um novo Terminal" | "Abra novo PowerShell/Git Bash" |

---

## 🎯 Cenários específicos por perfil

### Perfil 1: Advogado (não-técnico, macOS)
- ❌ Não é Plataforma
- ❌ Sem conta GitHub
- ✅ Instala: Git, GitHub CLI, fnm, Node.js, pnpm, uv, Python, Claude Code
- ⏳ Pula: Docker, GCloud SDK, Antigravity
- 📋 Mensagem final: "Crie conta no GitHub e volte"

### Perfil 2: DevOps (técnico, Windows + WSL)
- ✅ É Plataforma
- ✅ Tem conta GitHub
- ✅ Instala TUDO: core + Docker + GCloud SDK + Antigravity
- 🐧 WSL config automático (editor + browser)
- 📋 Mensagem final: "Tudo pronto! Abra novo terminal"

### Perfil 3: Produto (semi-técnico, macOS)
- ❌ Não é Plataforma
- ✅ Tem conta GitHub
- ✅ Instala: core stack
- ⏳ Pula: Docker, GCloud SDK
- 📋 Mensagem final: "Tudo pronto! Clone o projeto"

---

## ✅ Cobertura completa confirmada

| Item | macOS | Windows | Linux | WSL |
|------|-------|---------|-------|-----|
| Identidade GitHub | ✅ | ✅ | ✅ | ✅ |
| Pergunta Plataforma | ✅ | ✅ | ✅ | ✅ |
| Core installs | ✅ | ✅ | ✅ | ✅ |
| Platform installs | ✅ | ✅ | ✅ | ✅ |
| Setups específicos | .zshrc | PS/CMD | .bashrc | WSL config |
| Verificação automática | ✅ | ✅ | ✅ | ✅ |
| Antigravity Linux (APT) | ⬚ | ⬚ | ✅ | ⬚ |
| Antigravity mac/Win (manual) | ✅ | ✅ | ⬚ | ⬚ |
| Re-execução rápida | ✅ | ✅ | ✅ | ✅ |
| Mensagens contextualizadas | ✅ | ✅ | ✅ | ✅ |

**Tudo coberto!** 🚀

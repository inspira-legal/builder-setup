# Builder Setup — Simulação Rodada 2

> **Escopo:** caminhos parciais, edge cases, falhas reais e perfil Plataforma via `BUILDER_PROFILE=platform`.
> **Complementa:** [`simulacao-fluxos.md`](./simulacao-fluxos.md) (cobria o feliz/sem conta no macOS e Windows).
> **Baseado em:** código atual da branch `feat/stack-cross-setor` (HEAD), com stack enxuto: Antigravity virou core, Docker e Google Cloud SDK ficaram opt-in via env var, pergunta interativa de Plataforma foi removida.

---

## Cenário B — Conta GitHub existe, mas ainda não está na org Inspira

> O cenário mais comum no onboarding real: o(a) funcionário(a) criou a conta no signup, **mas ainda não foi adicionado(a) à organização `inspira-legal`**.

### B.1 — Primeira execução (macOS, gh ainda não instalado)

```
  ▸ Passo 1.1 — Identidade
  Precisamos confirmar sua conta GitHub para conectar você
  aos projetos da Inspira.

  Digite seu username do GitHub (Enter vazio se sem conta):
  (é o @ do seu perfil, ex: leandromedeiros — não é o email)
  > carolinabraga-adv

    Validando "carolinabraga-adv"...
    [FEITO] Conta GitHub confirmada: carolinabraga-adv

  Verificando acesso à organização Inspira...
  ⚠  Não consigo verificar automaticamente se você está na organização.
     (isso é normal antes de instalar as ferramentas)

  Ação necessária: você já solicitou ao HOLANDA a inclusão
  na organização Inspira no GitHub?

  (s)im / (n)ão: n

  Sem acesso à organização, você não conseguirá trabalhar
  nos projetos da Inspira.

  Você pode:
    [1] Resolver agora (recomendado)
    [2] Instalar ferramentas primeiro e resolver depois

  Escolha (1/2): 1

  Envie uma mensagem para HOLANDA agora:
    "Olá! Meu username no GitHub é carolinabraga-adv."
    "Poderia me incluir na organização inspira-legal?"

  ⏎ Pressione Enter quando tiver enviado...

  Salvando seu progresso. Você pode continuar instalando
  as ferramentas agora. Rode o builder-setup novamente depois
  que HOLANDA confirmar sua inclusão.
```

### B.2 — Pós-instalação, re-verificação automática silenciosa

> Bug #7 da review da @athenabriana corrigido: depois de instalar o `gh`, o setup tenta confirmar a org **sem perguntar nada ao usuário**.

```
  Verificação
  ✔  Git                  /opt/homebrew/bin/git
  ✔  GitHub CLI           /opt/homebrew/bin/gh
  ✔  fnm                  /Users/carolina/.local/share/fnm/fnm
  ...

    [FEITO] Acesso à organização Inspira confirmado automaticamente após instalação do gh
```

**Bastidor (`src/setup.ts:407-417`):**
- `identity.username` está definido
- `identity.orgVerified === false`
- `Bun.which("gh") !== null` agora retorna verdade
- Roda `checkGitHubOrgMembership()` em modo silencioso
- Se vier `{ status: "member" }`, atualiza config e mostra a linha de sucesso

> **Pré-requisito:** o `gh` precisa estar autenticado (`gh auth login` rodou) para esse caminho funcionar. Hoje o setup não faz auth automático (listado em "🚀 Em breve"). Em primeira execução, esse re-check provavelmente cai em `unverified` por falta de auth — o checkpoint final mostra `identityPartial`.

### B.3 — Resumo final (identidade parcial)

```
  ========================================
    ✅ Passo 1 da Jornada Builder           
  ========================================

  ⏳ Passo 1.1 — Identidade: parcial
     Conta: carolinabraga-adv  |  Org Inspira: pendente

  ✔ Passo 1.2 — Ferramentas: instaladas e configuradas

  Seu computador está pronto, mas falta uma chave:

  Ação necessária:
    1. Confirme com HOLANDA que você foi incluído(a) na
       organização inspira-legal no GitHub
    2. Rode builder-setup novamente para verificar

  ▸ Próximo passo da jornada: concluir sua identidade
```

### B.4 — Re-execução 2 dias depois (HOLANDA confirmou)

```
  $ builder-setup

  +==========================================================+
  |     BEM-VINDO À JORNADA BUILDER - INSPIRA LEGAL          |
  +==========================================================+

  Pressione Enter para iniciar (ou Ctrl+C para sair)...

  ▸ Passo 1.1 — Identidade
  Precisamos confirmar sua conta GitHub...
    ✔ Conta GitHub: carolinabraga-adv

  Verificando acesso à organização Inspira...
    [FEITO] Acesso confirmado à organização Inspira

  Pergunta rápida: você faz parte do time de Plataforma...
  (s)im / (n)ão: n

  Verificando ferramentas...
    0 ferramenta(s) para instalar/configurar.

  ========================================
    ✅ Passo 1 da Jornada Builder           
  ========================================

  ✔ Passo 1.1 — Identidade: completo
     Conta: carolinabraga-adv  |  Org Inspira: confirmada

  ✔ Passo 1.2 — Ferramentas: já estavam prontas

  Seu computador está pronto e conectado.

  Próximos passos da jornada:
    1. Abra um novo terminal para as mudanças entrarem em vigor
    2. Peça ao seu líder o link do primeiro projeto
    3. Rode no novo terminal:
       git clone git@github.com:inspira-legal/...

  Te vejo no Passo 2 👋
```

**Caminho do código:**
- `loadConfig()` retorna `{ githubUsername: "carolinabraga-adv", githubOrgPending: true, githubOrgVerified: false }`
- `config.githubUsername && !config.githubOrgVerified` é true → entra no path "salvo + org não verificada"
- `verifyOrgAccess(username)` é chamado, `gh` está instalado e autenticado → retorna `{ verified: true }`
- Tudo flui sem prompt extra

---

## Cenário C — Plataforma no WSL (Ubuntu dentro do Windows)

> Perfil: DevOps com Windows 11 + WSL2 Ubuntu. Quer rodar Docker, gcloud, e que o editor abra no Windows.
>
> **Trigger:** roda o comando com `BUILDER_PROFILE=platform` na frente. Sem essa variável, Docker e Google Cloud SDK são pulados.

### C.1 — Comando inicial com env var + sudo upfront

```
  $ BUILDER_PROFILE=platform curl -fsSL https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.sh | bash
  Downloading setup-linux-x64...
  Running setup...

  +==========================================================+
  |     BEM-VINDO À JORNADA BUILDER - INSPIRA LEGAL          |
  +==========================================================+
  ...
  Pressione Enter para iniciar (ou Ctrl+C para sair)...

  ▸ Passo 1.1 — Identidade
  ...
  > rafaelnunes-eng

    [FEITO] Conta GitHub confirmada: rafaelnunes-eng
    [FEITO] Acesso confirmado à organização Inspira

    Este script precisa de acesso sudo para instalar pacotes.
  [sudo] password for rafael: ●●●●●●●●●●

  Verificando ferramentas...
    14 ferramenta(s) para instalar/configurar.

  ▸ Passo 1.2 — Ferramentas
  Instalando stack completo (essencial + Plataforma).
```

> ⚠ **Item #10 da review da Athena** (em aberto): o `sudo -v` aparece **depois** dos prompts de identidade. Se o usuário sair do terminal entre o welcome e o sudo, o setup trava em silêncio aguardando a senha.

### C.2 — Instalação Plataforma (Antigravity já no core, Docker + GCloud adicionados)

```
  [1/14] Instalando System packages...
    [FEITO] System packages

  [2/14] Instalando Linux dependencies...
    Reading package lists... Done
    Building dependency tree... Done
    The following NEW packages will be installed:
      build-essential libssl-dev zlib1g-dev libbz2-dev
      libreadline-dev libsqlite3-dev libncursesw5-dev
      ...
    [FEITO] Linux dependencies

  [3/14] Instalando Git...
    [FEITO] Git

  [4/14] Instalando GitHub CLI...
    Adicionando keyring de cli.github.com...
    [FEITO] GitHub CLI

  ...

  [10/14] Instalando Claude Code...
    [FEITO] Claude Code

  [11/14] Instalando Antigravity...
    Adicionando keyring de us-central1-apt.pkg.dev...
    Reading package lists... Done
    The following NEW packages will be installed: antigravity
    [FEITO] Antigravity

  [12/14] Instalando Docker...
    [FEITO] systemd habilitado em wsl.conf
    Adicionando keyring de download.docker.com...
    Instalando docker-ce, docker-ce-cli, containerd.io,
    docker-buildx-plugin, docker-compose-plugin...
    Adicionando rafael ao grupo docker...
    [FEITO] Docker

  [13/14] Instalando Google Cloud SDK...
    [FEITO] Google Cloud SDK

  [14/14] Configurando WSL config...
    [FEITO] BROWSER definido como Chrome
    Atualizado /home/rafael/.bashrc
    [FEITO] WSL config
```

### C.3 — Resumo + shutdown automático do WSL

```
  Verificação
  ✔  Git                  /usr/bin/git
  ✔  GitHub CLI           /usr/bin/gh
  ✔  fnm                  /home/rafael/.local/share/fnm/fnm
  ✔  Node.js              v22.14.0
  ✔  pnpm                 10.8.0
  ✔  uv                   0.6.17
  ✔  Python               /home/rafael/.local/share/uv/python/...
  ✔  Claude Code          /home/rafael/.claude/bin/claude
  ✔  Docker               /usr/bin/docker
  ✔  Google Cloud SDK     /usr/bin/gcloud
  ✔  Antigravity          /usr/bin/antigravity

  ========================================
    ✅ Passo 1 da Jornada Builder           
  ========================================

  ✔ Passo 1.1 — Identidade: completo
     Conta: rafaelnunes-eng  |  Org Inspira: confirmada

  ✔ Passo 1.2 — Ferramentas: instaladas e configuradas

  Seu computador está pronto e conectado.

  Próximos passos da jornada:
    1. Abra o Ubuntu novamente (vou reiniciar o WSL agora)
    2. Peça ao seu líder o link do primeiro projeto
    3. Rode no novo terminal:
       git clone git@github.com:inspira-legal/...

  Te vejo no Passo 2 👋

  # 3 segundos depois...
  # PowerShell host volta com mensagem do WSL:
  The operation completed successfully.
```

**Bastidor (`src/setup.ts:530-533`):**
- `wsl === true` (variável `WSL_DISTRO_NAME` está setada)
- `Bun.sleep(3000)` dá tempo da mensagem aparecer
- `wsl.exe --shutdown` reinicia o subsistema pra que `systemd=true` (que o Docker precisa) entre em vigor

---

## Cenário D — Edge cases e falhas reais

### D.1 — Username digitado não existe (404)

```
  Digite seu username do GitHub (Enter vazio se sem conta):
  (é o @ do seu perfil, ex: leandromedeiros — não é o email)
  > marria_silva.dev

    Validando "marria_silva.dev"...
    [AVISO] Usuário "marria_silva.dev" não encontrado no GitHub.
    Encontre seu username em https://github.com/settings/profile

  Digite seu username do GitHub (Enter vazio se sem conta):
  (é o @ do seu perfil, ex: leandromedeiros — não é o email)
  > maria-silva

    Validando "maria-silva"...
    [FEITO] Conta GitHub confirmada: maria-silva
```

**Caminho do código:**
- `checkGitHubUser("marria_silva.dev")` → 404 → `{ status: "not_found" }`
- Loop interno do `while(true)` em `ensureGitHubAccount` faz `continue` → re-pergunta
- Próxima tentativa: 200 → `{ status: "exists", canonical: "maria-silva" }`
- Username canônico (case-correct) é salvo, não o que foi digitado

### D.2 — GitHub API instável / rate limit / NAT corporativo

```
  Digite seu username do GitHub (Enter vazio se sem conta):
  > leandromedeiros

    Validando "leandromedeiros"...
    [AVISO] Não consegui validar com o GitHub (HTTP 403 (rate limit ou acesso negado)).
    Prosseguir mesmo assim com "leandromedeiros"? (s/N): s
    [FEITO] Conta GitHub aceita sem validação: leandromedeiros
```

> ⚠ **Item #14 da review da Athena** (em aberto): a mensagem mistura "rate limit" e "acesso negado" sem distinguir. Em NAT corporativo compartilhado o `403` quase sempre é rate limit (60/h sem token). Solução proposta: parsear `X-RateLimit-Remaining: 0` e dar mensagem específica.

### D.3 — Antigravity macOS: usuário fecha o navegador sem instalar

```
  [11/13] Instalando Antigravity...
    [AVISO] Antigravity no macOS requer instalação manual via .dmg
    [INFO] Abrindo https://antigravity.google/download no seu navegador...
    [FEITO] Antigravity

  # ... continua para próxima ferramenta ...

  Verificação
  ✔  Git                  /opt/homebrew/bin/git
  ...
  ✘  Antigravity

  ========================================
    Passo 1 INCOMPLETO                     
  ========================================

  ✔ Passo 1.1 — Identidade: completo
     Conta: rafaelnunes-eng  |  Org Inspira: confirmada

    [AVISO] Desinstale Antigravity e rode builder-setup novamente.

  Você está na Jornada Builder, mas precisa resolver isso
  antes de seguir para os próximos passos.
```

> ⚠ **Problema conhecido:** o handler do Antigravity em `src/tools.ts:342-354` marca `[FEITO]` mesmo se o usuário não clicou em "instalar" no `.dmg`. Só depois, na fase `verify`, o `✘` aparece — gera a sensação contraditória de "tudo certo… ah não, falhou". E a mensagem `"Desinstale Antigravity e rode builder-setup novamente"` é incorreta: o que faltou foi **instalar**, não desinstalar. Fix proposto: adicionar `await pause("Quando terminar a instalação...")` no handler e tornar a mensagem de erro condicional ao tipo de tool (auto vs manual).

### D.4 — winget falha por rede

```
  [4/10] Instalando GitHub CLI...

  Encountered an error while processing the request: 0x80072EE7
    [ERRO]  GitHub CLI

  [5/10] Instalando fnm...
  ...
```

```
  ========================================
    Passo 1 INCOMPLETO                     
  ========================================

  ✔ Passo 1.1 — Identidade: completo
     Conta: rafaelnunes-eng  |  Org Inspira: confirmada

    Algumas ferramentas falharam:
    - GitHub CLI
      Encountered an error while processing the request: 0x80072EE7

    Corrija os problemas acima e rode builder-setup novamente.
```

**O que faltou:**
- Sem retry com backoff (item #13 do plano: 3 tentativas com 1s/3s/9s)
- Sem tradução do código `0x80072EE7` → "Não consegui falar com o servidor (verifique sua conexão)"
- Sem log cru salvo em `~/.builder-setup/error.log` pro time de suporte ver depois

---

## Cenário E — Sub-fluxos de identidade

### E.1 — `gh` está instalado mas sem auth (`gh auth status` falha)

> Caminho real para quem rodou o setup uma vez, instalou ferramentas, mas ainda não rodou `gh auth login`.

```
  $ builder-setup

  ▸ Passo 1.1 — Identidade
    ✔ Conta GitHub: leandromedeiros

  Verificando acesso à organização Inspira...
  ⚠  A verificação automática falhou: gh CLI não autenticado.
     Vamos prosseguir com a verificação manual.

  Ação necessária: você já solicitou ao HOLANDA a inclusão
  na organização Inspira no GitHub?

  (s)im / (n)ão: s

    ✔ Anotado. Vou confiar na sua palavra por enquanto.
    Assim que o gh CLI estiver instalado, tentarei confirmar
    automaticamente na próxima execução.
```

**Caminho:**
- `Bun.which("gh") !== null` (gh existe no PATH)
- `checkGitHubOrgMembership()` → spawn `gh api orgs/inspira-legal/memberships/@me` → exit ≠ 0
- stderr contém `"not logged into any GitHub host"`
- Retorna `{ status: "unverified", reason: "gh CLI não autenticado" }`
- Cai no fallback manual ("(s)im / (n)ão")

> ⚠ A mensagem "Assim que o gh CLI estiver instalado, tentarei confirmar automaticamente na próxima execução" **mente** nesse caso: o `gh` JÁ está instalado, falta é o `auth`. Fix proposto: diferenciar os textos quando `reason === "gh CLI não autenticado"` e instruir `gh auth login`.

### E.2 — Org bloqueada por SSO enforcement

```
  Verificando acesso à organização Inspira...
  ⚠  A verificação automática falhou: token sem escopo read:org ou SSO pendente.
     Vamos prosseguir com a verificação manual.
```

**Caminho:**
- `gh api` retorna exit ≠ 0
- stderr contém `"Resource protected by organization SAML enforcement"`
- Retorna `{ status: "unverified", reason: "token sem escopo read:org ou SSO pendente" }`

> Este caso é o que o Bug #6 da Athena resolveu: antes da correção, esse usuário seria **mandado pro HOLANDA por engano** ("você não faz parte da org" — falso!). Agora a mensagem é honesta e o usuário pode resolver via `gh auth refresh -s read:org` ou autorizando SSO no browser.

### E.3 — Usuário diz "não" e depois muda de ideia (sub-prompt 1/2)

```
  Ação necessária: você já solicitou ao HOLANDA a inclusão...
  (s)im / (n)ão: n

  Sem acesso à organização, você não conseguirá trabalhar...

  Você pode:
    [1] Resolver agora (recomendado)
    [2] Instalar ferramentas primeiro e resolver depois

  Escolha (1/2): 3

  Resposta inválida. Digite 1 ou 2.

  Você pode:
    [1] Resolver agora (recomendado)
    [2] Instalar ferramentas primeiro e resolver depois

  Escolha (1/2): 2

  Entendido. Vou preparar seu computador agora.
  Lembrete: sem acesso à organização, você ainda não
  conseguirá clonar os projetos, mas o computador ficará
  pronto para quando HOLANDA liberar.
```

**Caminho:**
- Bug #4 da Athena resolvido: o sub-prompt `[1]/[2]` tem **seu próprio loop interno** (`while(true)`). Antes, qualquer valor inválido jogava o usuário de volta no prompt anterior (`s/n/v`).

---

## Cobertura desta rodada

| Caminho | Cenário |
|---|---|
| Conta existe + sem org + Resolver agora | B.1 |
| Re-verificação silenciosa pós-`gh` | B.2, B.4 |
| Checkpoint `identityPartial` | B.3 |
| Plataforma WSL via `BUILDER_PROFILE=platform` + Docker | C.1–C.3 |
| `wsl.exe --shutdown` automático | C.3 |
| Antigravity APT no Linux (agora no core) | C.2 |
| Username inválido (404) | D.1 |
| Rate limit / NAT corporativo (403) | D.2 |
| Antigravity manual abandonado → verify catch | D.3 |
| winget falha por rede | D.4 |
| `gh` instalado mas sem `auth` | E.1 |
| Org com SSO enforcement | E.2 |
| Sub-prompt 1/2 com input inválido | E.3 |

## Lacunas conhecidas (não simuladas aqui)

- **CMD puro no Windows** (`fnm CMD` + AutoRun do Registry) — handler escreve em `HKCU\Software\Microsoft\Command Processor` que EDRs heurísticos flagam como persistência de malware
- **`.exe` baixado direto do Releases** (sem `irm | iex`) — bloqueio pelo SmartScreen na primeira execução (binário não-assinado)
- **Migração de provedor de Git** — hoje tudo aponta para `inspira-legal`, sem variável de ambiente pra trocar
- **Interrupção no meio do setup** (Ctrl+C) — comportamento atual: rollback parcial não existe; próxima execução pula o que terminou via `shouldSkip`

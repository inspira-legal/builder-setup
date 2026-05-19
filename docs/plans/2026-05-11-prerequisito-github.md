# Pré-requisito GitHub no Setup - Plano de Implementação

**Objetivo:** Adicionar etapa de pré-requisito no início do `builder-setup` que apresenta o propósito da ferramenta, alerta sobre a necessidade de conta no GitHub na organização Inspira, e coleta/valida o username. Sem conta, o usuário escolhe: sair ou prosseguir com instalação das ferramentas (com aviso para regularizar depois).

**Arquitetura:** Etapa de "boas-vindas + pré-requisitos" executada antes de qualquer instalação ou solicitação de `sudo`. Quadro ASCII puro (compat universal), pausa explícita, prompt único para username, fallback amigável quando sem conta. Username persistido em `~/.builder-setup/config.json` para reutilização em etapas futuras.

**Stack:** TypeScript, Bun runtime, `node:readline/promises`, `fetch` nativo.

**Decisões de design (consolidadas):**

- 3 arquivos no projeto (não criar `prerequisites.ts` — orquestração fica em `setup.ts`)
- Moldura do quadro em ASCII puro; conteúdo mantém acentos pt-BR
- Sem conta GitHub → usuário escolhe `[1] sair` ou `[2] prosseguir com aviso`
- Validação distingue **404** (não existe) de **erro de rede/rate-limit** (segue com confirmação)
- Contador `[X/Y]` real, com pré-flight que conta tools que vão executar
- Cabeçalho técnico (Plataforma/Arch/Profile) movido para o **fim** do setup como debug info
- Foco em **Windows e macOS** — Linux é instalação sob demanda, não foco de UX

---

## Visão geral do fluxo

```
+==========================================================+
|          BUILDER'S SETUP - INSPIRA LEGAL                 |
+==========================================================+
|  Este script prepara seu ambiente instalando Git,        |
|  Docker, Node, Bun, Python e demais ferramentas.         |
|                                                          |
|  IMPORTANTE: é necessário ter uma conta no GitHub        |
|  incluída na organização Inspira para prosseguir.        |
|                                                          |
|  Sem conta?                                              |
|    1. Crie em https://github.com/signup                  |
|    2. Solicite ao Dr. Holanda (suporte) a inclusão       |
|       da sua conta na organização Inspira               |
|                                                          |
|  No macOS o instalador pode pedir sua senha do           |
|  computador e abrir uma janela do Xcode (~5 min).        |
+----------------------------------------------------------+

  Pressione Enter para iniciar (ou Ctrl+C para sair)...

  Digite seu username do GitHub (Enter vazio se sem conta):
  (é o @ do seu perfil, ex: leandromedeiros — não é o email)
  > leandromedeiros

  Validando "leandromedeiros"...
  [FEITO] Conta GitHub confirmada.

  Verificando ferramentas...
  12 ferramentas para instalar/configurar.

==> [1/12] Instalando System packages...
    [FEITO] System packages
==> [2/12] Instalando Git...
...

  Verificação
  ✔ Git           /usr/bin/git
  ✔ Docker        /usr/local/bin/docker
  ...

  Plataforma:  darwin   Arquitetura: arm64
  Profile:     /Users/leandro/.zshrc

========================================
  Setup concluído!
========================================
```

**Fluxo alternativo sem conta:**

```
  Digite seu username do GitHub (Enter vazio se sem conta):
  > [Enter vazio]

  Você precisa de uma conta GitHub na organização Inspira
  para usar este ambiente. Sem conta agora, você pode:

    [1] Sair e voltar quando tiver conta (recomendado)
    [2] Prosseguir e instalar as ferramentas mesmo assim

  Escolha (1/2): 2

  [AVISO] Prosseguindo sem conta GitHub.
  IMPORTANTE: termine de criar a conta em github.com/signup
  e solicite ao Dr. Holanda a inclusão na organização Inspira
  antes de tentar usar o ambiente.

  Pressione Enter para continuar com a instalação...
```

---

## Tarefa 1: Helpers de input em `lib.ts`

**Arquivos:**
- Modificar: `src/lib.ts`

**Passo 1: Adicionar imports do readline no topo**

Localizar imports atuais (linhas 1-3):

```typescript
import { homedir } from "os";
import { mkdirSync } from "fs";
import { dirname } from "path";
```

Substituir por:

```typescript
import { homedir } from "os";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
```

**Passo 2: Adicionar funções `prompt` e `pause` ao final de `lib.ts`**

```typescript
// ── Input ──

/** Pergunta uma string ao usuário (retorna trim). */
export async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(question);
    return answer.trim();
  } finally {
    rl.close();
  }
}

/** Pausa esperando Enter (ignora qualquer input). */
export async function pause(message: string): Promise<void> {
  await prompt(message);
}
```

**Passo 3: Verificar tipos**

Comando: `bun --bun tsc`
Esperado: sem erros

**Passo 4: Commit**

```bash
git add src/lib.ts
git commit -m "feat: adicionar helpers de prompt e pause em lib"
```

---

## Tarefa 2: Validação GitHub com distinção 404/erro em `lib.ts`

**Arquivos:**
- Modificar: `src/lib.ts`

**Passo 1: Anexar ao final de `lib.ts`**

```typescript
// ── GitHub ──

export type GitHubCheckResult =
  | { status: "exists" }
  | { status: "not_found" }
  | { status: "unreachable"; reason: string };

/**
 * Verifica via API do GitHub se um username existe.
 * Distingue "não existe" (404) de "não consegui validar" (rede/rate-limit),
 * para o chamador decidir como tratar cada caso.
 */
export async function checkGitHubUser(username: string): Promise<GitHubCheckResult> {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (res.status === 200) return { status: "exists" };
    if (res.status === 404) return { status: "not_found" };
    return { status: "unreachable", reason: `HTTP ${res.status}` };
  } catch (err) {
    return { status: "unreachable", reason: (err as Error).message };
  }
}
```

**Passo 2: Verificar tipos**

Comando: `bun --bun tsc`
Esperado: sem erros

**Passo 3: Commit**

```bash
git add src/lib.ts
git commit -m "feat: validar username GitHub distinguindo 404 de erro de rede"
```

---

## Tarefa 3: Persistência de config em `lib.ts`

**Arquivos:**
- Modificar: `src/lib.ts`

**Passo 1: Anexar ao final de `lib.ts`**

```typescript
// ── Config ──

export interface BuilderConfig {
  githubUsername?: string;
  /** True quando o usuário rodou o setup sem conta GitHub ainda. */
  pendingGitHubSetup?: boolean;
}

const CONFIG_DIR = `${HOME}/.builder-setup`;
const CONFIG_PATH = `${CONFIG_DIR}/config.json`;

export async function loadConfig(): Promise<BuilderConfig> {
  try {
    return JSON.parse(await Bun.file(CONFIG_PATH).text()) as BuilderConfig;
  } catch {
    return {};
  }
}

export async function saveConfig(patch: Partial<BuilderConfig>): Promise<void> {
  const current = await loadConfig();
  const next = { ...current, ...patch };
  mkdirSync(CONFIG_DIR, { recursive: true });
  await Bun.write(CONFIG_PATH, JSON.stringify(next, null, 2) + "\n");
}
```

**Passo 2: Verificar tipos**

Comando: `bun --bun tsc`
Esperado: sem erros

**Passo 3: Commit**

```bash
git add src/lib.ts
git commit -m "feat: persistir config em ~/.builder-setup/config.json"
```

---

## Tarefa 4: Suporte a contador `[X/Y]` em `log.step`

**Arquivos:**
- Modificar: `src/lib.ts:63`

**Passo 1: Mudar a assinatura de `log.step` para aceitar opcional `progress`**

Localizar em `lib.ts:62-69`:

```typescript
export const log = {
  step: (msg: string) => console.log(`\n${CYAN}==>${NC} ${BOLD}${msg}${NC}`),
  skip: (msg: string) => console.log(`    ${YELLOW}[PULAR]${NC} ${msg}`),
  done: (msg: string) => console.log(`    ${GREEN}[FEITO]${NC} ${msg}`),
  warn: (msg: string) => console.log(`    ${YELLOW}[AVISO]${NC} ${msg}`),
  error: (msg: string) => console.error(`    ${RED}[ERRO]${NC}  ${msg}`),
  info: (msg: string) => console.log(`    ${msg}`),
};
```

Substituir por:

```typescript
export const log = {
  step: (msg: string, progress?: { current: number; total: number }) => {
    const prefix = progress ? `[${progress.current}/${progress.total}] ` : "";
    console.log(`\n${CYAN}==>${NC} ${BOLD}${prefix}${msg}${NC}`);
  },
  skip: (msg: string) => console.log(`    ${YELLOW}[PULAR]${NC} ${msg}`),
  done: (msg: string) => console.log(`    ${GREEN}[FEITO]${NC} ${msg}`),
  warn: (msg: string) => console.log(`    ${YELLOW}[AVISO]${NC} ${msg}`),
  error: (msg: string) => console.error(`    ${RED}[ERRO]${NC}  ${msg}`),
  info: (msg: string) => console.log(`    ${msg}`),
};
```

**Passo 2: Verificar tipos**

Comando: `bun --bun tsc`
Esperado: sem erros (chamadas existentes continuam funcionando — `progress` é opcional)

**Passo 3: Commit**

```bash
git add src/lib.ts
git commit -m "feat: suportar contador [X/Y] em log.step"
```

---

## Tarefa 5: Função `printWelcomeBox` em `setup.ts`

**Arquivos:**
- Modificar: `src/setup.ts`

**Passo 1: Adicionar função no início de `setup.ts` (após imports)**

Após a linha 13 (após o último import), inserir:

```typescript
function printWelcomeBox() {
  const B = "\x1b[1m";
  const N = "\x1b[0m";

  console.log("");
  console.log("  +==========================================================+");
  console.log(`  |          ${B}BUILDER'S SETUP - INSPIRA LEGAL${N}                 |`);
  console.log("  +==========================================================+");
  console.log("  |  Este script prepara seu ambiente instalando Git,        |");
  console.log("  |  Docker, Node, Bun, Python e demais ferramentas.         |");
  console.log("  |                                                          |");
  console.log("  |  IMPORTANTE: é necessário ter uma conta no GitHub        |");
  console.log("  |  incluída na organização Inspira para prosseguir.        |");
  console.log("  |                                                          |");
  console.log("  |  Sem conta?                                              |");
  console.log("  |    1. Crie em https://github.com/signup                  |");
  console.log("  |    2. Solicite ao Dr. Holanda (suporte) a inclusão       |");
  console.log("  |       da sua conta na organização Inspira                |");
  console.log("  |                                                          |");
  console.log("  |  No macOS o instalador pode pedir sua senha do           |");
  console.log("  |  computador e abrir uma janela do Xcode (~5 min).        |");
  console.log("  +----------------------------------------------------------+");
  console.log("");
}
```

**Passo 2: Verificar tipos**

Comando: `bun --bun tsc`
Esperado: sem erros

**Passo 3: Commit**

```bash
git add src/setup.ts
git commit -m "feat: adicionar quadro de boas-vindas com aviso GitHub"
```

---

## Tarefa 6: Função `ensureGitHubAccount` em `setup.ts`

**Arquivos:**
- Modificar: `src/setup.ts`

**Passo 1: Adicionar imports**

Localizar imports em `setup.ts:1-13`:

```typescript
import { $ } from "bun";
import { installs, setups } from "./tools";
import {
  type Tool,
  type Platform,
  getPlatform,
  isWSL,
  getProfilePath,
  fileContains,
  appendFile,
  refreshPath,
  log,
} from "./lib";
```

Substituir por (adicionando `prompt`, `pause`, `checkGitHubUser`, `loadConfig`, `saveConfig`):

```typescript
import { $ } from "bun";
import { installs, setups } from "./tools";
import {
  type Tool,
  type Platform,
  getPlatform,
  isWSL,
  getProfilePath,
  fileContains,
  appendFile,
  refreshPath,
  log,
  prompt,
  pause,
  checkGitHubUser,
  loadConfig,
  saveConfig,
} from "./lib";
```

**Passo 2: Adicionar função `ensureGitHubAccount` antes de `main()`**

```typescript
async function ensureGitHubAccount(): Promise<void> {
  const Y = "\x1b[33m";
  const G = "\x1b[32m";
  const B = "\x1b[1m";
  const N = "\x1b[0m";

  const config = await loadConfig();
  if (config.githubUsername) {
    console.log(`  ${G}✔${N} Conta GitHub: ${B}${config.githubUsername}${N}`);
    return;
  }

  // Loop até obter resposta válida (username válido OU decisão de prosseguir/sair sem conta)
  while (true) {
    console.log("  Digite seu username do GitHub (Enter vazio se sem conta):");
    console.log(`  ${Y}(é o @ do seu perfil, ex: leandromedeiros — não é o email)${N}`);
    const username = await prompt("  > ");

    if (username.length === 0) {
      // Sem conta: pergunta sair ou prosseguir
      console.log("");
      console.log("  Você precisa de uma conta GitHub na organização Inspira");
      console.log("  para usar este ambiente. Sem conta agora, você pode:");
      console.log("");
      console.log(`    ${B}[1]${N} Sair e voltar quando tiver conta (recomendado)`);
      console.log(`    ${B}[2]${N} Prosseguir e instalar as ferramentas mesmo assim`);
      console.log("");
      const choice = await prompt("  Escolha (1/2): ");
      if (choice === "2") {
        log.warn("Prosseguindo sem conta GitHub.");
        console.log(`  ${Y}IMPORTANTE:${N} termine de criar a conta em https://github.com/signup`);
        console.log("  e solicite ao Dr. Holanda a inclusão na organização Inspira");
        console.log("  antes de tentar usar o ambiente.");
        await pause("\n  Pressione Enter para continuar com a instalação...");
        await saveConfig({ pendingGitHubSetup: true });
        return;
      }
      // Qualquer coisa diferente de "2" → sair
      console.log("");
      console.log("  Crie sua conta e execute o builder-setup novamente.");
      console.log("");
      process.exit(1);
    }

    log.info(`Validando "${username}"...`);
    const result = await checkGitHubUser(username);

    if (result.status === "exists") {
      await saveConfig({ githubUsername: username, pendingGitHubSetup: false });
      log.done(`Conta GitHub confirmada: ${username}`);
      return;
    }

    if (result.status === "not_found") {
      log.warn(`Usuário "${username}" não encontrado no GitHub.`);
      log.info("Encontre seu username em https://github.com/settings/profile");
      continue;
    }

    // unreachable: oferece prosseguir com confirmação
    log.warn(`Não consegui validar com o GitHub (${result.reason}).`);
    const confirmAnswer = (
      await prompt(`  Prosseguir mesmo assim com "${username}"? (s/N): `)
    ).toLowerCase();
    if (confirmAnswer === "s" || confirmAnswer === "sim") {
      await saveConfig({ githubUsername: username, pendingGitHubSetup: false });
      log.done(`Conta GitHub aceita sem validação: ${username}`);
      return;
    }
    // Não confirmou — volta ao topo do loop
  }
}
```

**Passo 3: Verificar tipos**

Comando: `bun --bun tsc`
Esperado: sem erros

**Passo 4: Commit**

```bash
git add src/setup.ts
git commit -m "feat: coletar e validar conta GitHub no início do setup"
```

---

## Tarefa 7: Integrar no `main()` e adicionar contador `[X/Y]`

**Arquivos:**
- Modificar: `src/setup.ts`

**Passo 1: Reorganizar `main()` — chamar boas-vindas + GitHub antes de tudo**

Localizar em `setup.ts:27-60` (início de `main`):

```typescript
async function main() {
  const platform = getPlatform();

  const wsl = isWSL();
  const profilePath = getProfilePath();

  const G = "\x1b[32m";
  const C = "\x1b[36m";
  const B = "\x1b[1m";
  const N = "\x1b[0m";

  console.log("");
  console.log(`  ${B}Builder's Setup${N}`);
  console.log(`  ${C}Plataforma:${N} ${platform}${wsl ? " (WSL)" : ""}`);
  console.log(`  ${C}Arquitetura:${N} ${process.arch}`);
  if (platform !== "windows") {
    console.log(`  ${C}Profile:${N}    ${profilePath}`);
  }

  // Pre-cache sudo on linux (macOS tools don't need sudo)
  let sudoKeepAlive: Timer | undefined;
  if (platform === "linux") {
    console.log("");
    log.info("Este script precisa de acesso sudo para instalar pacotes.");
    await $`sudo -v`;

    // Keep sudo alive in the background
    sudoKeepAlive = setInterval(() => {
      Bun.spawn(["sudo", "-n", "true"], {
        stdout: "ignore",
        stderr: "ignore",
      });
    }, 50_000);
  }
```

Substituir por:

```typescript
async function main() {
  const platform = getPlatform();
  const wsl = isWSL();
  const profilePath = getProfilePath();

  const G = "\x1b[32m";
  const C = "\x1b[36m";
  const B = "\x1b[1m";
  const N = "\x1b[0m";

  printWelcomeBox();
  await pause("  Pressione Enter para iniciar (ou Ctrl+C para sair)...");
  console.log("");

  await ensureGitHubAccount();

  // Pre-cache sudo on linux (macOS tools don't need sudo)
  let sudoKeepAlive: Timer | undefined;
  if (platform === "linux") {
    console.log("");
    log.info("Este script precisa de acesso sudo para instalar pacotes.");
    await $`sudo -v`;

    sudoKeepAlive = setInterval(() => {
      Bun.spawn(["sudo", "-n", "true"], {
        stdout: "ignore",
        stderr: "ignore",
      });
    }, 50_000);
  }
```

**Passo 2: Adicionar pré-flight de contagem + passar `progress` em `runTools`**

Localizar em `setup.ts:62-99` a função `runTools`:

```typescript
  const failed: { name: string; output: string }[] = [];

  let executed = 0;

  async function runTools(tools: Tool[], verb: string) {
    for (const tool of tools) {
      const installer = getInstaller(tool, platform);
      if (!installer) continue;

      if (await isInstalled(tool)) continue;

      log.step(`${verb} ${tool.name}...`);
      try {
        const result = await installer();
        ...
```

Substituir o bloco da declaração de `runTools` por uma versão com pré-flight:

```typescript
  const failed: { name: string; output: string }[] = [];

  // Pré-flight: conta tools que vão executar (para mostrar [X/Y])
  console.log("");
  log.info("Verificando ferramentas...");
  async function countPending(tools: Tool[]): Promise<number> {
    let count = 0;
    for (const tool of tools) {
      if (!getInstaller(tool, platform)) continue;
      if (await isInstalled(tool)) continue;
      count++;
    }
    return count;
  }
  const totalInstalls = await countPending(installs);
  const totalSetups = await countPending(setups);
  const total = totalInstalls + totalSetups;
  log.info(`${total} ferramenta(s) para instalar/configurar.`);

  let executed = 0;
  let current = 0;

  async function runTools(tools: Tool[], verb: string) {
    for (const tool of tools) {
      const installer = getInstaller(tool, platform);
      if (!installer) continue;

      if (await isInstalled(tool)) continue;

      current++;
      log.step(`${verb} ${tool.name}...`, { current, total });
      try {
        const result = await installer();
```

(O restante do corpo de `runTools` permanece igual.)

**Passo 3: Mover cabeçalho técnico para o fim e ajustar mensagem final quando `pendingGitHubSetup`**

Localizar em `setup.ts:127-130` (logo após a verificação, antes do bloco `// Completion`):

```typescript
  // Completion
  console.log("");
```

Substituir por:

```typescript
  // Debug info no fim
  console.log("");
  console.log(`  ${C}Plataforma:${N}  ${platform}${wsl ? " (WSL)" : ""}   ${C}Arquitetura:${N} ${process.arch}`);
  if (platform !== "windows") {
    console.log(`  ${C}Profile:${N}     ${profilePath}`);
  }

  // Completion
  console.log("");
```

**Passo 4: Verificar tipos e lint**

Comando: `bun run check`
Esperado: PASSA

**Passo 5: Testar em desenvolvimento (cenários)**

Comando: `bun run dev`

Cenários a validar manualmente:

| # | Input | Esperado |
|---|---|---|
| A | Username válido | Valida, salva config, prossegue |
| B | Username inválido | Avisa, sugere link, pede de novo |
| C | Enter vazio + escolha 1 | Encerra com exit 1 |
| D | Enter vazio + escolha 2 | Aviso, salva `pendingGitHubSetup`, prossegue |
| E | Reexecução com config | Pula prompts, prossegue direto |

Para o cenário E:

```bash
cat ~/.builder-setup/config.json   # ver username salvo
bun run dev                         # deve pular pergunta
```

Para limpar e testar do zero:

```bash
rm -rf ~/.builder-setup
bun run dev
```

**Passo 6: Commit**

```bash
git add src/setup.ts
git commit -m "feat: integrar boas-vindas, validação GitHub e contador [X/Y]"
```

---

## Tarefa 8: Atualizar README

**Arquivos:**
- Modificar: `README.md`

**Passo 1: Adicionar seção "Pré-requisitos" após a linha 19**

Localizar em `README.md:19`:

```markdown
> O script de instalação baixa o binário e executa com privilégios de Administrador via prompt UAC.

## O que faz
```

Substituir por:

```markdown
> O script de instalação baixa o binário e executa com privilégios de Administrador via prompt UAC.

## Pré-requisitos

Antes de executar, é necessário ter uma **conta no GitHub incluída na organização Inspira**.

- Sem conta: crie em [github.com/signup](https://github.com/signup).
- Conta criada: solicite ao Dr. Holanda (suporte) a inclusão na organização.

O setup pergunta seu username no início e valida via API do GitHub. Se você ainda não tiver acesso à organização, pode optar por instalar as ferramentas e regularizar a conta depois.

Para resetar o username salvo: `rm -rf ~/.builder-setup`.

## O que faz
```

**Passo 2: Adicionar linha "GitHub account check" na tabela**

Localizar em `README.md:23-25`:

```markdown
| | Windows | macOS | Linux | WSL |
|--|---------|-------|-------|-----|
| System packages | ⬚ | ✅ | ✅ | ✅ |
```

Substituir por:

```markdown
| | Windows | macOS | Linux | WSL |
|--|---------|-------|-------|-----|
| GitHub account check | ✅ | ✅ | ✅ | ✅ |
| System packages | ⬚ | ✅ | ✅ | ✅ |
```

**Passo 3: Commit**

```bash
git add README.md
git commit -m "docs: documentar pré-requisito GitHub e como resetar config"
```

---

## Tarefa 9: Build final e validação

**Arquivos:**
- Nenhum modificado.

**Passo 1: Rodar checks completos**

Comando: `bun run check`
Esperado: lint, formatação e typecheck passam.

**Passo 2: Build do binário local**

Comando: `bun run build`
Esperado: binário gerado em `dist/setup-<os>-<arch>`.

**Passo 3: Rodar o binário do zero**

Comando: `rm -rf ~/.builder-setup && ./dist/setup-darwin-arm64` (ajustar para sua plataforma)
Esperado: roda o fluxo completo de ponta a ponta.

---

## Notas de design

1. **Por que ASCII puro na moldura:** funciona em CMD antigo do Windows, Terminal.app, iTerm, GNOME Terminal, WSL. Caracteres Unicode (`╔╗╚╝`) podem renderizar como `?` em terminais legados.

2. **Por que acentos pt-BR no conteúdo:** a instrução de idioma do projeto exige ortografia correta. ASCII puro é só na moldura.

3. **Por que distinguir 404 de erro de rede:** API do GitHub sem auth tem limite de 60 req/hora por IP. Time inteiro num NAT corporativo poderia ter username válido rejeitado. Fallback com confirmação resolve.

4. **Por que `pendingGitHubSetup` no config:** permite que etapas futuras (`gh auth login`, SSH) detectem que o setup foi rodado em modo "incompleto" e peçam o username naquele momento.

5. **Por que cabeçalho técnico no fim:** iniciantes não precisam ver "Plataforma: darwin / Arquitetura: arm64" como primeira informação. Vira debug info útil só se algo der errado.

6. **Por que pré-flight de contagem:** mostrar `[3/12]` real exige saber `12` antes de começar. O custo (~3-5s rodando `shouldSkip`) é irrelevante num setup que dura 10-20min, e o ganho de UX é alto.

7. **Foco em Windows/macOS:** Linux é instalação sob demanda para usuários avançados, não foco de UX. Mensagens didáticas extras (ex: explicar sudo) não justificam o custo.

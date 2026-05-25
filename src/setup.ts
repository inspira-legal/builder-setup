import { $ } from "bun";
import { coreInstalls, platformInstalls, setups } from "./tools";
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
  checkGitHubOrgMembership,
  loadConfig,
  saveConfig,
} from "./lib";

function printWelcomeBox() {
  const B = "\x1b[1m";
  const N = "\x1b[0m";
  const C = "\x1b[36m";

  console.log("");
  console.log("  +==========================================================+");
  console.log(`  |     ${B}BEM-VINDO À JORNADA BUILDER - INSPIRA LEGAL${N}         |`);
  console.log("  +==========================================================+");
  console.log(`  |  Este é o ${B}Passo 1${N}: preparar sua máquina.              |`);
  console.log("  |                                                          |");
  console.log("  |  Depois vêm os próximos passos:                         |");
  console.log("  |    • Conhecer o código e os projetos                     |");
  console.log("  |    • Entender nossos processos de trabalho               |");
  console.log("  |                                                          |");
  console.log(`  |  ${C}Não se preocupe${N}: vou guiar você por cada parte.       |`);
  console.log("  |  Nada será feito sem que você seja avisado primeiro.   |");
  console.log("  +----------------------------------------------------------+");
  console.log("");
}

function getInstaller(
  tool: Tool,
  platform: Platform,
): (() => Promise<void | { profile: string[] }>) | null {
  return tool[platform] ?? null;
}

async function ensureGitHubAccount(): Promise<{ username: string | null; orgVerified: boolean }> {
  const Y = "\x1b[33m";
  const G = "\x1b[32m";
  const B = "\x1b[1m";
  const N = "\x1b[0m";
  const C = "\x1b[36m";

  console.log(`  ${C}▸ Passo 1.1 — Identidade${N}`);
  console.log("  Precisamos confirmar sua conta GitHub para conectar você");
  console.log("  aos projetos da Inspira.");
  console.log("");

  const config = await loadConfig();

  // Se já temos tudo verificado, retorna imediatamente
  if (config.githubUsername && config.githubOrgVerified) {
    console.log(`  ${G}✔${N} Conta GitHub: ${B}${config.githubUsername}${N}`);
    console.log(`  ${G}✔${N} Acesso confirmado à organização Inspira`);
    console.log("");
    return { username: config.githubUsername, orgVerified: true };
  }

  // Se tem username mas org ainda não verificada, tenta verificar ou pergunta
  if (config.githubUsername && !config.githubOrgVerified) {
    console.log(`  ${G}✔${N} Conta GitHub: ${B}${config.githubUsername}${N}`);
    const orgResult = await verifyOrgAccess(config.githubUsername);
    if (orgResult.verified) {
      return { username: config.githubUsername, orgVerified: true };
    }
    // Se não verificou, retorna o que temos para não re-perguntar o username
    return { username: config.githubUsername, orgVerified: false };
  }

  // Loop até obter um username válido
  let username: string | null = null;
  while (true) {
    console.log("  Digite seu username do GitHub (Enter vazio se sem conta):");
    console.log(`  ${Y}(é o @ do seu perfil, ex: leandromedeiros — não é o email)${N}`);
    const answer = await prompt("  > ");

    if (answer.length === 0) {
      const shouldContinue = await handleNoAccount();
      if (shouldContinue) {
        return { username: null, orgVerified: false };
      }
      // Se handleNoAccount retornar false, reinicia o loop (não deveria acontecer, mas por segurança)
      continue;
    }

    log.info(`Validando "${answer}"...`);
    const result = await checkGitHubUser(answer);

    if (result.status === "exists") {
      username = result.canonical;
      await saveConfig({ githubUsername: username });
      log.done(`Conta GitHub confirmada: ${username}`);
      console.log("");
      break;
    }

    if (result.status === "not_found") {
      log.warn(`Usuário "${answer}" não encontrado no GitHub.`);
      log.info("Encontre seu username em https://github.com/settings/profile");
      console.log("");
      continue;
    }

    log.warn(`Não consegui validar com o GitHub (${result.reason}).`);
    const confirmAnswer = (
      await prompt(`  Prosseguir mesmo assim com "${answer}"? (s/N): `)
    ).toLowerCase();
    if (confirmAnswer === "s" || confirmAnswer === "sim") {
      username = answer;
      await saveConfig({ githubUsername: username });
      log.done(`Conta GitHub aceita sem validação: ${username}`);
      console.log("");
      break;
    }
    console.log("");
  }

  // Agora verifica acesso à organização
  const orgResult = await verifyOrgAccess(username);
  return { username, orgVerified: orgResult.verified };
}

async function handleNoAccount(): Promise<boolean> {
  const B = "\x1b[1m";
  const N = "\x1b[0m";
  const Y = "\x1b[33m";

  console.log("");
  console.log("  Você precisa de uma conta GitHub na organização Inspira");
  console.log("  para usar este ambiente. Sem conta agora, você pode:");
  console.log("");

  while (true) {
    console.log(`    ${B}[1]${N} Sair e voltar quando tiver conta (recomendado)`);
    console.log(`    ${B}[2]${N} Prosseguir e instalar as ferramentas mesmo assim`);
    console.log("");
    const choice = await prompt("  Escolha (1/2): ");

    if (choice === "2") {
      log.warn("Prosseguindo sem conta GitHub.");
      console.log(`  ${Y}IMPORTANTE:${N} termine de criar a conta em https://github.com/signup`);
      console.log("  e solicite ao HOLANDA a inclusão na organização Inspira");
      console.log("  antes de tentar usar o ambiente.");
      await pause("\n  Pressione Enter para continuar com a instalação...");
      return true;
    }

    if (choice === "1") {
      console.log("");
      console.log("  Crie sua conta e execute o builder-setup novamente.");
      console.log("");
      process.exit(0);
    }

    console.log("");
    console.log(`  ${Y}Resposta inválida.${N} Digite 1 ou 2.`);
    console.log("");
  }
}

async function offerGhAuthLogin(): Promise<boolean> {
  const Y = "\x1b[33m";
  const N = "\x1b[0m";
  const B = "\x1b[1m";

  console.log("");
  console.log(`  ${Y}⚠${N} O gh CLI precisa estar autenticado para verificar`);
  console.log("     sua participação na organização Inspira.");
  console.log("");
  const answer = (
    await prompt(`  Autenticar agora com ${B}gh auth login${N}? (S/n): `)
  ).toLowerCase();
  if (answer === "n" || answer === "não" || answer === "nao") {
    return false;
  }
  console.log("");
  try {
    const proc = Bun.spawn(["gh", "auth", "login"], {
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
    const exitCode = await proc.exited;
    console.log("");
    if (exitCode !== 0) {
      log.warn(`gh auth login falhou (exit ${exitCode}).`);
      return false;
    }
    return true;
  } catch (err) {
    log.warn(`Falha ao executar gh auth login: ${(err as Error).message}`);
    return false;
  }
}

async function verifyOrgAccess(username: string): Promise<{ verified: boolean }> {
  const Y = "\x1b[33m";
  const G = "\x1b[32m";
  const B = "\x1b[1m";
  const N = "\x1b[0m";

  console.log("  Verificando acesso à organização Inspira...");

  // Tentativa 1: se gh CLI já estiver disponível e autenticado, usa ele
  if (Bun.which("gh") !== null) {
    let ghResult = await checkGitHubOrgMembership();

    // Se gh está instalado mas não autenticado, oferece login interativo agora.
    if (ghResult.status === "unverified" && ghResult.reason === "gh CLI não autenticado") {
      const ok = await offerGhAuthLogin();
      if (ok) ghResult = await checkGitHubOrgMembership();
    }

    if (ghResult.status === "member") {
      await saveConfig({ githubOrgVerified: true, githubOrgPending: false });
      log.done("Acesso confirmado à organização Inspira");
      console.log("");
      return { verified: true };
    }
    if (ghResult.status === "not_member") {
      console.log(
        `  ${Y}⚠${N}  Sua conta foi encontrada no GitHub, mas ${B}você ainda não faz parte${N}`,
      );
      console.log("     da organização Inspira.");
      console.log("");
      console.log("     Isso significa que, mesmo com seu computador pronto,");
      console.log("     você não conseguirá ver ou clonar os projetos da equipe.");
      console.log("");
    } else if (ghResult.status === "unverified") {
      console.log(`  ${Y}⚠${N}  A verificação automática falhou: ${ghResult.reason}.`);
      console.log("     Vamos prosseguir com a verificação manual.");
      console.log("");
    }
  } else {
    console.log(`  ${Y}⚠${N}  Não consigo verificar automaticamente se você está na organização.`);
    console.log("     (isso é normal antes de instalar as ferramentas)");
    console.log("");
  }

  // Pergunta ao usuário
  console.log(`  ${B}Ação necessária:${N} você já solicitou ao HOLANDA a inclusão`);
  console.log("  na organização Inspira no GitHub?");
  console.log("");

  while (true) {
    const answer = (await prompt("  (s)im / (n)ão: ")).toLowerCase();

    if (answer === "s" || answer === "sim") {
      console.log("");
      console.log(`  ${G}✔${N} Anotado. Vou confiar na sua palavra por enquanto.`);
      console.log("  Assim que o gh CLI estiver instalado, tentarei confirmar");
      console.log("  automaticamente na próxima execução.");
      console.log("");
      await saveConfig({ githubOrgPending: true, githubOrgVerified: false });
      return { verified: false };
    }

    if (answer === "n" || answer === "não" || answer === "nao") {
      console.log("");
      console.log("  Sem acesso à organização, você não conseguirá trabalhar");
      console.log("  nos projetos da Inspira.");
      console.log("");

      while (true) {
        console.log("  Você pode:");
        console.log(`    ${B}[1]${N} Resolver agora (recomendado)`);
        console.log(`    ${B}[2]${N} Instalar ferramentas primeiro e resolver depois`);
        console.log("");
        const choice = await prompt("  Escolha (1/2): ");

        if (choice === "1") {
          console.log("");
          console.log("  Envie uma mensagem para HOLANDA agora:");
          console.log(`    "Olá! Meu username no GitHub é ${B}${username}${N}."`);
          console.log(`    "Poderia me incluir na organização inspira-legal?"`);
          console.log("");
          await pause("  ⏎ Pressione Enter depois de enviar a mensagem...");
          console.log("");
          console.log("  Vou continuar instalando as ferramentas agora.");
          console.log("  Depois que HOLANDA confirmar sua inclusão, basta:");
          console.log(`    1. Rodar ${B}gh auth login${N} (autenticar o GitHub CLI)`);
          console.log("    2. Rodar o builder-setup novamente");
          console.log("  Eu verifico automaticamente se você já está na org.");
          console.log("");
          await saveConfig({ githubOrgPending: true, githubOrgVerified: false });
          return { verified: false };
        }

        if (choice === "2") {
          console.log("");
          console.log("  Entendido. Vou preparar seu computador agora.");
          console.log(`  ${Y}Lembrete:${N} sem acesso à organização, você ainda não`);
          console.log("  conseguirá clonar os projetos, mas o computador ficará");
          console.log("  pronto para quando HOLANDA liberar.");
          console.log("");
          await saveConfig({ githubOrgPending: false, githubOrgVerified: false });
          return { verified: false };
        }

        console.log("");
        console.log(`  ${Y}Resposta inválida.${N} Digite 1 ou 2.`);
        console.log("");
      }
    }

    console.log("");
    console.log(`  ${Y}Resposta não reconhecida.${N} Use: s (sim) ou n (não)`);
    console.log("");
  }
}

async function isInstalled(tool: Tool): Promise<boolean> {
  if (tool.shouldSkip) return tool.shouldSkip();
  return false;
}

async function main() {
  const platform = getPlatform();
  const wsl = isWSL();
  const profilePath = getProfilePath();

  const G = "\x1b[32m";
  const C = "\x1b[36m";
  const Y = "\x1b[33m";
  const B = "\x1b[1m";
  const N = "\x1b[0m";

  // Pre-cache sudo no Linux ANTES de qualquer prompt longo — evita travar o setup
  // se o usuário sair da frente do terminal durante os prompts de identidade.
  let sudoKeepAlive: Timer | undefined;
  if (platform === "linux") {
    log.info("Este script precisa de acesso sudo para instalar pacotes.");
    await $`sudo -v`;
    console.log("");

    sudoKeepAlive = setInterval(() => {
      Bun.spawn(["sudo", "-n", "true"], {
        stdout: "ignore",
        stderr: "ignore",
      });
    }, 50_000);
  }

  // 1ª execução: welcome box completo. Re-execuções: header curto.
  const existingConfig = await loadConfig();
  const isFirstRun = Object.keys(existingConfig).length === 0;
  if (isFirstRun) {
    printWelcomeBox();
    await pause("  Pressione Enter para iniciar (ou Ctrl+C para sair)...");
    console.log("");
  } else {
    console.log("");
    console.log(`  ${C}▸ Builder Setup — retomando${N}`);
    console.log("");
  }

  const identity = await ensureGitHubAccount();

  const failed: { name: string; output: string }[] = [];

  // Stack de Plataforma (Docker + Google Cloud SDK) é opt-in via env var.
  // Default = só o essencial. Quem precisa: BUILDER_PROFILE=platform builder-setup
  const isPlatformProfile = process.env.BUILDER_PROFILE === "platform";
  const activeInstalls = isPlatformProfile ? [...coreInstalls, ...platformInstalls] : coreInstalls;

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
  const total = (await countPending(activeInstalls)) + (await countPending(setups));
  log.info(`${total} ferramenta(s) para instalar/configurar.`);
  console.log("");

  let executed = 0;
  let current = 0;

  console.log(`  ${C}▸ Passo 1.2 — Ferramentas${N}`);
  if (isPlatformProfile) {
    console.log("  Instalando stack completo (essencial + Plataforma).");
  } else {
    console.log("  Instalando stack essencial.");
  }
  console.log("");

  async function runTools(tools: Tool[], verb: string) {
    for (const tool of tools) {
      const installer = getInstaller(tool, platform);
      if (!installer) continue;

      if (await isInstalled(tool)) continue;

      current++;
      log.step(`${verb} ${tool.name}...`, { current, total });
      try {
        // Captura mtime do profile pra detectar se o instalador modificou
        // .bashrc/.zshrc externamente (uv, pnpm, fnm via curl|bash fazem isso).
        const profileMtimeBefore = Bun.file(profilePath).lastModified;

        const result = await installer();

        if (result && result.profile.length > 0) {
          for (const line of result.profile) {
            if (!(await fileContains(profilePath, line))) {
              await appendFile(profilePath, line);
            }
          }
          log.info(`Atualizado ${profilePath}`);
        }

        const profileMtimeAfter = Bun.file(profilePath).lastModified;

        log.done(tool.name);
        executed++;

        // refreshPath só quando o profile mudou (lines escritas por nós ou pelo
        // instalador externo). winget/apt/brew colocam binários em paths já
        // presentes em $PATH e não precisam de refresh.
        const profileChanged =
          (result && result.profile.length > 0) || profileMtimeAfter !== profileMtimeBefore;
        if (profileChanged) {
          await refreshPath();
        }
      } catch (err) {
        const e = err as Error & { stderr?: Buffer; stdout?: Buffer };
        const raw = e.stderr?.toString().trim() || e.stdout?.toString().trim() || e.message;
        const output = raw.replace(/^bun: /gm, "");
        log.error(tool.name);
        failed.push({ name: tool.name, output });
      }
    }
  }

  await runTools(activeInstalls, "Instalando");
  await runTools(setups, "Configurando");

  // Re-verificação automática de org: se gh acabou de ser instalado,
  // tentamos confirmar. Se faltar auth, oferece `gh auth login` interativo —
  // sem isso a verificação automática nunca dispara na 1ª execução.
  if (identity.username && !identity.orgVerified && Bun.which("gh") !== null) {
    let ghResult = await checkGitHubOrgMembership();

    if (ghResult.status === "unverified" && ghResult.reason === "gh CLI não autenticado") {
      const ok = await offerGhAuthLogin();
      if (ok) ghResult = await checkGitHubOrgMembership();
    }

    if (ghResult.status === "member") {
      await saveConfig({ githubOrgVerified: true, githubOrgPending: false });
      identity.orgVerified = true;
      log.done("Acesso à organização Inspira confirmado");
      console.log("");
    }
  }

  // Stop sudo keep-alive
  if (sudoKeepAlive) clearInterval(sudoKeepAlive);

  // Verification
  const R = "\x1b[31m";
  const DIM = "\x1b[2m";
  const verifyFailed: string[] = [];

  const verifiable = activeInstalls.filter((t) => t.verify && getInstaller(t, platform));

  if (verifiable.length > 0) {
    console.log(`\n  ${B}Verificação${N}`);

    for (const tool of verifiable) {
      const result = await tool.verify!();
      if (result) {
        console.log(`  ${G}✔${N}  ${tool.name.padEnd(20)} ${DIM}${result}${N}`);
      } else {
        console.log(`  ${R}✘${N}  ${tool.name}`);
        verifyFailed.push(tool.name);
      }
    }
  }

  // Completion
  console.log("");

  // Status dos sub-passos
  const identityComplete = !!identity.username && identity.orgVerified;
  const identityPartial = !!identity.username && !identity.orgVerified;
  const identityMissing = !identity.username;
  const toolsComplete = failed.length === 0 && verifyFailed.length === 0;

  if (!toolsComplete) {
    console.log(`${R}========================================${N}`);
    console.log(`${R}  Passo 1 INCOMPLETO                     ${N}`);
    console.log(`${R}========================================${N}`);
    console.log("");
  }

  // Status de identidade: mostra em TODOS os cenários, inclusive quando ferramentas falham
  if (identityComplete) {
    console.log(`  ${G}✔${N} Passo 1.1 — Identidade: completo`);
    console.log(`     Conta: ${B}${identity.username}${N}  |  Org Inspira: confirmada`);
  } else if (identityPartial) {
    console.log(`  ${Y}⏳${N} Passo 1.1 — Identidade: parcial`);
    console.log(`     Conta: ${B}${identity.username}${N}  |  Org Inspira: ${Y}pendente${N}`);
  } else if (identityMissing) {
    console.log(`  ${Y}⏳${N} Passo 1.1 — Identidade: pendente`);
    console.log(`     Conta GitHub: ${Y}ainda não criada${N}`);
  }
  console.log("");

  if (failed.length > 0) {
    console.log(`${R}  Algumas ferramentas falharam:${N}`);
    for (const { name, output } of failed) {
      console.log(`${R}    - ${name}${N}`);
      for (const line of output.split("\n").slice(-10)) {
        console.log(`${DIM}      ${line}${N}`);
      }
    }
    console.log("");
    log.info("Corrija os problemas acima e rode builder-setup novamente.");
    console.log("");
  }

  if (verifyFailed.length > 0) {
    for (const name of verifyFailed) {
      log.warn(`Desinstale ${name} e rode builder-setup novamente.`);
    }
    console.log("");
  }

  if (failed.length > 0 || verifyFailed.length > 0) {
    console.log(`  ${Y}Você está na Jornada Builder, mas precisa resolver isso${N}`);
    console.log(`  antes de seguir para os próximos passos.`);
    console.log("");
    process.exit(1);
  }

  // Tudo deu certo nas ferramentas — mostra checkpoint honesto
  console.log(`${G}========================================${N}`);
  console.log(`${G}  ✅ Passo 1 da Jornada Builder           ${N}`);
  console.log(`${G}========================================${N}`);
  console.log("");

  if (executed === 0) {
    console.log(`  ${G}✔${N} Passo 1.2 — Ferramentas: já estavam prontas`);
  } else {
    console.log(`  ${G}✔${N} Passo 1.2 — Ferramentas: instaladas e configuradas`);
  }

  console.log("");

  if (identityComplete && toolsComplete) {
    console.log("  Seu computador está pronto e conectado.");
    console.log("");
    console.log(`  ${B}Próximos passos da jornada:${N}`);
    if (wsl) {
      console.log("    1. Abra o Ubuntu novamente (vou reiniciar o WSL agora)");
    } else if (platform === "windows") {
      console.log("    1. Abra um novo terminal (PowerShell ou Git Bash)");
    } else {
      console.log("    1. Abra um novo terminal para as mudanças entrarem em vigor");
    }
    console.log("    2. Peça ao seu líder o link do primeiro projeto");
    console.log("    3. Rode no novo terminal:");
    console.log(`       ${B}git clone git@github.com:inspira-legal/...${N}`);
    console.log("");
    console.log("  Te vejo no Passo 2 👋");

    if (wsl) {
      await Bun.sleep(3000);
      await $`wsl.exe --shutdown`;
    }
    return;
  }

  // Caso parcial ou sem conta
  if (identityPartial) {
    console.log(`  ${Y}Seu computador está pronto, mas falta uma chave:${N}`);
    console.log("");
    console.log("  Ação necessária:");
    console.log("    1. Confirme com HOLANDA que você foi incluído(a) na");
    console.log("       organização inspira-legal no GitHub");
    console.log(`    2. Rode ${B}gh auth login${N} para autenticar o GitHub CLI`);
    console.log("    3. Rode builder-setup novamente para verificar");
    console.log("");
    console.log(`  ${C}▸ Próximo passo da jornada:${N} concluir sua identidade`);
  } else if (identityMissing) {
    console.log(`  ${Y}Seu computador está pronto, mas falta sua identidade:${N}`);
    console.log("");
    console.log("  Ação necessária:");
    console.log("    1. Criar conta em https://github.com/signup");
    console.log("    2. Solicitar ao HOLANDA a inclusão na organização Inspira");
    console.log("    3. Rode builder-setup novamente");
    console.log("");
    console.log(`  ${C}▸ Próximo passo da jornada:${N} criar conta e conectar`);
  }

  console.log("");
}

main().catch((err) => {
  log.error((err as Error).message);
  process.exit(1);
});

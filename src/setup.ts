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

function printWelcomeBox() {
  const B = "\x1b[1m";
  const N = "\x1b[0m";

  console.log("");
  console.log("  +==========================================================+");
  console.log(`  |          ${B}BUILDER'S SETUP - INSPIRA LEGAL${N}                 |`);
  console.log("  +==========================================================+");
  console.log("  |  ATENÇÃO: o setup ideal requer uma conta GitHub na       |");
  console.log("  |  organização Inspira. Sem ela, você pode instalar as     |");
  console.log("  |  ferramentas agora e regularizar a conta depois.         |");
  console.log("  |                                                          |");
  console.log("  |  Para criar/incluir conta:                               |");
  console.log("  |    1. Crie em https://github.com/signup                  |");
  console.log("  |    2. Solicite ao HOLANDA (suporte) a inclusão           |");
  console.log("  |       da sua conta na organização Inspira                |");
  console.log("  |                                                          |");
  console.log("  |  No macOS o instalador pode pedir sua senha do           |");
  console.log("  |  computador e abrir uma janela do Xcode (~5 min).        |");
  console.log("  +----------------------------------------------------------+");
  console.log("");
}

function getInstaller(
  tool: Tool,
  platform: Platform,
): (() => Promise<void | { profile: string[] }>) | null {
  return tool[platform] ?? null;
}

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

  while (true) {
    console.log("  Digite seu username do GitHub (Enter vazio se sem conta):");
    console.log(`  ${Y}(é o @ do seu perfil, ex: leandromedeiros — não é o email)${N}`);
    const username = await prompt("  > ");

    if (username.length === 0) {
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
        console.log("  e solicite ao HOLANDA a inclusão na organização Inspira");
        console.log("  antes de tentar usar o ambiente.");
        await pause("\n  Pressione Enter para continuar com a instalação...");
        await saveConfig({ pendingGitHubSetup: true });
        return;
      }
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

    log.warn(`Não consegui validar com o GitHub (${result.reason}).`);
    const confirmAnswer = (
      await prompt(`  Prosseguir mesmo assim com "${username}"? (s/N): `)
    ).toLowerCase();
    if (confirmAnswer === "s" || confirmAnswer === "sim") {
      await saveConfig({ githubUsername: username, pendingGitHubSetup: false });
      log.done(`Conta GitHub aceita sem validação: ${username}`);
      return;
    }
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

        // Write profile lines if returned
        if (result && result.profile.length > 0) {
          for (const line of result.profile) {
            if (!(await fileContains(profilePath, line))) {
              await appendFile(profilePath, line);
            }
          }
          log.info(`Atualizado ${profilePath}`);
        }

        log.done(tool.name);
        executed++;

        await refreshPath();
      } catch (err) {
        const e = err as Error & { stderr?: Buffer; stdout?: Buffer };
        const raw = e.stderr?.toString().trim() || e.stdout?.toString().trim() || e.message;
        const output = raw.replace(/^bun: /gm, "");
        log.error(tool.name);
        failed.push({ name: tool.name, output });
      }
    }
  }

  await runTools(installs, "Instalando");
  await runTools(setups, "Configurando");

  // Stop sudo keep-alive
  if (sudoKeepAlive) clearInterval(sudoKeepAlive);

  // Verification
  const R = "\x1b[31m";
  const DIM = "\x1b[2m";
  const verifyFailed: string[] = [];

  const verifiable = installs.filter((t) => t.verify && getInstaller(t, platform));

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

  if (failed.length > 0) {
    console.log(`${R}========================================${N}`);
    console.log(`${R}  Algumas ferramentas falharam:          ${N}`);
    for (const { name, output } of failed) {
      console.log(`${R}    - ${name}${N}`);
      for (const line of output.split("\n").slice(-10)) {
        console.log(`${DIM}      ${line}${N}`);
      }
    }
    console.log(`${R}========================================${N}`);
    console.log("");
    log.info("Corrija os problemas acima e rode builder-setup novamente.");
  }

  if (verifyFailed.length > 0) {
    for (const name of verifyFailed) {
      log.warn(`Desinstale ${name} e rode builder-setup novamente.`);
    }
  }

  if (failed.length > 0 || verifyFailed.length > 0) {
    process.exit(1);
  }

  if (executed === 0) {
    log.info("Tudo já está instalado e configurado.");
  }

  console.log(`${G}========================================${N}`);
  if (wsl) {
    console.log(`${G}  Setup do WSL concluído!               ${N}`);
    console.log(`${G}  Reiniciando WSL em 3 segundos...     ${N}`);
    console.log(`${G}  Abra o Ubuntu novamente após reinício.${N}`);
    console.log(`${G}========================================${N}`);
    await Bun.sleep(3000);
    await $`wsl.exe --shutdown`;
  } else if (platform === "windows") {
    console.log(`${G}  Setup do Windows concluído!           ${N}`);
    console.log(`${G}========================================${N}`);
  } else {
    console.log(`${G}  Setup concluído!                      ${N}`);
    console.log(`${G}  Abra um novo terminal para aplicar.   ${N}`);
    console.log(`${G}========================================${N}`);
  }
}

main().catch((err) => {
  log.error((err as Error).message);
  process.exit(1);
});

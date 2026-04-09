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

function getInstaller(
  tool: Tool,
  platform: Platform,
): (() => Promise<void | { profile: string[] }>) | null {
  return tool[platform] ?? null;
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

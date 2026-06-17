import { $ } from "bun";
import { openSync, closeSync } from "node:fs";
import { installs, setups } from "./tools";
import {
  type Tool,
  type Platform,
  getPlatform,
  isWSL,
  getProfilePath,
  fileContains,
  fileExists,
  appendFile,
  refreshPath,
  log,
  HOME,
} from "./lib";

interface Options {
  /** Install only the slim set (base deps + lexflow essentials). */
  slim: boolean;
  /** Run `lexflow login` + `lexflow doctor` at the end. */
  lexflow: boolean;
}

function parseOptions(): Options {
  return {
    slim: process.env.SLIM === "1",
    lexflow: process.env.LEXFLOW === "1",
  };
}

/** Interactive lexflow login followed by `lexflow doctor`. */
async function lexflowAuth(): Promise<void> {
  let bin = Bun.which("lexflow");
  if (!bin) {
    const fallback = `${HOME}/.local/bin/lexflow`;
    if (await fileExists(fallback)) bin = fallback;
  }
  if (!bin) {
    log.warn("lexflow não encontrado no PATH; pulando login. Rode 'lexflow login' manualmente.");
    return;
  }

  // Under `curl | bash` the process stdin is the pipe, not the terminal, so an
  // interactive login prompt can't read input. Attach the controlling terminal
  // directly. Windows runs in a fresh console already, so "inherit" is fine.
  let stdin: number | "inherit" = "inherit";
  if (process.platform !== "win32") {
    try {
      stdin = openSync("/dev/tty", "r");
    } catch {
      // No controlling terminal (e.g. CI) — fall back to inherited stdin.
    }
  }

  log.step("lexflow login...");
  const login = Bun.spawn([bin, "login"], { stdin, stdout: "inherit", stderr: "inherit" });
  const loginCode = await login.exited;
  if (typeof stdin === "number") closeSync(stdin);
  if (loginCode !== 0) {
    log.warn("lexflow login falhou ou foi cancelado; pulando doctor.");
    return;
  }

  log.step("lexflow doctor...");
  const doctor = Bun.spawn([bin, "doctor"], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  await doctor.exited;
}

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
  const opts = parseOptions();

  const wsl = isWSL();
  const profilePath = getProfilePath();

  // In slim mode only base deps + lexflow essentials are installed.
  const toInstall = opts.slim ? installs.filter((t) => t.slim) : installs;

  const G = "\x1b[32m";
  const C = "\x1b[36m";
  const B = "\x1b[1m";
  const N = "\x1b[0m";

  console.log("");
  console.log(`  ${B}Builder's Setup${N}${opts.slim ? `  ${C}(slim)${N}` : ""}`);
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

  await runTools(toInstall, "Instalando");
  await runTools(setups, "Configurando");

  // Stop sudo keep-alive
  if (sudoKeepAlive) clearInterval(sudoKeepAlive);

  // Verification
  const R = "\x1b[31m";
  const DIM = "\x1b[2m";
  const verifyFailed: string[] = [];

  const verifiable = toInstall.filter((t) => t.verify && getInstaller(t, platform));

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

  if (executed === 0) {
    log.info("Tudo já está instalado e configurado.");
  }

  // lexflow login + doctor, only when explicitly requested. Run this before
  // bailing on failures: a verify miss elsewhere (e.g. fnm-managed Node not on
  // the static PATH on Windows) shouldn't block login when lexflow installed
  // fine. lexflowAuth() guards on finding the binary itself.
  //
  // On Windows this process is elevated (winget needs admin), and an elevated
  // process can't hand a URL to the user's medium-integrity browser — the login
  // gets blocked. There the bootstrap (install-slim.ps1) runs login + doctor in
  // the original, non-elevated shell instead.
  if (opts.lexflow && process.platform !== "win32") {
    await lexflowAuth();
  }

  if (failed.length > 0 || verifyFailed.length > 0) {
    process.exit(1);
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

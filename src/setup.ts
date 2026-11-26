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

const LEXFLOW_URL = "https://lexflow.internal.inspira.legal";
const WAVE_APP = "inspira/wave-cli";
const WAVE_CLI = `wave-cli @ git+${LEXFLOW_URL}/git/${WAVE_APP}.git#subdirectory=cli`;

// Git credential helper scoped to the lexflow host, in the exact shape
// `wave doctor` checks for (wave_cli.py git_helper_line/git_helper_ok).
const GIT_HELPER_KEY = `credential.${LEXFLOW_URL}.helper`;
const GIT_HELPER_FILE = `${HOME}/.config/lexflow/git-credentials-helper.py`;

/** Steps that failed after login, shown next to the final banner instead of lost in the log. */
const pending: string[] = [];

/** On PATH, or in ~/.local/bin (where the lexflow and uv installers drop binaries). */
async function findBin(name: string): Promise<string | null> {
  const bin = Bun.which(name);
  if (bin) return bin;
  const fallback = `${HOME}/.local/bin/${name}`;
  return (await fileExists(fallback)) ? fallback : null;
}

async function run(cmd: string[]): Promise<number> {
  return Bun.spawn(cmd, { stdin: "inherit", stdout: "inherit", stderr: "inherit" }).exited;
}

/**
 * Teach the global git to authenticate against the lexflow host, so `uv tool
 * install git+<lexflow host>` (wave-cli) works.
 *
 * `lexflow clone` only wires the helper into each clone's .git/config, and
 * `lexflow login` only refreshes the helper file when it already exists, so
 * on a machine that never cloned an app nothing answers git's credential
 * request. `lexflow refs <app>` writes the helper file through the CLI's own
 * code (no internal imports) and doubles as an access check on the wave repo.
 */
async function configureLexflowGit(lexflow: string): Promise<boolean> {
  log.step("Configurando o git para o host do lexflow...");
  const refs = Bun.spawn([lexflow, "refs", WAVE_APP], { stdout: "ignore", stderr: "inherit" });
  if ((await refs.exited) !== 0 || !(await fileExists(GIT_HELPER_FILE))) {
    pending.push(
      `wave-cli: sem acesso ao repositório ${WAVE_APP} no lexflow. Confira o login ('lexflow login') e rode o setup de novo.`,
    );
    return false;
  }

  // Argv arrays, not the Bun shell: the reset needs a literal empty argument.
  const gitConfig = (...args: string[]) =>
    Bun.spawnSync(["git", "config", "--global", ...args], { stdout: "pipe", stderr: "ignore" });

  const values = gitConfig("--get-all", GIT_HELPER_KEY).stdout.toString().split("\n").slice(0, -1);
  // Empty entry first resets the host's helper list, so osxkeychain can't
  // answer with a stale 1h token before ours. Same check as `wave doctor`.
  if (values.length >= 2 && values[0] === "" && values.slice(1).some(Boolean)) return true;

  // Absolute path on purpose: git doesn't expand `~` inside a helper value.
  const ok =
    gitConfig("--replace-all", GIT_HELPER_KEY, "").exitCode === 0 &&
    gitConfig("--add", GIT_HELPER_KEY, `!python3 ${GIT_HELPER_FILE}`).exitCode === 0;
  if (!ok) {
    pending.push(
      "git: não foi possível configurar a credencial do lexflow. Rode 'wave doctor' e siga a linha que ele sugerir.",
    );
  }
  return ok;
}

/** wave-cli + its Claude skill. Needs `lexflow login` first: the repo lives on the lexflow git host. */
async function installWave(): Promise<void> {
  const uv = await findBin("uv");
  if (!uv) {
    log.warn(`uv não encontrado; pulando wave-cli. Rode 'uv tool install "${WAVE_CLI}"'.`);
    pending.push("wave-cli: uv não encontrado. Rode o setup de novo.");
    return;
  }

  log.step("Instalando wave-cli...");
  // One retry: the lexflow git host returns 500 now and then (wave-cli README),
  // and right after a lexflow upgrade the first git call may still miss auth.
  let code = await run([uv, "tool", "install", "--upgrade", WAVE_CLI]);
  if (code !== 0) {
    log.info("Tentando de novo em 10s...");
    await Bun.sleep(10_000);
    code = await run([uv, "tool", "install", "--upgrade", WAVE_CLI]);
  }
  if (code !== 0) {
    log.warn("Falha ao instalar wave-cli.");
    pending.push(
      "wave-cli: falhou ao instalar. Rode o setup de novo; se repetir, rode 'wave doctor'.",
    );
    return;
  }

  const wave = await findBin("wave");
  if (!wave) {
    log.warn(
      "wave não encontrado após instalar; rode 'wave skill install' e 'wave doctor' manualmente.",
    );
    return;
  }

  log.step("wave skill install...");
  if ((await run([wave, "skill", "install"])) !== 0) log.warn("Falha ao instalar a skill do Wave.");

  log.step("wave doctor...");
  await run([wave, "doctor"]);
}

/** Interactive lexflow login + `lexflow doctor`, then wave-cli (install, skill, `wave doctor`). */
async function lexflowAuth(): Promise<void> {
  const bin = await findBin("lexflow");
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
    log.warn("lexflow login falhou ou foi cancelado; pulando doctor e wave-cli.");
    pending.push("lexflow: login não concluído. Rode o setup de novo.");
    return;
  }

  // The lexflow tool is skipped when already installed, so an old CLI would
  // stick forever (pre-1.2 sessions expire after 1h and break git). Upgrade it
  // here, after login, since the CLI is fetched from the lexflow host.
  log.step("lexflow self-update...");
  if ((await run([bin, "self-update"])) !== 0) {
    pending.push("lexflow: não foi possível atualizar. Rode 'lexflow self-update'.");
  }

  log.step("lexflow doctor...");
  await run([bin, "doctor"]);

  if (await configureLexflowGit(bin)) await installWave();
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

  // lexflow login + doctor + wave-cli, only when explicitly requested. Run this before
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

  if (pending.length > 0) {
    console.log("");
    console.log(`  ${B}Pendências${N}`);
    for (const item of pending) log.warn(item);
    console.log("");
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
  if (!wsl)
    log.info(
      "Safira: abra o portal Safira e use 'Conectar Claude Desktop' para ligar seu ambiente.",
    );
}

main().catch((err) => {
  log.error((err as Error).message);
  process.exit(1);
});

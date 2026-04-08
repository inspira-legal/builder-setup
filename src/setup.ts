import { $ } from "bun";
import { tools } from "./tools";
import {
  type Tool,
  type Platform,
  getPlatform,
  isWSL,
  getProfilePath,
  fileContains,
  appendFile,
  log,
} from "./lib";

function getInstaller(
  tool: Tool,
  platform: Platform,
): (() => Promise<void | { profile: string[] }>) | null {
  return tool[platform] ?? null;
}

async function isInstalled(tool: Tool): Promise<boolean> {
  if (tool.check) return tool.check();
  if (tool.bin) return Bun.which(tool.bin) !== null;
  return false;
}

async function main() {
  const platform = getPlatform();

  if (platform === "windows") {
    // CMD sets PROMPT env var (e.g. "$P$G"), PowerShell does not
    if (process.env.PROMPT) {
      console.error("\x1b[31mError: Please run this from PowerShell, not CMD.\x1b[0m");
      process.exit(1);
    }
    // Check for Administrator privileges
    const admin =
      await $`powershell -NoProfile -Command "([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"`.text();
    if (admin.trim() !== "True") {
      console.error("\x1b[31mError: Please run this as Administrator.\x1b[0m");
      console.error("Right-click PowerShell -> 'Run as Administrator' and try again.");
      process.exit(1);
    }
  }

  const wsl = isWSL();
  const profilePath = getProfilePath();

  const G = "\x1b[32m";
  const C = "\x1b[36m";
  const B = "\x1b[1m";
  const N = "\x1b[0m";

  console.log("");
  console.log(`  ${B}builder-setup${N}`);
  console.log(`  ${C}Platform:${N} ${platform}${wsl ? " (WSL)" : ""}`);
  console.log(`  ${C}Arch:${N}     ${process.arch}`);
  if (platform !== "windows") {
    console.log(`  ${C}Profile:${N}  ${profilePath}`);
  }

  // Pre-cache sudo on linux (macOS tools don't need sudo)
  let sudoKeepAlive: Timer | undefined;
  if (platform === "linux") {
    console.log("");
    log.info("This script needs sudo access to install packages.");
    await $`sudo -v`;

    // Keep sudo alive in the background
    sudoKeepAlive = setInterval(() => {
      Bun.spawn(["sudo", "-n", "true"], {
        stdout: "ignore",
        stderr: "ignore",
      });
    }, 50_000);
  }

  // Run each tool
  const failed: { name: string; output: string }[] = [];

  for (const tool of tools) {
    if (tool.when && !tool.when()) continue;

    log.step(`Checking ${tool.name}...`);

    const installer = getInstaller(tool, platform);
    if (!installer) {
      log.skip("not applicable on this platform");
      continue;
    }

    if (await isInstalled(tool)) {
      log.skip("already installed");
      continue;
    }

    try {
      const result = await installer();

      // Write profile lines if returned
      if (result && result.profile.length > 0) {
        for (const line of result.profile) {
          if (!(await fileContains(profilePath, line))) {
            await appendFile(profilePath, line);
          }
        }
        log.info(`Updated ${profilePath}`);
      }

      // Verify binary is actually available after install
      if (tool.bin && !Bun.which(tool.bin)) {
        log.warn(
          `${tool.name} installed but "${tool.bin}" not found in PATH. Will be available after restart.`,
        );
      }

      log.done(tool.name);
    } catch (err) {
      const e = err as Error & { stderr?: Buffer; stdout?: Buffer };
      const output = e.stderr?.toString().trim() || e.stdout?.toString().trim() || e.message;
      log.error(tool.name);
      failed.push({ name: tool.name, output });
    }
  }

  // Stop sudo keep-alive
  if (sudoKeepAlive) clearInterval(sudoKeepAlive);

  // Completion
  console.log("");

  if (failed.length > 0) {
    const R = "\x1b[31m";
    const DIM = "\x1b[2m";
    console.log(`${R}========================================${N}`);
    console.log(`${R}  Some tools failed to install:         ${N}`);
    for (const { name, output } of failed) {
      console.log(`${R}    - ${name}${N}`);
      for (const line of output.split("\n").slice(-10)) {
        console.log(`${DIM}      ${line}${N}`);
      }
    }
    console.log(`${R}========================================${N}`);
    console.log("");
    log.info("Fix the issues above and run builder-setup again.");
    process.exit(1);
  }

  console.log(`${G}========================================${N}`);
  if (wsl) {
    console.log(`${G}  WSL setup complete!                   ${N}`);
    console.log(`${G}  Restarting WSL in 3 seconds...        ${N}`);
    console.log(`${G}  Open Ubuntu again after restart.      ${N}`);
    console.log(`${G}========================================${N}`);
    await Bun.sleep(3000);
    await $`wsl.exe --shutdown`;
  } else if (platform === "windows") {
    console.log(`${G}  Windows setup complete!               ${N}`);
    console.log(`${G}========================================${N}`);
  } else {
    console.log(`${G}  Setup complete!                       ${N}`);
    console.log(`${G}  Open a new terminal to apply changes. ${N}`);
    console.log(`${G}========================================${N}`);
  }
}

main().catch((err) => {
  log.error((err as Error).message);
  process.exit(1);
});

import { $ } from "bun";
import {
  type Tool,
  log,
  has,
  isWSL,
  getProfilePath,
  fileExists,
  fileContains,
  appendFile,
  HOME,
} from "./lib";

// ── Constants ──

const FNM_DIR = `${HOME}/.local/share/fnm`;
const FNM = `${FNM_DIR}/fnm`;

// ── Shared helpers ──

async function winget(id: string) {
  const proc = Bun.spawn(
    [
      "powershell.exe",
      "-Command",
      `winget install -e --id ${id} --accept-source-agreements --accept-package-agreements --silent`,
    ],
    { stdout: "inherit", stderr: "inherit" },
  );

  const timeout = setTimeout(() => proc.kill(), 5 * 60_000);
  const exitCode = await proc.exited;
  clearTimeout(timeout);

  if (exitCode !== 0) {
    throw new Error(`winget install ${id} falhou (exit ${exitCode})`);
  }
}

async function installDockerApt() {
  await $`sudo apt install -y ca-certificates curl`;
  await $`sudo install -m 0755 -d /etc/apt/keyrings`.quiet();
  await $`sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc`.quiet();
  await $`sudo chmod a+r /etc/apt/keyrings/docker.asc`.quiet();

  const arch = (await $`dpkg --print-architecture`.text()).trim();
  const script = '. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}"';
  const codename = (await $`bash -c ${script}`.text()).trim();
  const sources = `Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${codename}
Components: stable
Architectures: ${arch}
Signed-By: /etc/apt/keyrings/docker.asc`;
  await Bun.write("/tmp/docker.sources", sources + "\n");
  await $`sudo cp /tmp/docker.sources /etc/apt/sources.list.d/docker.sources`.quiet();

  await $`sudo apt update`;
  await $`sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`;
  await $`sudo systemctl enable --now docker`.quiet().nothrow();

  const groups = await $`groups`.text();
  if (!groups.includes("docker")) {
    await $`sudo usermod -aG docker ${process.env.USER}`.quiet();
  }
}

// ── Install list ──

export const installs: Tool[] = [
  {
    name: "System packages",
    check: async () => {
      if (process.platform === "darwin") return has("brew");
      return false;
    },
    linux: async () => {
      await $`sudo apt update`;
    },
    darwin: async () => {
      if (!has("brew")) {
        await $`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`;
      }
    },
  },

  {
    name: "unzip",
    bin: "unzip",
    linux: async () => {
      await $`sudo apt install -y unzip`;
    },
  },

  {
    name: "Git",
    bin: "git",
    test: "git --version",
    linux: async () => {
      await $`sudo apt install -y git`;
    },
    darwin: async () => {
      await $`brew install git`;
    },
    windows: async () => {
      await winget("Git.Git");
    },
  },

  {
    name: "Docker",
    bin: "docker",
    test: "docker --version",
    linux: async () => {
      if (isWSL() && !(await fileContains("/etc/wsl.conf", "systemd=true"))) {
        await $`printf '\n[boot]\nsystemd=true\n' | sudo tee -a /etc/wsl.conf > /dev/null`;
        log.done("systemd habilitado em wsl.conf");
      }
      await installDockerApt();
    },
    darwin: async () => {
      await $`brew install --cask docker-desktop`;
    },
    windows: async () => {
      await winget("Docker.DockerDesktop");
    },
  },

  {
    name: "GitHub CLI",
    bin: "gh",
    test: "gh --version",
    linux: async () => {
      await $`sudo mkdir -p -m 755 /etc/apt/keyrings`.quiet();
      await $`curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null`.quiet();
      await $`sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg`.quiet();

      const arch = (await $`dpkg --print-architecture`.text()).trim();
      const sources = `Types: deb
URIs: https://cli.github.com/packages
Suites: stable
Components: main
Architectures: ${arch}
Signed-By: /etc/apt/keyrings/githubcli-archive-keyring.gpg`;
      await Bun.write("/tmp/github-cli.sources", sources + "\n");
      await $`sudo cp /tmp/github-cli.sources /etc/apt/sources.list.d/github-cli.sources`.quiet();

      await $`sudo apt update`;
      await $`sudo apt install -y gh`;
    },
    darwin: async () => {
      await $`brew install gh`;
    },
    windows: async () => {
      await winget("GitHub.cli");
    },
  },

  // ────────────────────────────────────────
  //  Dev runtimes
  // ────────────────────────────────────────

  {
    name: "fnm",
    test: "fnm --version",
    check: async () => has("fnm") || (await fileExists(FNM)),
    linux: async () => {
      await $`curl -fsSL https://fnm.vercel.app/install | bash`;
    },
    darwin: async () => {
      await $`brew install fnm`;
    },
    windows: async () => {
      await winget("Schniz.fnm");
    },
  },

  {
    name: "Node.js",
    check: async () => {
      if (!has("fnm") && !(await fileExists(FNM))) return true;
      const result = await $`fnm ls`.quiet().nothrow();
      return result.exitCode === 0 && result.stdout.toString().trim().length > 0;
    },
    linux: async () => {
      await $`fnm install --lts`;
      await $`fnm default lts-latest`;
    },
    darwin: async () => {
      await $`fnm install --lts`;
      await $`fnm default lts-latest`;
    },
    windows: async () => {
      await $`fnm install --lts`;
      await $`fnm default lts-latest`;
    },
  },

  {
    name: "Bun",
    bin: "bun",
    test: "bun --version",
    linux: async () => {
      await $`curl -fsSL https://bun.com/install | bash`;
    },
    darwin: async () => {
      await $`curl -fsSL https://bun.com/install | bash`;
    },
    windows: async () => {
      await $`powershell -NoProfile -Command "irm bun.sh/install.ps1 | iex"`;
    },
  },

  {
    name: "pnpm",
    bin: "pnpm",
    test: "pnpm --version",
    linux: async () => {
      await $`curl -fsSL https://get.pnpm.io/install.sh | sh -`;
    },
    darwin: async () => {
      await $`curl -fsSL https://get.pnpm.io/install.sh | sh -`;
    },
    windows: async () => {
      await winget("pnpm.pnpm");
    },
  },

  {
    name: "uv",
    bin: "uv",
    test: "uv --version",
    linux: async () => {
      await $`curl -LsSf https://astral.sh/uv/install.sh | sh`;
    },
    darwin: async () => {
      await $`curl -LsSf https://astral.sh/uv/install.sh | sh`;
    },
    windows: async () => {
      await winget("astral-sh.uv");
    },
  },

  {
    name: "Python",
    check: async () => (process.platform === "win32" ? has("python") : has("python3")),
    test: process.platform === "win32" ? "python --version" : "python3 --version",
    linux: async () => {
      await $`sudo apt install -y python3`;
    },
    darwin: async () => {
      await $`uv python install`;
    },
    windows: async () => {
      await winget("Python.Python.3.14");
    },
  },

  // ────────────────────────────────────────
  //  Cloud tools
  // ────────────────────────────────────────

  {
    name: "Google Cloud SDK",
    test: "gcloud --version",
    check: async () => has("gcloud") || (await fileExists(`${HOME}/google-cloud-sdk/bin/gcloud`)),
    linux: async () => {
      await $`curl -fsSL https://sdk.cloud.google.com | bash -s -- --disable-prompts`;
    },
    darwin: async () => {
      await $`curl -fsSL https://sdk.cloud.google.com | bash -s -- --disable-prompts`;
    },
    windows: async () => {
      await winget("Google.CloudSDK");
    },
  },

  {
    name: "VS Code",
    test: "code --version",
    check: async () => {
      // On WSL, VS Code comes from Windows via PATH interop
      if (isWSL()) return true;
      return has("code");
    },
    linux: async () => {
      await $`curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | sudo gpg --batch --yes --dearmor -o /etc/apt/keyrings/packages.microsoft.gpg`.quiet();
      await $`sudo chmod go+r /etc/apt/keyrings/packages.microsoft.gpg`.quiet();

      const sources = `Types: deb
URIs: https://packages.microsoft.com/repos/code
Suites: stable
Components: main
Architectures: amd64,arm64
Signed-By: /etc/apt/keyrings/packages.microsoft.gpg`;
      await Bun.write("/tmp/vscode.sources", sources + "\n");
      await $`sudo cp /tmp/vscode.sources /etc/apt/sources.list.d/vscode.sources`.quiet();

      await $`sudo apt update`;
      await $`sudo apt install -y code`;
    },
    darwin: async () => {
      await $`brew install --cask visual-studio-code`;
    },
    windows: async () => {
      await winget("Microsoft.VisualStudioCode");
    },
  },

  {
    name: "Claude Code",
    test: "claude --version",
    check: async () => has("claude") || (await fileExists(`${HOME}/.claude/bin/claude`)),
    linux: async () => {
      await $`curl -fsSL https://claude.ai/install.sh | bash`;
    },
    darwin: async () => {
      await $`curl -fsSL https://claude.ai/install.sh | bash`;
    },
    windows: async () => {
      await $`powershell -NoProfile -Command "irm https://claude.ai/install.ps1 | iex"`;
    },
  },
];

// ── Setup list ──

export const setups: Tool[] = [
  {
    name: "Git config",
    check: async () => {
      if (!has("git")) return true;
      const result = await $`git config --global init.defaultBranch`.quiet().nothrow();
      return result.stdout.toString().trim() === "main";
    },
    linux: async () => {
      await $`git config --global init.defaultBranch main`.quiet();
    },
    darwin: async () => {
      await $`git config --global init.defaultBranch main`.quiet();
    },
    windows: async () => {
      await $`git config --global init.defaultBranch main`.quiet();
    },
  },

  {
    name: "fnm profile",
    check: async () => {
      if (!has("fnm") && !(await fileExists(FNM))) return true;
      return fileContains(getProfilePath(), 'eval "$(fnm env');
    },
    linux: async () => ({
      profile: ['export PATH="$HOME/.local/share/fnm:$PATH"', 'eval "$(fnm env --use-on-cd)"'],
    }),
    darwin: async () => ({
      profile: ['eval "$(fnm env --use-on-cd)"'],
    }),
  },

  {
    name: "fnm PowerShell",
    check: async () => {
      if (!has("fnm")) return true;
      const ps5 = `${HOME}\\Documents\\WindowsPowerShell\\Microsoft.PowerShell_profile.ps1`;
      const ps7 = `${HOME}\\Documents\\PowerShell\\Microsoft.PowerShell_profile.ps1`;
      return (await fileContains(ps5, "fnm env")) && (await fileContains(ps7, "fnm env"));
    },
    windows: async () => {
      const line = "fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression";
      const ps5 = `${HOME}\\Documents\\WindowsPowerShell\\Microsoft.PowerShell_profile.ps1`;
      const ps7 = `${HOME}\\Documents\\PowerShell\\Microsoft.PowerShell_profile.ps1`;

      for (const profile of [ps5, ps7]) {
        if (!(await fileContains(profile, "fnm env"))) {
          await appendFile(profile, line);
          log.info(`Atualizado ${profile}`);
        }
      }
    },
  },

  {
    name: "fnm Git Bash",
    check: async () => {
      if (!has("fnm")) return true;
      return fileContains(`${HOME}/.bashrc`, "fnm env");
    },
    windows: async () => {
      const bashrc = `${HOME}/.bashrc`;
      const line = 'eval "$(fnm env --use-on-cd)"';
      if (!(await fileContains(bashrc, line))) {
        await appendFile(bashrc, line);
      }
      log.info(`Atualizado ${bashrc}`);
    },
  },

  {
    name: "fnm CMD",
    check: async () => {
      if (!has("fnm")) return true;
      const cmdrc = `${HOME}\\cmdrc.bat`;
      if (!(await fileContains(cmdrc, "__FNM_SETUP"))) return false;
      const result = await $`reg query "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun`
        .quiet()
        .nothrow();
      return result.exitCode === 0 && result.stdout.toString().includes("cmdrc.bat");
    },
    windows: async () => {
      const cmdrc = `${HOME}\\cmdrc.bat`;
      // Guard prevents infinite recursion: FOR /f spawns a child cmd.exe,
      // which triggers AutoRun → cmdrc.bat again. The guard breaks the cycle.
      const content = [
        "@IF DEFINED __FNM_SETUP EXIT /B",
        "@SET __FNM_SETUP=1",
        `@FOR /f "tokens=*" %%i IN ('fnm env --use-on-cd --shell cmd') DO @CALL %%i`,
      ].join("\r\n");

      if (!(await fileContains(cmdrc, "__FNM_SETUP"))) {
        await Bun.write(cmdrc, content + "\r\n");
        log.info(`Atualizado ${cmdrc}`);
      }

      const result = await $`reg query "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun`
        .quiet()
        .nothrow();
      if (result.exitCode !== 0) {
        await $`reg add "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /t REG_SZ /d "${cmdrc}" /f`.quiet();
        log.info("AutoRun configurado no registro");
      } else if (!result.stdout.toString().includes("cmdrc.bat")) {
        const match = result.stdout.toString().match(/REG_SZ\s+(.*)/);
        const existing = match?.[1]?.trim() ?? "";
        await $`reg add "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /t REG_SZ /d "${existing} & ${cmdrc}" /f`.quiet();
        log.info("AutoRun atualizado no registro");
      }
    },
  },

  {
    name: "WSL config",
    check: async () => {
      if (!isWSL()) return true;
      const profile = getProfilePath();
      return (
        (await fileContains(profile, 'export EDITOR="code --wait"')) &&
        (await fileContains(profile, "export BROWSER="))
      );
    },
    linux: async () => {
      await $`git config --global core.editor "code --wait"`.quiet();

      const lines = ['export EDITOR="code --wait"', 'export VISUAL="code --wait"'];

      const winUser = (await $`cmd.exe /c "echo %USERNAME%"`.text()).trim().replace(/\r/g, "");
      const chrome = `/mnt/c/Users/${winUser}/AppData/Local/Google/Chrome/Application/chrome.exe`;
      const edge = "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

      if (await fileExists(chrome)) {
        log.done("BROWSER definido como Chrome");
        lines.push(`export BROWSER="${chrome}"`);
      } else if (await fileExists(edge)) {
        log.done("BROWSER definido como Edge");
        lines.push(`export BROWSER="${edge}"`);
      } else {
        log.info("Chrome ou Edge não encontrado no Windows, pulando BROWSER");
      }

      return { profile: lines };
    },
  },
];

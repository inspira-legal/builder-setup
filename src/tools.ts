import { $ } from "bun";
import { type Tool, log, has, isWSL, getProfilePath, fileExists, fileContains, HOME } from "./lib";

// ── Constants ──

const FNM_DIR = `${HOME}/.local/share/fnm`;
const FNM = `${FNM_DIR}/fnm`;

// ── Shared helpers ──

function fnmBin(): string {
  return has("fnm") ? "fnm" : FNM;
}

async function installDockerApt() {
  await $`sudo install -m 0755 -d /etc/apt/keyrings`;
  await $`curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /tmp/docker.asc`;
  await $`sudo cp /tmp/docker.asc /etc/apt/keyrings/docker.asc`;
  await $`sudo chmod a+r /etc/apt/keyrings/docker.asc`;

  const arch = (await $`dpkg --print-architecture`.text()).trim();
  const codename = (await $`bash -c '. /etc/os-release && echo $VERSION_CODENAME'`.text()).trim();
  const repo = `deb [arch=${arch} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${codename} stable`;
  await Bun.write("/tmp/docker.list", repo + "\n");
  await $`sudo cp /tmp/docker.list /etc/apt/sources.list.d/docker.list`;

  await $`sudo apt update`;
  await $`sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`;
  await $`sudo systemctl enable --now docker`.nothrow();

  const groups = await $`groups`.text();
  if (!groups.includes("docker")) {
    await $`sudo usermod -aG docker ${process.env.USER}`;
  }
}

// ── Tool list ──

export const tools: Tool[] = [
  // ────────────────────────────────────────
  //  System essentials
  // ────────────────────────────────────────

  {
    name: "System packages",
    check: async () => {
      if (process.platform === "darwin") return has("brew");
      const result = await $`stat -c %Y /var/lib/apt/lists/partial`.quiet().nothrow();
      if (result.exitCode !== 0) return false;
      const ts = result.stdout.toString().trim();
      return Math.floor(Date.now() / 1000) - parseInt(ts || "0") < 86400;
    },
    linux: async () => {
      await $`sudo apt update && sudo apt upgrade -y`;
    },
    darwin: async () => {
      if (!has("brew")) {
        await $`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`;
      }
    },
  },

  {
    name: "Git",
    bin: "git",
    windows: async () => {
      await $`winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements`;
    },
  },

  {
    name: "Git defaults",
    check: async () => {
      const result = await $`git config --global init.defaultBranch`.quiet().nothrow();
      return result.stdout.toString().trim() === "main";
    },
    linux: async () => {
      await $`git config --global init.defaultBranch main`;
    },
    darwin: async () => {
      await $`git config --global init.defaultBranch main`;
    },
    windows: async () => {
      await $`git config --global init.defaultBranch main`;
    },
  },

  {
    name: "Docker",
    bin: "docker",
    linux: async () => {
      if (isWSL() && !(await fileContains("/etc/wsl.conf", "systemd=true"))) {
        await $`printf '\n[boot]\nsystemd=true\n' | sudo tee -a /etc/wsl.conf > /dev/null`;
        log.done("systemd enabled in wsl.conf");
      }
      await installDockerApt();
    },
    darwin: async () => {
      await $`brew install --cask docker-desktop`;
    },
    windows: async () => {
      await $`winget install -e --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements`;
    },
  },

  {
    name: "GitHub CLI",
    bin: "gh",
    linux: async () => {
      await $`sudo mkdir -p -m 755 /etc/apt/keyrings`;
      await $`curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null`;
      await $`sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg`;

      const arch = (await $`dpkg --print-architecture`.text()).trim();
      const sources = `Types: deb
URIs: https://cli.github.com/packages
Suites: stable
Components: main
Architectures: ${arch}
Signed-By: /etc/apt/keyrings/githubcli-archive-keyring.gpg`;
      await Bun.write("/tmp/github-cli.sources", sources + "\n");
      await $`sudo cp /tmp/github-cli.sources /etc/apt/sources.list.d/github-cli.sources`;

      await $`sudo apt update`;
      await $`sudo apt install -y gh`;
    },
    darwin: async () => {
      await $`brew install gh`;
    },
    windows: async () => {
      await $`winget install -e --id GitHub.cli --accept-source-agreements --accept-package-agreements`;
    },
  },

  // ────────────────────────────────────────
  //  Dev runtimes
  // ────────────────────────────────────────

  {
    name: "Node.js (fnm)",
    check: async () => {
      if (!has("fnm") && !(await fileExists(FNM))) return false;
      const result = await $`${fnmBin()} ls`.quiet().nothrow();
      return result.exitCode === 0 && result.stdout.toString().trim().length > 0;
    },
    linux: async () => {
      await $`curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell`;
      await $`${FNM} install --lts`;
      await $`${FNM} default lts-latest`;
      return {
        profile: ['export PATH="$HOME/.local/share/fnm:$PATH"', 'eval "$(fnm env --use-on-cd)"'],
      };
    },
    darwin: async () => {
      await $`curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell`;
      await $`${FNM} install --lts`;
      await $`${FNM} default lts-latest`;
      return {
        profile: ['export PATH="$HOME/.local/share/fnm:$PATH"', 'eval "$(fnm env --use-on-cd)"'],
      };
    },
    windows: async () => {
      await $`winget install -e --id Schniz.fnm --accept-source-agreements --accept-package-agreements`;
      // Refresh PATH so fnm is available in this session
      process.env.PATH = (
        await $`powershell -NoProfile -Command "[System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')"`.text()
      ).trim();
      await $`fnm install --lts`;
      await $`fnm default lts-latest`;
    },
  },

  {
    name: "Bun",
    bin: "bun",
    linux: async () => {
      await $`curl -fsSL https://bun.com/install | bash`;
    },
    darwin: async () => {
      await $`curl -fsSL https://bun.com/install | bash`;
    },
    windows: async () => {
      await $`powershell -NoProfile -Command ${"irm bun.sh/install.ps1 | iex"}`;
    },
  },

  {
    name: "pnpm",
    bin: "pnpm",
    linux: async () => {
      await $`curl -fsSL https://get.pnpm.io/install.sh | sh -`;
    },
    darwin: async () => {
      await $`curl -fsSL https://get.pnpm.io/install.sh | sh -`;
    },
    windows: async () => {
      await $`powershell -NoProfile -Command ${"irm https://get.pnpm.io/install.ps1 | iex"}`;
    },
  },

  {
    name: "Go",
    bin: "go",
    linux: async () => {
      const version = (await $`curl -fsSL ${"https://go.dev/VERSION?m=text"}`.text())
        .trim()
        .split("\n")[0];
      const arch = process.arch === "x64" ? "amd64" : "arm64";
      await $`curl -fsSL https://go.dev/dl/${version}.linux-${arch}.tar.gz -o /tmp/go.tar.gz`;
      await $`sudo rm -rf /usr/local/go`;
      await $`sudo tar -C /usr/local -xzf /tmp/go.tar.gz`;
      await $`rm /tmp/go.tar.gz`;
      return { profile: ['export PATH="/usr/local/go/bin:$PATH"'] };
    },
    darwin: async () => {
      await $`brew install go`;
    },
    windows: async () => {
      await $`winget install -e --id GoLang.Go --accept-source-agreements --accept-package-agreements`;
    },
  },

  {
    name: "uv",
    bin: "uv",
    linux: async () => {
      await $`curl -LsSf https://astral.sh/uv/install.sh | sh`;
    },
    darwin: async () => {
      await $`curl -LsSf https://astral.sh/uv/install.sh | sh`;
    },
    windows: async () => {
      await $`powershell -ExecutionPolicy ByPass -NoProfile -Command ${"irm https://astral.sh/uv/install.ps1 | iex"}`;
    },
  },

  // ────────────────────────────────────────
  //  Cloud tools
  // ────────────────────────────────────────

  {
    name: "Google Cloud SDK",
    check: async () => has("gcloud") || (await fileExists(`${HOME}/google-cloud-sdk/bin/gcloud`)),
    linux: async () => {
      await $`curl -fsSL https://sdk.cloud.google.com | bash -s -- --disable-prompts`;
    },
    darwin: async () => {
      await $`curl -fsSL https://sdk.cloud.google.com | bash -s -- --disable-prompts`;
    },
    windows: async () => {
      await $`winget install -e --id Google.CloudSDK --accept-source-agreements --accept-package-agreements`;
    },
  },

  {
    name: "VS Code",
    bin: "code",
    linux: async () => {
      await $`curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | sudo gpg --dearmor -o /etc/apt/keyrings/packages.microsoft.gpg`;
      await $`sudo chmod go+r /etc/apt/keyrings/packages.microsoft.gpg`;

      const sources = `Types: deb
URIs: https://packages.microsoft.com/repos/code
Suites: stable
Components: main
Architectures: amd64,arm64
Signed-By: /etc/apt/keyrings/packages.microsoft.gpg`;
      await Bun.write("/tmp/vscode.sources", sources + "\n");
      await $`sudo cp /tmp/vscode.sources /etc/apt/sources.list.d/vscode.sources`;

      await $`sudo apt update`;
      await $`sudo apt install -y code`;
    },
    darwin: async () => {
      await $`brew install --cask visual-studio-code`;
    },
    windows: async () => {
      await $`winget install -e --id Microsoft.VisualStudioCode --accept-source-agreements --accept-package-agreements`;
    },
  },

  {
    name: "Claude Code",
    check: async () => has("claude") || (await fileExists(`${HOME}/.claude/bin/claude`)),
    linux: async () => {
      await $`curl -fsSL https://claude.ai/install.sh | bash`;
    },
    darwin: async () => {
      await $`curl -fsSL https://claude.ai/install.sh | bash`;
    },
    windows: async () => {
      await $`powershell -NoProfile -Command ${"irm https://claude.ai/install.ps1 | iex"}`;
    },
  },

  // ────────────────────────────────────────
  //  WSL-specific config (guarded by isWSL)
  // ────────────────────────────────────────

  {
    name: "WSL post config",
    when: () => isWSL(),
    check: async () => {
      const profile = getProfilePath();
      return (
        (await fileContains(profile, 'export EDITOR="code --wait"')) &&
        (await fileContains(profile, "export BROWSER="))
      );
    },
    linux: async () => {
      await $`git config --global core.editor "code --wait"`;

      const lines = ['export EDITOR="code --wait"', 'export VISUAL="code --wait"'];

      const winUser = (await $`cmd.exe /c "echo %USERNAME%"`.text()).trim().replace(/\r/g, "");
      const chrome = `/mnt/c/Users/${winUser}/AppData/Local/Google/Chrome/Application/chrome.exe`;
      const edge = "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

      if (await fileExists(chrome)) {
        log.done("BROWSER set to Chrome");
        lines.push(`export BROWSER="${chrome}"`);
      } else if (await fileExists(edge)) {
        log.done("BROWSER set to Edge");
        lines.push(`export BROWSER="${edge}"`);
      } else {
        log.info("No Chrome or Edge found in Windows, skipping BROWSER");
      }

      return { profile: lines };
    },
  },
];

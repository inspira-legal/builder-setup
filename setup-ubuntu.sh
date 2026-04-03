#!/usr/bin/env bash
# Ubuntu Setup Script - idempotent, skips completed steps
# Works on both WSL and native Ubuntu
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

step()  { echo -e "\n${CYAN}==> $1${NC}"; }
skip()  { echo -e "    ${YELLOW}[SKIP]${NC} $1"; }
done_() { echo -e "    ${GREEN}[DONE]${NC} $1"; }

# ---- Pre-cache sudo password ----
echo -e "${CYAN}This script needs sudo access to install packages.${NC}"
sudo -v || { echo "sudo is required. Exiting."; exit 1; }
# Keep sudo alive in the background
while true; do sudo -n true; sleep 50; kill -0 "$$" || exit; done 2>/dev/null &

# ---- apt update & upgrade ----
step "Checking apt update..."
LAST_UPDATE=$(stat -c %Y /var/lib/apt/lists/partial 2>/dev/null || echo 0)
NOW=$(date +%s)
DIFF=$(( NOW - LAST_UPDATE ))
if [ "$DIFF" -gt 86400 ]; then
    echo "    Running apt update & upgrade..."
    sudo apt update && sudo apt upgrade -y
    done_ "apt updated"
else
    skip "apt updated less than 24h ago"
fi

# ---- Git config ----
step "Checking git config..."
CURRENT_BRANCH=$(git config --global init.defaultBranch 2>/dev/null || true)
if [ "$CURRENT_BRANCH" != "main" ]; then
    git config --global init.defaultBranch main
    done_ "Git default branch set to main"
else
    skip "Git default branch already set"
fi

if [ -z "$(git config --global user.name 2>/dev/null)" ]; then
    read -rp "    Git name: " GIT_NAME
    git config --global user.name "$GIT_NAME"
    done_ "Git name set to $GIT_NAME"
else
    skip "Git name already set ($(git config --global user.name))"
fi

if [ -z "$(git config --global user.email 2>/dev/null)" ]; then
    read -rp "    Git email: " GIT_EMAIL
    git config --global user.email "$GIT_EMAIL"
    done_ "Git email set to $GIT_EMAIL"
else
    skip "Git email already set ($(git config --global user.email))"
fi

# ---- Docker CE ----
step "Checking Docker..."
if ! command -v docker &>/dev/null; then
    echo "    Installing Docker CE..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /tmp/docker.asc
    sudo cp /tmp/docker.asc /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
    sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    done_ "Docker CE installed"
else
    skip "Docker already installed"
fi

if ! groups "$USER" | grep -q '\bdocker\b'; then
    sudo usermod -aG docker "$USER"
    done_ "Added $USER to docker group"
else
    skip "$USER already in docker group"
fi

# ---- GitHub CLI ----
step "Checking GitHub CLI..."
if ! command -v gh &>/dev/null; then
    echo "    Installing GitHub CLI..."
    sudo mkdir -p -m 755 /etc/apt/keyrings
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
    sudo apt update && sudo apt install -y gh
    done_ "GitHub CLI installed"
else
    skip "GitHub CLI already installed"
fi

# ---- Mise ----
step "Checking mise..."
if [ ! -f ~/.local/bin/mise ]; then
    echo "    Installing mise..."
    curl -fsSL https://mise.run | sh
    done_ "Mise installed"
else
    skip "Mise already installed"
fi

if ! grep -q 'mise activate bash' ~/.bashrc 2>/dev/null; then
    echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc
    done_ "Mise activation added to .bashrc"
else
    skip "Mise activation already in .bashrc"
fi

# Source mise for this session
eval "$(~/.local/bin/mise activate bash)"

# ---- Mise trust all paths ----
step "Checking mise trust config..."
MISE_CONFIG=~/.config/mise/config.toml
mkdir -p ~/.config/mise
if ! grep -q 'trusted_config_paths' "$MISE_CONFIG" 2>/dev/null; then
    echo -e '[settings]\ntrusted_config_paths = ["/"]' >> "$MISE_CONFIG"
    done_ "Mise set to trust all paths"
else
    skip "Mise trust config already set"
fi

# ---- Mise tools ----
step "Checking mise tools..."
MISE=~/.local/bin/mise
TOOLS_NEEDED=()

$MISE list node   &>/dev/null || TOOLS_NEEDED+=(node@lts)
$MISE list bun    &>/dev/null || TOOLS_NEEDED+=(bun@latest)
$MISE list go     &>/dev/null || TOOLS_NEEDED+=(go@latest)
$MISE list rust   &>/dev/null || TOOLS_NEEDED+=(rust@latest)
$MISE list pnpm   &>/dev/null || TOOLS_NEEDED+=(pnpm@latest)
$MISE list yarn   &>/dev/null || TOOLS_NEEDED+=(yarn@latest)

if [ ${#TOOLS_NEEDED[@]} -gt 0 ]; then
    echo "    Installing: ${TOOLS_NEEDED[*]}"
    $MISE use -g "${TOOLS_NEEDED[@]}"
    done_ "Mise tools installed"
else
    skip "All mise tools already installed"
fi

# ---- uv (standalone) ----
step "Checking uv..."
if ! command -v uv &>/dev/null; then
    echo "    Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    done_ "uv installed"
else
    skip "uv already installed"
fi

# ---- gcloud ----
step "Checking gcloud..."
if ! command -v gcloud &>/dev/null && [ ! -f ~/google-cloud-sdk/bin/gcloud ]; then
    echo "    Installing gcloud SDK..."
    curl -fsSL https://sdk.cloud.google.com | bash -s -- --disable-prompts
    done_ "gcloud installed"
else
    skip "gcloud already installed"
fi

# ---- Claude Code ----
step "Checking Claude Code..."
if ! command -v claude &>/dev/null && [ ! -f ~/.claude/bin/claude ]; then
    echo "    Installing Claude Code..."
    curl -fsSL https://claude.ai/install.sh | bash
    done_ "Claude Code installed"
else
    skip "Claude Code already installed"
fi


if [ "${CALLED_FROM_WSL:-}" != "1" ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Ubuntu setup complete!                ${NC}"
    echo -e "${GREEN}  Run 'source ~/.bashrc' or open a new  ${NC}"
    echo -e "${GREEN}  terminal to apply all changes.        ${NC}"
    echo -e "${GREEN}========================================${NC}"
fi

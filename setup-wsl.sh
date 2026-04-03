#!/usr/bin/env bash
# WSL Setup - runs Ubuntu setup then applies WSL-specific config
set -euo pipefail

SCRIPT_URL="https://raw.githubusercontent.com/inspira-legal/builder-setup/main"

# Run the base Ubuntu setup
curl -fsSL "$SCRIPT_URL/setup-ubuntu.sh" | CALLED_FROM_WSL=1 bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

step()  { echo -e "\n${CYAN}==> $1${NC}"; }
skip()  { echo -e "    ${YELLOW}[SKIP]${NC} $1"; }
done_() { echo -e "    ${GREEN}[DONE]${NC} $1"; }

# ---- Enable systemd (required for Docker) ----
step "Checking systemd in WSL..."
if ! grep -q 'systemd=true' /etc/wsl.conf 2>/dev/null; then
    echo -e "[boot]\nsystemd=true" | sudo tee -a /etc/wsl.conf >/dev/null
    done_ "systemd enabled in wsl.conf (restart WSL to apply)"
else
    skip "systemd already enabled"
fi

# ---- VS Code as editor ----
step "Checking editor config..."
if ! grep -q 'export EDITOR="code --wait"' ~/.bashrc 2>/dev/null; then
    echo 'export EDITOR="code --wait"' >> ~/.bashrc
    echo 'export VISUAL="code --wait"' >> ~/.bashrc
    done_ "Editor config added to .bashrc"
else
    skip "Editor config already in .bashrc"
fi

step "Checking git editor config..."
CURRENT_EDITOR=$(git config --global core.editor 2>/dev/null || true)
if [ "$CURRENT_EDITOR" != "code --wait" ]; then
    git config --global core.editor "code --wait"
    done_ "Git editor set"
else
    skip "Git editor already set"
fi

# ---- BROWSER env var ----
step "Checking BROWSER env var..."
if ! grep -q 'export BROWSER=' ~/.bashrc 2>/dev/null; then
    CHROME="/mnt/c/Users/PC/AppData/Local/imput/Helium/Application/chrome.exe"
    EDGE="/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
    if [ -f "$CHROME" ]; then
        echo "export BROWSER=\"$CHROME\"" >> ~/.bashrc
        done_ "BROWSER set to Chrome"
    elif [ -f "$EDGE" ]; then
        echo "export BROWSER=\"$EDGE\"" >> ~/.bashrc
        done_ "BROWSER set to Edge (Chrome not found)"
    else
        echo "    WARNING: No Chrome or Edge found, skipping BROWSER" >&2
    fi
else
    skip "BROWSER env var already set"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  WSL setup complete!                   ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
read -rp "Restart WSL now to apply all changes? [Y/n] " RESTART
RESTART=${RESTART:-Y}
if [[ "$RESTART" =~ ^[Yy]$ ]]; then
    echo "Restarting WSL..."
    wsl.exe --shutdown
else
    echo -e "${YELLOW}Remember to restart WSL before using Docker.${NC}"
fi

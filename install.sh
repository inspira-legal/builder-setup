#!/usr/bin/env bash
# Thin wrapper: detects platform, downloads the right binary, runs it.
set -euo pipefail

REPO="inspira-legal/builder-setup"

# ── Detect OS ──
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
case "$OS" in
  linux|darwin) ;;
  *) echo "Unsupported OS: $OS"; exit 1 ;;
esac

# ── Detect arch ──
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64)       ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

BINARY="setup-${OS}-${ARCH}"
URL="https://github.com/${REPO}/releases/latest/download/${BINARY}"
DEST="/tmp/${BINARY}"

echo "Downloading ${BINARY}..."
curl -fsSL "$URL" -o "$DEST"
chmod +x "$DEST"
[ "$OS" = "darwin" ] && xattr -d com.apple.quarantine "$DEST" 2>/dev/null || true

echo "Running setup..."
"$DEST"

rm -f "$DEST"

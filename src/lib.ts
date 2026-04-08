import { homedir } from "os";
import { mkdirSync } from "fs";
import { dirname } from "path";

// ── Types ──

export type Platform = "darwin" | "linux" | "windows";

export type InstallerResult = void | { profile: string[] };

export interface Tool {
  name: string;
  /** Binary name to check via Bun.which(). Skips install if found. */
  bin?: string;
  /** Custom check — return true if already installed/configured. Overrides bin. */
  check?: () => Promise<boolean>;
  /** If provided, tool is skipped entirely (silently) when this returns false. */
  when?: () => boolean;
  darwin?: () => Promise<InstallerResult>;
  linux?: () => Promise<InstallerResult>;
  windows?: () => Promise<InstallerResult>;
}

// ── Constants ──

export const HOME = homedir();

// ── Platform ──

export function getPlatform(): Platform {
  switch (process.platform) {
    case "darwin":
      return "darwin";
    case "win32":
      return "windows";
    default:
      return "linux";
  }
}

export function isWSL(): boolean {
  return !!process.env.WSL_DISTRO_NAME;
}

/** Profile path based on current shell / platform */
export function getProfilePath(): string {
  if (process.platform === "win32") {
    return `${HOME}\\Documents\\WindowsPowerShell\\Microsoft.PowerShell_profile.ps1`;
  }
  const shell = process.env.SHELL ?? "";
  if (shell.endsWith("/zsh")) return `${HOME}/.zshrc`;
  return `${HOME}/.bashrc`;
}

// ── Logging ──

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
const NC = "\x1b[0m";

export const log = {
  step: (msg: string) => console.log(`\n${CYAN}==>${NC} ${BOLD}${msg}${NC}`),
  skip: (msg: string) => console.log(`    ${YELLOW}[PULAR]${NC} ${msg}`),
  done: (msg: string) => console.log(`    ${GREEN}[FEITO]${NC} ${msg}`),
  warn: (msg: string) => console.log(`    ${YELLOW}[AVISO]${NC} ${msg}`),
  error: (msg: string) => console.error(`    ${RED}[ERRO]${NC}  ${msg}`),
  info: (msg: string) => console.log(`    ${msg}`),
};

// ── Helpers ──

/** Check if a binary exists in PATH */
export function has(bin: string): boolean {
  return Bun.which(bin) !== null;
}

/** Check if a file exists */
export function fileExists(path: string): Promise<boolean> {
  return Bun.file(path).exists();
}

/** Check if a file contains a string */
export async function fileContains(path: string, needle: string): Promise<boolean> {
  try {
    const content = await Bun.file(path).text();
    return content.includes(needle);
  } catch {
    return false;
  }
}

/** Append a line to a file (creates if missing) */
export async function appendFile(path: string, line: string): Promise<void> {
  let existing = "";
  try {
    existing = await Bun.file(path).text();
  } catch {
    mkdirSync(dirname(path), { recursive: true });
  }
  const sep = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
  await Bun.write(path, existing + sep + line + "\n");
}

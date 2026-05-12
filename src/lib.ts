import { homedir } from "os";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";

// ── Types ──

export type Platform = "darwin" | "linux" | "windows";

export type InstallerResult = void | { profile: string[] };

export interface Tool {
  name: string;
  /** Return true to skip install (already installed/configured). */
  shouldSkip?: () => Promise<boolean>;
  /** Verify installation after install. Return version string on success, null on failure. */
  verify?: () => Promise<string | null>;
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

/** Refresh process.env.PATH so newly installed binaries are found by Bun.which() */
export async function refreshPath(): Promise<void> {
  if (process.platform === "win32") {
    const proc = Bun.spawn(
      [
        "powershell.exe",
        "-NoProfile",
        "-Command",
        "[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')",
      ],
      { stdout: "pipe", stderr: "pipe" },
    );
    process.env.PATH = (await new Response(proc.stdout).text()).trim();
  } else {
    const shell = process.env.SHELL ?? "/bin/bash";
    const proc = Bun.spawn([shell, "-lc", "echo $PATH"], { stdout: "pipe", stderr: "pipe" });
    process.env.PATH = (await new Response(proc.stdout).text()).trim();
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

// ── Input ──

/** Pergunta uma string ao usuário (retorna trim). */
export async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(question);
    return answer.trim();
  } finally {
    rl.close();
  }
}

/** Pausa esperando Enter (ignora qualquer input). */
export async function pause(message: string): Promise<void> {
  await prompt(message);
}

// ── GitHub ──

export type GitHubCheckResult =
  | { status: "exists" }
  | { status: "not_found" }
  | { status: "unreachable"; reason: string };

/**
 * Verifica via API do GitHub se um username existe.
 * Distingue "não existe" (404) de "não consegui validar" (rede/rate-limit).
 */
export async function checkGitHubUser(username: string): Promise<GitHubCheckResult> {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (res.status === 200) return { status: "exists" };
    if (res.status === 404) return { status: "not_found" };
    return { status: "unreachable", reason: `HTTP ${res.status}` };
  } catch (err) {
    return { status: "unreachable", reason: (err as Error).message };
  }
}

// ── Config ──

export interface BuilderConfig {
  githubUsername?: string;
  /** True quando o usuário rodou o setup sem conta GitHub ainda. */
  pendingGitHubSetup?: boolean;
}

const CONFIG_DIR = `${HOME}/.builder-setup`;
const CONFIG_PATH = `${CONFIG_DIR}/config.json`;

export async function loadConfig(): Promise<BuilderConfig> {
  try {
    return JSON.parse(await Bun.file(CONFIG_PATH).text()) as BuilderConfig;
  } catch {
    return {};
  }
}

export async function saveConfig(patch: Partial<BuilderConfig>): Promise<void> {
  const current = await loadConfig();
  const next = { ...current, ...patch };
  mkdirSync(CONFIG_DIR, { recursive: true });
  await Bun.write(CONFIG_PATH, JSON.stringify(next, null, 2) + "\n");
}

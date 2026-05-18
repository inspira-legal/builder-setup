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
  step: (msg: string, progress?: { current: number; total: number }) => {
    const prefix = progress ? `[${progress.current}/${progress.total}] ` : "";
    console.log(`\n${CYAN}==>${NC} ${BOLD}${prefix}${msg}${NC}`);
  },
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
  | { status: "exists"; canonical: string }
  | { status: "not_found" }
  | { status: "unreachable"; reason: string };

/**
 * Verifica via API do GitHub se um username existe.
 * Distingue "não existe" (404) de "não consegui validar" (rede/rate-limit).
 * Retorna o login canônico (case-correct) quando encontrado.
 */
export async function checkGitHubUser(username: string): Promise<GitHubCheckResult> {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (res.status === 200) {
      const body = (await res.json()) as { login: string };
      return { status: "exists", canonical: body.login };
    }
    if (res.status === 404) return { status: "not_found" };
    // Rate limit ou outro erro HTTP
    const reason =
      res.status === 403 ? `HTTP 403 (rate limit ou acesso negado)` : `HTTP ${res.status}`;
    return { status: "unreachable", reason };
  } catch (err) {
    return { status: "unreachable", reason: (err as Error).message };
  }
}

// ── GitHub Org ──

export type GitHubOrgResult =
  | { status: "member" }
  | { status: "not_member" }
  | { status: "unverified"; reason: string };

/**
 * Verifica se o usuário autenticado no gh CLI é membro da org inspira-legal.
 * Requer que `gh auth` já tenha sido feito (token válido).
 * Distingue: membro, não-membro (404), auth/scope insuficiente (403/unauthenticated), e erros inesperados.
 */
export async function checkGitHubOrgMembership(): Promise<GitHubOrgResult> {
  try {
    const proc = Bun.spawn(["gh", "api", "orgs/inspira-legal/memberships/@me"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const exitCode = await proc.exited;
    if (exitCode === 0) return { status: "member" };

    const stderr = await new Response(proc.stderr).text();

    // Erros de autenticação / token inválido / não logado
    if (
      stderr.includes("not logged into any GitHub host") ||
      stderr.includes("authentication required") ||
      stderr.includes("HTTP 401")
    ) {
      return { status: "unverified", reason: "gh CLI não autenticado" };
    }

    // Sem escopo read:org ou SSO enforcement (o gh retorna 403 nesses casos)
    if (
      stderr.includes("HTTP 403") ||
      stderr.includes("Resource protected by organization SAML enforcement")
    ) {
      return { status: "unverified", reason: "token sem escopo read:org ou SSO pendente" };
    }

    // 404 confirmado = usuário autenticado mas não é membro da org
    if (stderr.includes("HTTP 404")) {
      return { status: "not_member" };
    }

    // Qualquer outro erro (rede, org inexistente, etc.)
    return { status: "unverified", reason: `gh api falhou (stderr: ${stderr.trim()})` };
  } catch (err) {
    return { status: "unverified", reason: (err as Error).message };
  }
}

// ── Config ──

export interface BuilderConfig {
  githubUsername?: string;
  /** True quando confirmamos via API que o usuário é membro da org inspira-legal. */
  githubOrgVerified?: boolean;
  /** True quando o usuário declarou que já solicitou ao HOLANDA inclusão na org. */
  githubOrgPending?: boolean;
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

import { fileExists, HOME } from "./lib";

// Git credential for the lexflow git host, in the shape `wave doctor` checks
// for (wave_cli.py git_helper_line/git_helper_ok). Kept apart from setup.ts so
// it can be exercised on its own (setup.ts runs main() on import).

export const LEXFLOW_URL = "https://lexflow.internal.inspira.legal";
export const WAVE_APP = "inspira/wave-cli";
export const WAVE_GIT = `${LEXFLOW_URL}/git/${WAVE_APP}.git`;
export const GIT_HELPER_KEY = `credential.${LEXFLOW_URL}.helper`;
export const GIT_HELPER_FILE = `${HOME}/.config/lexflow/git-credentials-helper.py`;

/** `git ls-remote` on the wave repo with prompts off: true when git can authenticate. */
export function gitReachesWave(): boolean {
  return (
    Bun.spawnSync(["git", "ls-remote", "--quiet", WAVE_GIT], {
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
      stdout: "ignore",
      stderr: "ignore",
    }).exitCode === 0
  );
}

/** Python of the lexflow uv tool, falling back to python3 on PATH. */
export async function lexflowPython(uv: string): Promise<string> {
  const dir = Bun.spawnSync([uv, "tool", "dir"], { stdout: "pipe", stderr: "ignore" });
  const candidate = `${dir.stdout.toString().trim()}/lexflow-deploy-cli/bin/python`;
  return dir.exitCode === 0 && (await fileExists(candidate)) ? candidate : "python3";
}

/** Single-quote for sh (git runs `!` helpers through sh). */
export function shQuote(word: string): string {
  return `'${word.replaceAll("'", `'\\''`)}'`;
}

/**
 * Point the global git at the lexflow helper for the lexflow host only.
 *
 * The empty entry first resets the host's helper list, so osxkeychain can't
 * answer with a stale 1h token before ours. Paths are absolute (git doesn't
 * expand `~` in a helper value) and sh-quoted (a space or apostrophe in the
 * home dir must not split the command). Argv arrays, not the Bun shell: the
 * reset needs a literal empty argument.
 */
export function writeGitHelper(python: string): boolean {
  const gitConfig = (...args: string[]) =>
    Bun.spawnSync(["git", "config", "--global", ...args], { stdout: "ignore", stderr: "ignore" });
  return (
    gitConfig("--replace-all", GIT_HELPER_KEY, "").exitCode === 0 &&
    gitConfig("--add", GIT_HELPER_KEY, `!${shQuote(python)} ${shQuote(GIT_HELPER_FILE)}`)
      .exitCode === 0
  );
}

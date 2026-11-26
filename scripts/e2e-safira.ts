// Temporário (sai antes do merge): instala de verdade as duas ferramentas do Safira.
import { installs } from "../src/tools";
import { refreshPath } from "../src/lib";

const platform =
  process.platform === "win32" ? "windows" : process.platform === "darwin" ? "darwin" : "linux";
let failed = false;
for (const name of ["Claude Desktop", "Coder CLI"]) {
  const t = installs.find((x) => x.name === name)!;
  const install = t[platform];
  if (!install) {
    console.log(`${name}: não se aplica em ${platform}`);
    continue;
  }
  const before = await t.shouldSkip?.();
  if (!before) await install();
  await refreshPath();
  const after = await t.shouldSkip?.();
  const ver = await t.verify?.();
  console.log(`${name}: antes=${before} depois=${after} verify=${ver ?? "-"}`);
  if (!after) failed = true;
}
// Segunda passada: tudo tem de ser pulado (rodar o setup de novo não pode quebrar).
for (const name of ["Claude Desktop", "Coder CLI"]) {
  const t = installs.find((x) => x.name === name)!;
  if (t[platform] && !(await t.shouldSkip?.())) {
    console.log(`${name}: NÃO foi pulado na 2ª passada`);
    failed = true;
  }
}
if (platform !== "linux") {
  const coder = await installs.find((x) => x.name === "Coder CLI")!.verify!();
  const p = Bun.spawn([coder!, "version"], { stdout: "inherit", stderr: "inherit" });
  if ((await p.exited) !== 0) failed = true;
}
process.exit(failed ? 1 : 0);

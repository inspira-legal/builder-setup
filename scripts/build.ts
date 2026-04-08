/**
 * Cross-compile setup binary for all supported platforms.
 * Usage: bun run scripts/build.ts
 */

import { mkdirSync } from "fs";

const targets = [
  { target: "bun-linux-x64", output: "setup-linux-x64" },
  { target: "bun-linux-arm64", output: "setup-linux-arm64" },
  { target: "bun-darwin-x64", output: "setup-darwin-x64" },
  { target: "bun-darwin-arm64", output: "setup-darwin-arm64" },
  { target: "bun-windows-x64", output: "setup-windows-x64.exe" },
] as const;

mkdirSync("dist", { recursive: true });

for (const { target, output } of targets) {
  console.log(`\x1b[36mBuilding ${output}...\x1b[0m`);
  await Bun.build({
    entrypoints: ["src/setup.ts"],
    compile: {
      target,
      outfile: `dist/${output}`,
    },
    minify: true,
  });
}

console.log("\n\x1b[32mAll binaries built in dist/\x1b[0m");

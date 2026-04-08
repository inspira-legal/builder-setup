/**
 * Cross-compile setup binary for all supported platforms.
 * Usage: bun run scripts/build.ts
 */

import { $ } from "bun";

const targets = [
  { target: "bun-linux-x64", output: "setup-linux-x64" },
  { target: "bun-linux-arm64", output: "setup-linux-arm64" },
  { target: "bun-darwin-x64", output: "setup-darwin-x64" },
  { target: "bun-darwin-arm64", output: "setup-darwin-arm64" },
  { target: "bun-windows-x64", output: "setup-windows-x64.exe" },
] as const;

await $`mkdir -p dist`;

for (const { target, output } of targets) {
  console.log(`\x1b[36mBuilding ${output}...\x1b[0m`);
  await $`bun build --compile --target=${target} --minify src/setup.ts --outfile dist/${output}`;
}

console.log("\n\x1b[32mAll binaries built in dist/\x1b[0m");

import { resolve } from "path";
import { platform, arch } from "process";

const musl = platform === "linux" && (await Bun.file("/usr/bin/ldd").text()).includes("musl");
const suffix = platform === "linux" ? (musl ? "musl" : "gnu") : "";
const target = suffix ? `${platform}-${arch}-${suffix}` : `${platform}-${arch}`;
const ext = platform === "win32" ? ".exe" : "";
const bin = resolve(`node_modules/@oxlint/${target}/oxlint${ext}`);

const proc = Bun.spawn([bin, ...Bun.argv.slice(2)], {
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

const code = await proc.exited;
process.exit(code);

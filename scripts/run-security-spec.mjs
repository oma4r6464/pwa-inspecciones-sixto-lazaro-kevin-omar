import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// tsx resuelve los imports transitivos de la validación compartida.
const result = spawnSync(process.execPath, ["--import", "tsx", "tests/security.spec.ts"], {
  cwd: resolve(import.meta.dirname, ".."), stdio: "inherit"
});
mkdirSync("test-results", { recursive: true });
writeFileSync("test-results/security-report.json", JSON.stringify({
  suite: "tests/security.spec.ts",
  checkedAt: new Date().toISOString(),
  revision: process.env.GITHUB_SHA ?? spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout?.trim(),
  status: result.status === 0 ? "pass" : "fail",
  exitCode: result.status,
  scope: "Pruebas públicas; no constituye evaluación privada ni calificación."
}, null, 2) + "\n");
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;

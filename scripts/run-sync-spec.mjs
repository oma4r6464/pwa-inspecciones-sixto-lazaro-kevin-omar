import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(process.cwd());
const testFile = resolve(root, "tests/sync.spec.ts");

if (!existsSync(testFile)) {
  console.error("No se encontró tests/sync.spec.ts");
  process.exit(1);
}

import { execSync } from "node:child_process";

try {
    execSync(`npx tsx "${testFile}"`, { stdio: "inherit" });
} catch (err) {
  process.exit(1);
}

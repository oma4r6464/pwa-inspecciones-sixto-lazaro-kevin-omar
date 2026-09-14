import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(process.cwd());
const testFile = resolve(root, "tests/manifest.spec.ts");

if (!existsSync(testFile)) {
  console.error("No se encontró tests/manifest.spec.ts");
  process.exit(1);
}

const source = readFileSync(testFile, "utf8");
const result = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022
  }
});

const dataUri = `data:text/javascript;base64,${Buffer.from(result.outputText).toString("base64")}`;
await import(dataUri);

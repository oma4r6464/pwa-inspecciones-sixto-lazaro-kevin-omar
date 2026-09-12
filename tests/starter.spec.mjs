import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const page = await readFile(resolve(root, "src/app/page.tsx"), "utf8");
const appShell = await readFile(resolve(root, "src/components/app-shell.tsx"), "utf8");

assert.equal(packageJson.scripts.build, "next build");
assert.match(`${page}\n${appShell}`, /Inspecciones de laboratorio/);
assert.match(`${page}\n${appShell}`, /sint[eé]ticos/i);

const manifestSpecPath = resolve(root, "tests/manifest.spec.ts");
const manifestSpec = await readFile(manifestSpecPath, "utf8");
const transpiled = ts.transpileModule(manifestSpec, {
  fileName: manifestSpecPath,
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022
  }
}).outputText;

await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`);

console.log("starter.spec.mjs: PASS");

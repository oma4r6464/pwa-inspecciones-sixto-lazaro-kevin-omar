import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(process.cwd());
const compilerOptions = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022
};
const helperSource = readFileSync(resolve(root, "src/lib/security/safe-error.ts"), "utf8");
const helperResult = ts.transpileModule(helperSource, { compilerOptions });
const helperUri = `data:text/javascript;base64,${Buffer.from(helperResult.outputText).toString("base64")}`;
const source = readFileSync(resolve(root, "tests/security.spec.ts"), "utf8").replace(
  'import { createSafeErrorContext } from "../src/lib/security/safe-error";',
  `const { createSafeErrorContext } = await import("${helperUri}");`
);
const result = ts.transpileModule(source, {
  compilerOptions
});

const dataUri = `data:text/javascript;base64,${Buffer.from(result.outputText).toString("base64")}`;
await import(dataUri);
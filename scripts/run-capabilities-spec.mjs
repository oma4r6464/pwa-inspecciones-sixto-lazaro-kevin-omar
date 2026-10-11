import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(process.cwd());
const testFile = resolve(root, "tests/capabilities.spec.ts");

if (!existsSync(testFile)) {
  console.error("No se encontró tests/capabilities.spec.ts");
  process.exit(1);
}

const compilerOptions = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022
};

const cameraSource = readFileSync(resolve(root, "src/lib/device/camera.ts"), "utf8");
const cameraResult = ts.transpileModule(cameraSource, { compilerOptions });
const cameraUri = `data:text/javascript;base64,${Buffer.from(cameraResult.outputText).toString("base64")}`;

const source = readFileSync(testFile, "utf8").replace(
  'from "../src/lib/device/camera"',
  `from "${cameraUri}"`
);

const result = ts.transpileModule(source, { compilerOptions });
const dataUri = `data:text/javascript;base64,${Buffer.from(result.outputText).toString("base64")}`;

await import(dataUri);

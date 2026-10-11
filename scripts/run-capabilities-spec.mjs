import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(process.cwd());
const testFile = resolve(root, "tests/capabilities.spec.ts");

if (!existsSync(testFile)) {
  console.error("No se encontro tests/capabilities.spec.ts");
  process.exit(1);
}

const compilerOptions = { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 };

function toDataUri(source) {
  const result = ts.transpileModule(source, { compilerOptions });
  return `data:text/javascript;base64,${Buffer.from(result.outputText).toString("base64")}`;
}

const cameraUri = toDataUri(readFileSync(resolve(root, "src/lib/device/camera.ts"), "utf8"));
const geolocationUri = toDataUri(readFileSync(resolve(root, "src/lib/device/geolocation.ts"), "utf8"));
const spec = readFileSync(testFile, "utf8")
  .replace('from "../src/lib/device/camera"', `from "${cameraUri}"`)
  .replace('from "../src/lib/device/geolocation"', `from "${geolocationUri}"`);

await import(toDataUri(spec));


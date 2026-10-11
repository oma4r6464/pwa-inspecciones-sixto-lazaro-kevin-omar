import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const compilerOptions = { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 };

function moduleUri(relativePath) {
  const source = readFileSync(resolve(root, relativePath), "utf8");
  const result = ts.transpileModule(source, { compilerOptions });
  return `data:text/javascript;base64,${Buffer.from(result.outputText).toString("base64")}`;
}

const source = readFileSync(resolve(root, "tests/capabilities.spec.ts"), "utf8")
  .replace('from "../src/lib/device/camera"', `from "${moduleUri("src/lib/device/camera.ts")}"`)
  .replace('from "../src/lib/device/geolocation"', `from "${moduleUri("src/lib/device/geolocation.ts")}"`)
  .replace('from "../src/lib/notifications/client"', `from "${moduleUri("src/lib/notifications/client.ts")}"`);
const result = ts.transpileModule(source, { compilerOptions });
await import(`data:text/javascript;base64,${Buffer.from(result.outputText).toString("base64")}`);

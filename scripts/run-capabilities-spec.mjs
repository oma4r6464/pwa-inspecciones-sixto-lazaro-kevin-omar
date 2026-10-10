import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(process.cwd());
const compilerOptions = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022
};

function toDataUri(source) {
  const result = ts.transpileModule(source, { compilerOptions });
  return `data:text/javascript;base64,${Buffer.from(result.outputText).toString("base64")}`;
}

const geolocationUri = toDataUri(
  readFileSync(resolve(root, "src/lib/device/geolocation.ts"), "utf8")
);

const spec = readFileSync(resolve(root, "tests/capabilities.spec.ts"), "utf8").replace(
  'from "../src/lib/device/geolocation"',
  `from "${geolocationUri}"`
);

await import(toDataUri(spec));
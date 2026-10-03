import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(process.cwd());
const compilerOptions = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022
};

function moduleUri(relativePath) {
  const source = readFileSync(resolve(root, relativePath), "utf8");
  const result = ts.transpileModule(source, { compilerOptions });
  return `data:text/javascript;base64,${Buffer.from(result.outputText).toString("base64")}`;
}

const schemaUri = moduleUri("src/lib/storage/schema.ts");
const conflictUri = moduleUri("src/lib/sync/conflict-policy.ts");
const queueSource = readFileSync(resolve(root, "src/lib/sync/queue.ts"), "utf8");
const queueResult = ts.transpileModule(queueSource, { compilerOptions });
const queueUri = `data:text/javascript;base64,${Buffer.from(queueResult.outputText).toString("base64")}`;

const source = readFileSync(resolve(root, "tests/sync.spec.ts"), "utf8")
  .replace('from "../src/lib/storage/schema"', `from "${schemaUri}"`)
  .replace('from "../src/lib/sync/conflict-policy"', `from "${conflictUri}"`)
  .replace('from "../src/lib/sync/queue"', `from "${queueUri}"`);
const result = ts.transpileModule(source, { compilerOptions });
const dataUri = `data:text/javascript;base64,${Buffer.from(result.outputText).toString("base64")}`;

await import(dataUri);

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import nextConfig from "../next.config.mjs";
import { createSafeErrorContext } from "../src/lib/security/safe-error";
import { validateInspectionCapture } from "../src/lib/validation/inspection-capture";

async function run() {
const context = createSafeErrorContext({
  incidentId: "incidente/04?correo=sintetico",
  correlationId: "correlacion demo",
  status: 503.9,
  attempt: -2,
  durationMs: 184.8
});

assert.deepEqual(context, {
  incidentId: "incidente04correosintetico",
  correlationId: "correlaciondemo",
  status: 503,
  attempt: 1,
  durationMs: 184
});

assert.deepEqual(Object.keys(context).sort(), [
  "attempt",
  "correlationId",
  "durationMs",
  "incidentId",
  "status"
]);
assert.equal("correo" in context, false);
assert.equal("ubicacion" in context, false);
assert.equal("foto" in context, false);
assert.equal("comentario" in context, false);

assert.deepEqual(validateInspectionCapture({
  location: "Laboratorio sintetico A",
  summary: "Equipo en condiciones de prueba",
  status: "ok"
}), {
  valid: true,
  value: {
    location: "Laboratorio sintetico A",
    summary: "Equipo en condiciones de prueba",
    status: "ok",
    inspector: "Sin asignar"
  }
});

assert.deepEqual(validateInspectionCapture({ location: "   ", summary: "", status: "ok" }), {
  valid: false,
  issues: [{ field: "location", code: "empty" }, { field: "summary", code: "empty" }]
});
const invalidCapture = validateInspectionCapture({
  location: "dato-sintetico-no-debe-exponerse",
  summary: "",
  status: "ok"
});
assert.equal(invalidCapture.valid, false);
assert.equal(JSON.stringify(invalidCapture).includes("dato-sintetico-no-debe-exponerse"), false);

const root = resolve(process.cwd());
const robotsPath = resolve(root, "public/robots.txt");
const previousNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = "production";
const headerRules = await nextConfig.headers();
if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
else process.env.NODE_ENV = previousNodeEnv;
const headers = Object.fromEntries(headerRules[0].headers.map(({ key, value }) => [key, value]));
const csp = headers["Content-Security-Policy"];
const permissions = headers["Permissions-Policy"];
const robots = readFileSync(robotsPath, "utf8");

assert.ok(existsSync(robotsPath), "public/robots.txt debe estar disponible");
assert.match(robots, /User-agent:\s*\*/);
assert.match(robots, /Disallow:\s*\/\s*$/m);
assert.match(csp, /default-src 'self'/);
assert.match(csp, /object-src 'none'/);
assert.match(csp, /frame-ancestors 'none'/);
assert.doesNotMatch(csp, /script-src[^;]*\*/);
assert.doesNotMatch(csp, /unsafe-eval/);
assert.match(permissions, /camera=\(self\)/);
assert.match(permissions, /geolocation=\(self\)/);
assert.match(permissions, /microphone=\(\)/);
assert.match(permissions, /payment=\(\)/);
assert.match(permissions, /usb=\(\)/);

console.log("security.spec.ts: PASS");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });

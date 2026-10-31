import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createSafeErrorContext } from "../src/lib/security/safe-error";
import { validateInspectionCapture } from "../src/lib/validation/inspection-capture";

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
  summary: "Equipo en condiciones de prueba"
}), { valid: true });

assert.deepEqual(validateInspectionCapture({ location: "   ", summary: "" }), {
  valid: false,
  missingFields: ["location", "summary"]
});
const invalidCapture = validateInspectionCapture({
  location: "dato-sintetico-no-debe-exponerse",
  summary: ""
});
assert.equal(invalidCapture.valid, false);
assert.equal(JSON.stringify(invalidCapture).includes("dato-sintetico-no-debe-exponerse"), false);

const root = resolve(process.cwd());
const robotsPath = resolve(root, "public/robots.txt");
const nextConfig = readFileSync(resolve(root, "next.config.mjs"), "utf8");
const robots = readFileSync(robotsPath, "utf8");

assert.ok(existsSync(robotsPath), "public/robots.txt debe estar disponible");
assert.match(robots, /User-agent:\s*\*/);
assert.match(robots, /Disallow:\s*\/\s*$/m);
assert.match(nextConfig, /Content-Security-Policy/);
assert.match(nextConfig, /default-src 'self'/);
assert.match(nextConfig, /object-src 'none'/);
assert.match(nextConfig, /frame-ancestors 'none'/);
assert.doesNotMatch(nextConfig, /script-src[^;]*\*/);
assert.doesNotMatch(nextConfig, /unsafe-eval/);
assert.match(nextConfig, /Permissions-Policy/);
assert.match(nextConfig, /camera=\(self\)/);
assert.match(nextConfig, /geolocation=\(self\)/);
assert.match(nextConfig, /microphone=\(\)/);
assert.match(nextConfig, /payment=\(\)/);
assert.match(nextConfig, /usb=\(\)/);

console.log("security.spec.ts: PASS");
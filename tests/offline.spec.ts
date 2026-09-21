import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

console.log("offline.spec.ts: running tests...");

const root = resolve(process.cwd());
const registerPath = resolve(root, "src/lib/pwa/register-service-worker.ts");
const swPath = resolve(root, "public/sw.js");

assert.ok(existsSync(registerPath), "src/lib/pwa/register-service-worker.ts debe existir");
assert.ok(existsSync(swPath), "public/sw.js debe existir");

const registerContent = readFileSync(registerPath, "utf8");
const swContent = readFileSync(swPath, "utf8");

// 1. register-service-worker.ts expone registerServiceWorker y applyServiceWorkerUpdate
assert.match(registerContent, /export\s+function\s+registerServiceWorker/, "debe exportar registerServiceWorker");
assert.match(registerContent, /export\s+function\s+applyServiceWorkerUpdate/, "debe exportar applyServiceWorkerUpdate");

// 2. Existe el fallback a OFFLINE_FALLBACK_URL en sw.js cuando falla la navegación
assert.match(swContent, /const\s+OFFLINE_FALLBACK_URL\s*=\s*["'`]/, "debe definir OFFLINE_FALLBACK_URL");
assert.match(swContent, /catch\s*\([^)]*\)\s*\{[\s\S]*?match\(OFFLINE_FALLBACK_URL\)/, "debe usar fallback a OFFLINE_FALLBACK_URL cuando falla la navegación");

// 3. El flujo de update no dispara reload más de una vez (validar el flag hasReloaded)
assert.match(registerContent, /let\s+hasReloaded\s*=\s*false;/, "debe inicializar el flag hasReloaded");
assert.match(registerContent, /if\s*\(hasReloaded\)\s*return;/, "debe verificar hasReloaded antes de recargar");
assert.match(registerContent, /hasReloaded\s*=\s*true;/, "debe establecer hasReloaded a true");
assert.match(registerContent, /window\.location\.reload\(\);/, "debe invocar reload");

console.log("offline.spec.ts: PASS");

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

console.log("service-worker.spec.ts: running tests...");

const root = resolve(process.cwd());
const swPath = resolve(root, "public/sw.js");

assert.ok(existsSync(swPath), "public/sw.js debe existir");

const swContent = readFileSync(swPath, "utf8");

// 1. Existe CACHE_NAME con versión (SW_VERSION)
assert.match(swContent, /^const\s+SW_VERSION\s*=\s*["'`][^"'`]+["'`]/m, "debe definir SW_VERSION");
assert.match(swContent, /^const\s+CACHE_NAME\s*=\s*[`"'](?:.*)\$\{SW_VERSION\}(?:.*)[`"']|^const\s+CACHE_NAME\s*=\s*[`"'](?:.*)["']\s*\+\s*SW_VERSION/m, "debe definir CACHE_NAME usando SW_VERSION");
assert.match(swContent, /response\.ok/, "debe cachear solamente respuestas HTTP válidas");

// 2. PRECACHE_URLS incluye "/", "/manifest.webmanifest", "/icon.svg"
assert.match(swContent, /^const\s+PRECACHE_URLS\s*=\s*\[([\s\S]*?)\]/m, "debe definir PRECACHE_URLS como un arreglo");
const precacheMatch = swContent.match(/^const\s+PRECACHE_URLS\s*=\s*\[([\s\S]*?)\]/m);
if (precacheMatch) {
  const urls = precacheMatch[1];
  assert.match(urls, /["'`]\/["'`]/, "PRECACHE_URLS debe incluir '/'");
  assert.match(urls, /["'`]\/manifest\.webmanifest["'`]/, "PRECACHE_URLS debe incluir '/manifest.webmanifest'");
  assert.match(urls, /["'`]\/icon\.svg["'`]/, "PRECACHE_URLS debe incluir '/icon.svg'");
}

// 3. Hay listeners de "install", "activate", "fetch" y "message"
assert.match(swContent, /self\.addEventListener\(\s*["'`]install["'`]/, "debe tener listener de install");
assert.match(swContent, /self\.addEventListener\(\s*["'`]activate["'`]/, "debe tener listener de activate");
assert.match(swContent, /self\.addEventListener\(\s*["'`]fetch["'`]/, "debe tener listener de fetch");
assert.match(swContent, /self\.addEventListener\(\s*["'`]message["'`]/, "debe tener listener de message");

// 4. El listener "message" reacciona a SKIP_WAITING (validar que NO hay self.skipWaiting() automático fuera del handler de message)
const skipWaitingCount = (swContent.match(/self\.skipWaiting\(\)/g) || []).length;
assert.equal(skipWaitingCount, 1, "solo debe haber un self.skipWaiting() en todo el archivo");
assert.match(swContent, /self\.addEventListener\(\s*["'`]message["'`][\s\S]*?self\.skipWaiting\(\)[\s\S]*?\}/, "self.skipWaiting() debe estar dentro del listener 'message'");

// 5. En "activate" se borran caches viejas (caches.delete)
assert.match(swContent, /self\.addEventListener\(\s*["'`]activate["'`][\s\S]*?caches\.delete/m, "debe usar caches.delete dentro de activate para limpiar caches viejas");

console.log("service-worker.spec.ts: PASS");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildContentSecurityPolicy,
  buildPermissionsPolicy,
  getSecurityHeaders
} from "../src/lib/security/security-headers.mjs";

console.log("security-headers.spec.mjs: running tests...");

const root = resolve(import.meta.dirname, "..");

function parseCsp(policy) {
  return Object.fromEntries(
    policy.split(";").map((part) => {
      const [name, ...sources] = part.trim().split(/\s+/);
      return [name, sources];
    })
  );
}

// CSP de producción: restringe orígenes y operaciones ajenos al alcance.
{
  const csp = parseCsp(buildContentSecurityPolicy({ isDev: false }));
  assert.deepEqual(csp["default-src"], ["'self'"]);
  assert.deepEqual(csp["object-src"], ["'none'"]);
  assert.deepEqual(csp["frame-src"], ["'none'"]);
  assert.deepEqual(csp["frame-ancestors"], ["'none'"]);
  assert.deepEqual(csp["base-uri"], ["'self'"]);
  assert.deepEqual(csp["form-action"], ["'self'"]);
  assert.deepEqual(csp["connect-src"], ["'self'"]);
  assert.deepEqual(csp["worker-src"], ["'self'"]);
  assert.deepEqual(csp["manifest-src"], ["'self'"]);
  assert.deepEqual(csp["style-src"], ["'self'"]);
  assert.deepEqual(csp["script-src"], ["'self'", "'unsafe-inline'"]);
  assert.equal(csp["script-src"].includes("'unsafe-eval'"), false);
  for (const sources of Object.values(csp)) {
    for (const source of sources) {
      assert.equal(/^(\*|https?:|wss?:)/.test(source), false, `origen demasiado amplio: ${source}`);
    }
  }
}

// CSP de desarrollo: solo añade lo que necesita el servidor de desarrollo de Next.js.
{
  const csp = parseCsp(buildContentSecurityPolicy({ isDev: true }));
  assert.ok(csp["script-src"].includes("'unsafe-eval'"));
  assert.ok(csp["style-src"].includes("'unsafe-inline'"));
  assert.deepEqual(csp["object-src"], ["'none'"]);
}

// Permissions-Policy: solo cámara y geolocalización, solo para el propio origen.
{
  const policy = buildPermissionsPolicy();
  assert.match(policy, /camera=\(self\)/);
  assert.match(policy, /geolocation=\(self\)/);
  assert.match(policy, /microphone=\(\)/);
  assert.match(policy, /payment=\(\)/);
  assert.match(policy, /usb=\(\)/);
}

// La cámara se solicita sin audio, así que denegar el micrófono no rompe el flujo.
{
  const camera = readFileSync(resolve(root, "src/lib/device/camera.ts"), "utf8");
  assert.match(camera, /audio:\s*false/);
}

// Cabeceras: HSTS solo fuera de desarrollo.
{
  const production = Object.fromEntries(getSecurityHeaders({ isDev: false }).map((h) => [h.key, h.value]));
  assert.equal(production["X-Content-Type-Options"], "nosniff");
  assert.equal(production["X-Frame-Options"], "DENY");
  assert.equal(production["Referrer-Policy"], "no-referrer");
  assert.ok(production["Strict-Transport-Security"]);
  assert.ok(production["Content-Security-Policy"]);
  assert.ok(production["Permissions-Policy"]);

  const development = Object.fromEntries(getSecurityHeaders({ isDev: true }).map((h) => [h.key, h.value]));
  assert.equal("Strict-Transport-Security" in development, false);
}

// next.config.mjs aplica las cabeceras a todas las rutas y oculta X-Powered-By.
{
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const { default: nextConfig } = await import("../next.config.mjs");
    assert.equal(nextConfig.poweredByHeader, false);
    const rules = await nextConfig.headers();
    assert.equal(rules.length, 1);
    assert.equal(rules[0].source, "/:path*");
    assert.deepEqual(rules[0].headers, getSecurityHeaders({ isDev: false }));
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
}

console.log("security-headers.spec.mjs: PASS");
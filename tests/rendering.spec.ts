import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

console.log("rendering.spec.ts: running tests...");

const root = resolve(process.cwd());
const detailPagePath = resolve(root, "src/app/inspecciones/[id]/page.tsx");
const homePagePath = resolve(root, "src/app/page.tsx");
const dataPath = resolve(root, "src/lib/data/inspections.ts");
const nextConfigPath = resolve(root, "next.config.mjs");

assert.ok(existsSync(detailPagePath), "src/app/inspecciones/[id]/page.tsx debe existir");

const detailContent = readFileSync(detailPagePath, "utf8");
assert.ok(
  !/^\s*["']use client["'];?/.test(detailContent),
  "la página de detalle no debe declarar 'use client' (debe renderizarse en servidor)"
);

assert.match(
  detailContent,
  /from\s+["']next\/navigation["']/,
  "la página de detalle debe importar utilidades de next/navigation"
);
assert.match(detailContent, /notFound\s*\(/, "la página de detalle debe invocar notFound() para IDs inexistentes");


assert.match(
  detailContent,
  /from\s+["'].*lib\/data\/inspections["']/,
  "la página de detalle debe leer los datos sintéticos desde src/lib/data/inspections"
);
assert.ok(!/fetch\(/.test(detailContent), "la página de detalle no debe hacer fetch a servicios externos");


assert.match(detailContent, /inspection\.location/, "debe mostrar la ubicación");
assert.match(detailContent, /inspection\.inspector/, "debe mostrar el responsable");
assert.match(detailContent, /inspection\.date/, "debe mostrar la fecha");
assert.match(detailContent, /inspection\.statusLabel/, "debe mostrar el estado");
assert.match(detailContent, /inspection\.findings/, "debe mostrar los hallazgos");
assert.match(detailContent, /inspection\.summary/, "debe mostrar el resumen");


assert.ok(
  !/(password|api[_-]?key|secret|token)\s*[:=]/i.test(detailContent),
  "la página de detalle no debe contener secretos ni credenciales"
);

const homeContent = readFileSync(homePagePath, "utf8");
assert.match(
  homeContent,
  /\/inspecciones\/\$\{inspection\.id\}/,
  "page.tsx debe enlazar cada tarjeta a /inspecciones/[id]"
);


assert.ok(existsSync(dataPath), "src/lib/data/inspections.ts debe existir");
const nextConfigContent = readFileSync(nextConfigPath, "utf8");
assert.ok(
  !/output\s*:\s*["']export["']/.test(nextConfigContent),
  "next.config.mjs no debe forzar exportación estática (rompería la ruta SSR dinámica)"
);

console.log("rendering.spec.ts: PASS");
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

console.log("manifest.spec.ts: running tests...");

const root = resolve(process.cwd());
const manifestPath = resolve(root, "public/manifest.webmanifest");
const layoutPath = resolve(root, "src/app/layout.tsx");
const appShellPath = resolve(root, "src/components/app-shell.tsx");
const pagePath = resolve(root, "src/app/page.tsx");

// 1. Verificar existencia de archivos obligatorios
assert.ok(existsSync(manifestPath), "public/manifest.webmanifest debe existir");
assert.ok(existsSync(layoutPath), "src/app/layout.tsx debe existir");
assert.ok(existsSync(appShellPath), "src/components/app-shell.tsx debe existir");
assert.ok(existsSync(pagePath), "src/app/page.tsx debe existir");

// 2. Validar estructura del manifest.webmanifest
const manifestRaw = readFileSync(manifestPath, "utf8");
let manifest: any;
try {
  manifest = JSON.parse(manifestRaw);
} catch (err) {
  assert.fail("public/manifest.webmanifest no es un JSON válido");
}

assert.equal(typeof manifest.name, "string", "manifest debe tener un 'name'");
assert.ok(manifest.name.length > 0, "'name' no puede estar vacío");
assert.equal(typeof manifest.short_name, "string", "manifest debe tener un 'short_name'");
assert.equal(manifest.display, "standalone", "manifest display debe ser 'standalone'");
assert.ok(manifest.start_url, "manifest debe tener 'start_url'");
assert.ok(manifest.theme_color, "manifest debe tener 'theme_color'");
assert.ok(manifest.background_color, "manifest debe tener 'background_color'");
assert.ok(Array.isArray(manifest.icons), "manifest debe contener un arreglo de 'icons'");
assert.ok(manifest.icons.length > 0, "manifest debe contener al menos un icono");

for (const icon of manifest.icons) {
  assert.ok(icon.src, "cada icono debe tener propiedad 'src'");
  assert.ok(icon.sizes, "cada icono debe tener propiedad 'sizes'");
  assert.ok(icon.type, "cada icono debe tener propiedad 'type'");
  const iconPath = resolve(root, "public", icon.src.replace(/^\//, ""));
  assert.ok(existsSync(iconPath), `El icono referenciado en manifest no existe: ${icon.src}`);
}

// 3. Validar integración en layout.tsx
const layoutContent = readFileSync(layoutPath, "utf8");
assert.match(
  layoutContent,
  /manifest:\s*["']\/manifest\.webmanifest["']/,
  "layout.tsx debe vincular /manifest.webmanifest en metadata"
);

// 4. Validar App Shell y estados en app-shell.tsx
const shellContent = readFileSync(appShellPath, "utf8");
assert.match(shellContent, /export\s+function\s+AppShell/, "app-shell.tsx debe exportar AppShell");
assert.match(shellContent, /export\s+function\s+LoadingState/, "app-shell.tsx debe exportar LoadingState");
assert.match(shellContent, /export\s+function\s+ErrorState/, "app-shell.tsx debe exportar ErrorState");
assert.match(shellContent, /export\s+function\s+EmptyState/, "app-shell.tsx debe exportar EmptyState");

// 5. Validar uso del AppShell y estados en page.tsx
const pageContent = readFileSync(pagePath, "utf8");
assert.match(pageContent, /<AppShell>/, "page.tsx debe renderizar AppShell");
assert.match(pageContent, /LoadingState/, "page.tsx debe integrar LoadingState");
assert.match(pageContent, /ErrorState/, "page.tsx debe integrar ErrorState");
assert.match(pageContent, /EmptyState/, "page.tsx debe integrar EmptyState");

console.log("manifest.spec.ts: PASS (todas las verificaciones críticas superadas)");

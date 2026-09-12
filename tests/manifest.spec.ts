import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

type WebManifest = {
  name?: string;
  short_name?: string;
  start_url?: string;
  scope?: string;
  display?: string;
  background_color?: string;
  theme_color?: string;
  lang?: string;
  icons?: Array<{
    src?: string;
    sizes?: string;
    type?: string;
    purpose?: string;
  }>;
};

const root = process.cwd();
const manifestPath = resolve(root, "public/manifest.webmanifest");
const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as WebManifest;
const layout = await readFile(resolve(root, "src/app/layout.tsx"), "utf8");
const page = await readFile(resolve(root, "src/app/page.tsx"), "utf8");
const appShell = await readFile(resolve(root, "src/components/app-shell.tsx"), "utf8");

assert.equal(manifest.name, "Inspecciones de Laboratorio");
assert.equal(manifest.short_name, "Inspecciones");
assert.equal(manifest.start_url, "/");
assert.equal(manifest.scope, "/");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.background_color, "#f3f0e8");
assert.equal(manifest.theme_color, "#123c3a");
assert.equal(manifest.lang, "es-MX");
assert.ok(manifest.icons?.some((icon) => icon.src === "/icons/icon-192.svg" && icon.sizes === "192x192"));
assert.ok(manifest.icons?.some((icon) => icon.src === "/icons/icon-512.svg" && icon.sizes === "512x512"));

for (const icon of manifest.icons ?? []) {
  assert.equal(icon.type, "image/svg+xml");
  await access(resolve(root, "public", icon.src?.replace(/^\//, "") ?? ""));
}

assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/);
assert.match(layout, /themeColor:\s*"#123c3a"/);
assert.match(page, /<AppShell inspections=\{inspections\}/);
assert.match(appShell, /Navegación principal/);
assert.match(appShell, /AppShellState = "ready" \| "loading" \| "error" \| "empty"/);
assert.match(appShell, /role="status"/);
assert.match(appShell, /role="alert"/);
assert.match(appShell, /No hay inspecciones sinteticas/);

console.log("manifest.spec.ts: PASS");

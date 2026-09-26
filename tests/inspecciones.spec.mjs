import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

try {
  const pagePath = resolve(root, "src/app/inspecciones/page.tsx");
  const loadingPath = resolve(root, "src/components/loading-state.tsx");
  
  const pageContent = await readFile(pagePath, "utf8");
  const loadingContent = await readFile(loadingPath, "utf8");

  assert.ok(pageContent.includes("use client"), "La ruta de inspecciones debe ser Client-Side (CSR) usando 'use client'");
  assert.ok(pageContent.includes("LoadingState"), "La ruta de inspecciones debe usar el componente LoadingState");
  assert.match(pageContent, /estado.*carga|cargando/i, "La ruta de inspecciones debe manejar el estado de carga");
  assert.match(pageContent, /estado.*error|error/i, "La ruta de inspecciones debe manejar el estado de error");
  
  assert.ok(loadingContent.length > 0, "El componente LoadingState debe existir");
  
  console.log("inspecciones.spec.mjs: PASS (ruta y estados críticos validados)");
} catch (error) {
  console.error("inspecciones.spec.mjs: FAIL -", error.message);
  process.exit(1);
}

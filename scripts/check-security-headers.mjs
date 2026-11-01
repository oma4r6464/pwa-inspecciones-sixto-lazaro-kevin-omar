import { getSecurityHeaders } from "../src/lib/security/security-headers.mjs";

const baseUrl = (process.argv[2] ?? process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const paths = [
  "/",
  "/inspecciones",
  "/inspecciones/inspection-001",
  "/manifest.webmanifest",
  "/sw.js",
  "/icon.svg"
];
const expected = getSecurityHeaders({ isDev: false });
const failures = [];

for (const path of paths) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`);
  } catch {
    console.error(`No se pudo conectar con ${baseUrl}. Ejecuta antes: npm run build && npm start`);
    process.exit(1);
  }

  const problems = [];
  if (!response.ok) problems.push(`estado HTTP ${response.status}`);
  for (const { key, value } of expected) {
    const actual = response.headers.get(key);
    if (actual !== value) problems.push(`${key}: esperado "${value}", recibido "${actual ?? "(ausente)"}"`);
  }
  if (response.headers.has("x-powered-by")) problems.push("X-Powered-By no debe enviarse");

  console.log(`${problems.length === 0 ? "PASS" : "FAIL"}  ${path}`);
  for (const problem of problems) failures.push(`${path} -> ${problem}`);
}

if (failures.length > 0) {
  console.error(`\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`\nCabeceras de seguridad: PASS (${paths.length} rutas en ${baseUrl})`);
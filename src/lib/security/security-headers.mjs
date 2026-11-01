/**
 * Controles de CSP, cabeceras de seguridad y Permissions-Policy (Semana 9, issue #39).
 *
 * Es un archivo .mjs (con tipos en JSDoc) porque next.config.mjs no puede importar
 * TypeScript. Es la única fuente de verdad: la usan la configuración de Next.js,
 * las pruebas y el script de comprobación de cabeceras.
 */

/** @typedef {{ key: string, value: string }} SecurityHeader */

/**
 * Construye la Content-Security-Policy.
 *
 * Excepciones documentadas:
 * - `script-src 'unsafe-inline'`: las páginas estáticas de Next.js incluyen scripts
 *   inline de arranque/hidratación (`self.__next_f.push(...)`) sin nonce.
 * - `script-src 'unsafe-eval'` y `style-src 'unsafe-inline'`: solo en desarrollo
 *   (React Refresh y estilos inyectados por el servidor de desarrollo).
 *
 * @param {{ isDev?: boolean }} [options]
 * @returns {string}
 */
export function buildContentSecurityPolicy({ isDev = false } = {}) {
  const directives = [
    ["default-src", ["'self'"]],
    ["script-src", isDev ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"] : ["'self'", "'unsafe-inline'"]],
    ["style-src", isDev ? ["'self'", "'unsafe-inline'"] : ["'self'"]],
    ["img-src", ["'self'", "data:"]],
    ["font-src", ["'self'"]],
    ["connect-src", ["'self'"]],
    ["worker-src", ["'self'"]],
    ["manifest-src", ["'self'"]],
    ["frame-src", ["'none'"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]]
  ];

  return directives.map(([name, sources]) => `${name} ${sources.join(" ")}`).join("; ");
}

/**
 * Permissions-Policy: solo cámara y geolocalización, y solo para el propio origen.
 * La cámara se pide sin audio (`audio: false`), por eso el micrófono queda denegado.
 * Las notificaciones no se gobiernan con esta cabecera; se piden solo tras una acción.
 *
 * @returns {string}
 */
export function buildPermissionsPolicy() {
  return ["camera=(self)", "geolocation=(self)", "microphone=()", "payment=()", "usb=()"].join(", ");
}

/**
 * Cabeceras de seguridad que se aplican a todas las respuestas.
 * HSTS solo se envía fuera de desarrollo; los navegadores lo ignoran sobre HTTP.
 *
 * @param {{ isDev?: boolean }} [options]
 * @returns {SecurityHeader[]}
 */
export function getSecurityHeaders({ isDev = false } = {}) {
  /** @type {SecurityHeader[]} */
  const headers = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy({ isDev }) },
    { key: "Permissions-Policy", value: buildPermissionsPolicy() },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "no-referrer" }
  ];

  if (!isDev) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
  }

  return headers;
}

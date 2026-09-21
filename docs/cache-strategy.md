# Estrategia de caché — Semana 3

## Alcance

La estrategia de Semana 3 agrega consulta offline al shell de inspecciones de laboratorio usando únicamente datos sintéticos. El objetivo es que la app pueda abrir la vista principal aunque la red falle, sin cachear datos sensibles ni activar una versión nueva de forma sorpresiva.

## Service worker

- Archivo: `public/sw.js`.
- Registro: `src/lib/pwa/register-service-worker.ts`.
- Versión declarada: `SW_VERSION = "v1"`.
- Nombre de caché: `inspecciones-cache-${SW_VERSION}`.
- Fallback offline: `OFFLINE_FALLBACK_URL = "/"`.

## Precache de instalación

Durante el evento `install` se abre `CACHE_NAME` y se precachean los recursos mínimos para arrancar el shell:

- `/`
- `/manifest.webmanifest`
- `/icon.svg`

Si el precache falla, el error se registra en consola para diagnóstico. No se llama `self.skipWaiting()` durante `install`; esto evita que una versión nueva tome control sin decisión del cliente.

## Estrategia para navegación

Las solicitudes de navegación usan **network-first**:

1. Intenta responder desde red.
2. Si la red responde, guarda una copia en `CACHE_NAME`.
3. Si la red falla, busca la misma navegación en caché.
4. Si no existe esa entrada, responde con el fallback `/`.
5. Si tampoco hay fallback disponible, devuelve `Response.error()`.

Esta decisión prioriza contenido fresco cuando hay conexión y conserva una ruta offline segura cuando la conectividad es intermitente.

## Estrategia para assets same-origin

Las solicitudes `GET` del mismo origen que no son navegación usan **cache-first con revalidación en segundo plano**:

1. Busca primero el recurso en caché.
2. En paralelo intenta descargar una copia nueva.
3. Si ya había recurso cacheado, lo devuelve de inmediato.
4. Si llega una respuesta de red válida, actualiza la caché.
5. Si no había caché y la red responde, devuelve la respuesta de red.
6. Si no hay caché ni red disponible, devuelve `Response.error()`.

Esta decisión mejora velocidad y disponibilidad para assets estáticos sin bloquear el render por red.

## Solicitudes no interceptadas

El service worker no intercepta:

- Solicitudes que no sean `GET`.
- Solicitudes cross-origin.

Esto reduce el riesgo de cachear respuestas externas, credenciales o datos que no forman parte del shell controlado por la app.

## Invalidación de caché

Durante `activate`, el service worker:

1. Lista todas las cachés disponibles.
2. Borra cualquier caché cuyo nombre sea distinto de `CACHE_NAME`.
3. Ejecuta `self.clients.claim()` para tomar control de clientes abiertos después de activarse.

Cuando cambie la estrategia o los recursos críticos, se debe incrementar `SW_VERSION` para crear una caché nueva e invalidar las anteriores.

## Actualización segura

La actualización evita activar una versión nueva sin confirmación:

- `registerServiceWorker` detecta un worker en `waiting` o un `updatefound`.
- Cuando la nueva versión llega a `installed` y ya existe un controller, se notifica al cliente.
- El shell pregunta al usuario con `confirm()`.
- Solo si el usuario acepta, `applyServiceWorkerUpdate` envía `{ type: "SKIP_WAITING" }`.
- `public/sw.js` escucha ese mensaje y entonces ejecuta `self.skipWaiting()`.
- El cliente recarga una sola vez con el flag `hasReloaded` al detectar `controllerchange`.

Con esto se evita reemplazar la app mientras una persona está usando el formulario de demostración.

## Trade-offs

- **Network-first para navegación:** entrega la versión más reciente cuando hay red, pero puede tardar más si la conexión falla lentamente.
- **Cache-first para assets:** mejora velocidad y soporte offline, pero puede servir un asset anterior hasta que la revalidación en segundo plano actualice la caché.
- **Activación con confirmación:** protege sesiones abiertas, pero requiere acción del usuario para aplicar la nueva versión.
- **Fallback a `/`:** asegura una pantalla útil offline, pero todavía no representa una página offline dedicada.

## Límites conocidos

- No hay sincronización en segundo plano.
- No hay push notifications.
- Las inspecciones creadas desde la UI siguen siendo temporales en memoria.
- No se cachean respuestas de APIs porque todavía no existe backend.
- La prueba automatizada valida estructura y decisiones críticas, pero no instala la PWA en un dispositivo físico.

## Verificación reproducible

Comandos locales:

```bash
npm ci
npm run verify
npm test
npm run build
```

El Makefile define `make verify` como equivalente directo de `npm run verify`. Si `make` no está disponible en Windows, se documenta y ejecuta el equivalente exacto:

```bash
npm run verify
```

Prueba manual recomendada:

1. Ejecutar `npm run build`.
2. Ejecutar `npm start`.
3. Abrir `http://localhost:3000`.
4. Revisar DevTools > Application > Service Workers y Cache Storage.
5. Activar modo offline en DevTools.
6. Recargar y confirmar que el shell sigue renderizando desde caché.

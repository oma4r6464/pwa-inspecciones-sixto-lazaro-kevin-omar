# PWA de inspecciones de laboratorio — proyecto base

Starter oficial para la materia **Aplicaciones Web Progresivas**.

Este repositorio es el punto de partida común para las actividades de las semanas 1–13. En la Semana 1 no debes construir todavía toda la PWA: debes poner en marcha este proyecto, documentar el problema y dejar una primera versión reproducible. Cada semana conservarás el mismo repositorio y agregarás la capacidad indicada por la actividad.

## Requisitos locales

- Node.js 20.19 o posterior compatible con Next.js.
- npm 10 o superior.
- Git y una cuenta de GitHub.

Versiones utilizadas en esta revisión: Node.js 24.19.0 y npm 11.17.0.

## Arranque verificable

```bash
npm ci
npm run dev
```

Abre <http://localhost:3000>. Debes ver la pantalla inicial de inspecciones con datos sintéticos y el **App Shell** instalable.
Para verificar el avance de la **Semana 2**:
- **Manifest PWA**: Abre Chrome DevTools > Application > Manifest y comprueba los metadatos y el icono SVG.
- **App Shell y Navegación**: Menú interactivo responsivo (móvil y escritorio) con enlaces a Inicio e Inspecciones.
- **Estados de interfaz**:
  - *Carga*: Estado visible durante la simulación de lectura inicial y guardado (`LoadingState`).
  - *Éxito*: Notificación toast animada tras agregar una inspección sintética.
  - *Error con reintento*: Alternancia determinista de fallo en segundo intento con botón "Reintentar" (`ErrorState`).
  - *Vacío*: Botón "Vaciar lista" para visualizar `EmptyState` y botón para "Restaurar datos sintéticos".

Para verificar el avance de la **Semana 3**:

- **Service worker**: `public/sw.js` se registra desde `src/lib/pwa/register-service-worker.ts`.
- **Caché**: la estrategia queda documentada en `docs/cache-strategy.md`.
- **Offline**: ejecuta `npm run build && npm start`, abre DevTools > Application > Service Workers / Cache Storage, carga la app una vez, activa modo offline y recarga.
- **Actualización segura**: si hay una versión nueva del service worker en espera, la app pide confirmación antes de enviar `SKIP_WAITING`.

Antes de entregar ejecuta:

```bash
npm ci
npm run verify
npm test
npm run build
```

`npm run verify` comprueba la presencia de artefactos requeridos, incluyendo los archivos de Semana 3, y genera `reports/verification.json`. `npm test` ejecuta el test de starter (`tests/starter.spec.mjs`), la suite de validación de manifest y componentes (`tests/manifest.spec.ts`), y las pruebas de service worker/offline (`tests/service-worker.spec.ts` y `tests/offline.spec.ts`). `npm run build` valida la compilación optimizada en producción. Si el entorno tiene Bash disponible, `bash public-tests/check.sh` ejecuta una comprobación estructural adicional y de ausencia de secretos. La corrida verde de GitHub Actions es la evidencia técnica del arranque.

Para Semana 04, `docs/security-controls.md` documenta la decisión de mantener
los datos en memoria y limitar el contexto de errores a cinco campos técnicos
en `src/lib/security/safe-error.ts`. `tests/security.spec.ts` prueba que no
pasen datos sensibles sintéticos; los reportes reproducibles están en
`reports/week-04/secret-scan.json`, `reports/week-04/negative-tests.json` y
`evidence/week-04/engineering.json`.

Para la sincronización offline, `docs/sync-policy.md` documenta la cola,
reintentos, idempotencia y resolución de conflictos. La prueba reproducible
`tests/sync.spec.ts` usa únicamente transportes en memoria y se ejecuta como
parte de `npm test` (también con `npm run test -- --run`).

Para verificar el avance de la **Semana 4** de renderizado:

- **Listado CSR**: abre `/inspecciones`; la ruta usa interacción del cliente para búsqueda, recarga y simulación de error.
- **Detalle SSR**: abre `/inspecciones/inspection-001`; la ruta renderiza el detalle desde servidor y usa `notFound()` para IDs inexistentes.
- **Decisión técnica**: `docs/rendering-decision.md` compara CSR vs SSR, supuestos, límites y métrica repetible de carga.
- **Pruebas**: `npm test` ejecuta `tests/rendering.spec.ts` y `tests/inspecciones.spec.mjs` junto con las pruebas acumuladas.

Para verificar el avance de la **Semana 5** de sincronización:

- **Política de conflictos y reintentos**: `src/lib/sync/conflict-policy.ts` decide conflictos entre versión local y remota simulada, clasifica fallos y calcula el backoff de forma determinista.
- **Cola**: `src/lib/sync/queue.ts` aplica la política (tope de intentos, espera entre reintentos, ediciones sin pérdida, confirmaciones repetidas o fuera de orden se ignoran).
- **Decisión técnica**: `docs/sync-policy.md` explica las reglas, alternativas descartadas y limitaciones.
- **Pruebas**: `npm run test -- --run` ejecuta `tests/sync.spec.ts` (conflicto, reintento e idempotencia) junto con las pruebas acumuladas.
- **CI visible**: `.github/workflows/week-05-w05-sync-data.yml` replica el feedback publico del kit de Semana 5 sin reemplazar los checks privados del evaluador.

Para verificar el avance de la **Semana 6: capacidades opcionales**:

Abre Inicio y pulsa Agregar inspeccion. Los controles opcionales permiten
comprobar camara, probar ubicacion sintetica y enviar una notificacion. Si no
hay permiso o service worker activo, se muestra un aviso local; puedes guardar
sin usar estas opciones. No se capturan fotos ni coordenadas reales.

- **Módulo de cámara opcional**: `src/lib/device/camera.ts` detecta soporte y solicita permisos bajo acción explícita del usuario sin bloqueos.
- **Manejo de estados**: clasifica en `available`, `unsupported`, `permission_denied` y `recoverable_error`.
- **Fallback resiliente**: ante navegadores sin cámara o permisos denegados, genera descriptores de evidencia sintética garantizando que el flujo de inspección continúe.
- **Geolocalización mínima**: `src/lib/device/geolocation.ts` se activa por acción explícita, reduce la precisión a una zona aproximada y devuelve un punto sintético si no se obtiene permiso o soporte.
- **Notificaciones**: `src/lib/notifications/client.ts` solicita permiso solo desde una acción explícita y usa un aviso local como fallback cuando el navegador o el service worker no están disponibles.
- **Privacidad estricta**: cero PII, sin fotos reales en el repositorio, sin secretos ni servicios externos.
- **Decisión técnica**: `docs/capabilities.md` documenta la matriz de estados, el flujo de fallback y las restricciones de plataforma.
- **Pruebas**: `npm run test -- --run` ejecuta `tests/capabilities.spec.ts` junto con las suites acumuladas, incluyendo fallbacks de cámara, ubicación y notificaciones.

Para verificar el avance de la **Semana 8: estrategia de pruebas**:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:integration
npx playwright install chromium
npm run test:e2e
make verify
```

En Windows, si `make` no está instalado, el equivalente exacto es `npm run verify`.
La automatización equivalente está en `.github/workflows/academic-evaluation.yml`:
instala dependencias, ejecuta lint estructural, tipos, build, pruebas unitarias,
integración y E2E con Chromium. Publica los reportes de `reports/e2e/`,
`reports/week-08/`, `test-results/` y `coverage/` como artefactos de Actions.
La estrategia, trade-offs, limitaciones y el defecto controlado están en
[`docs/test-strategy.md`](docs/test-strategy.md).

## Semana 9: seguridad y privacidad

Los entregables están en [modelo de amenazas](docs/threat-model.md),
[inventario de privacidad](docs/privacy-data-inventory.md), `src/lib/security/`,
`tests/security.spec.ts` y `public/robots.txt`. Se conserva el flujo offline
con datos sintéticos; los controles validan entradas antes de guardar/enviar,
restringen recursos y permisos y evitan exponer el contenido en errores.

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm test -- --run
npm run test:unit
npm run test:integration
npx playwright install chromium
npm run test:e2e
make verify
```

En Windows sin Make, ejecutar `npm run verify`: es el equivalente exacto del
Makefile. Para revisar headers con el servidor de producción activo, ejecutar
`npm start` y, en otra terminal, `npm run check:headers`.

El workflow del kit `.github/workflows/week-09-w09-security-privacy.yml`
ejecuta instalación, build y pruebas; publica `test-results/security-report.json`
con fecha UTC, revisión y resultado real. Los checks acumulados se conservan.
El workflow académico existente publica el reporte HTML E2E y trazas como
artefactos de Actions. Los reportes temporales se generan localmente o en CI;
no se versionan. `npm run verify` genera además `reports/verification.json`,
que comprueba artefactos y no reemplaza las pruebas de comportamiento.

El check público de Semana 9 se conserva en `public-tests/week-09/check.sh`
para mantener el de Semana 1. Ejecutarlo desde la raíz con
`bash public-tests/week-09/check.sh`. En Git Bash instalado en Windows puede
invocarse con `& 'C:\Program Files\Git\bin\bash.exe' --noprofile --norc public-tests/week-09/check.sh`.
El original imprime coincidencias de palabras en documentación y lockfile,
pero termina `PUBLIC_OK`/código 0 incluso cuando encuentra coincidencias:
la negación `! rg` no aborta con `set -e`. Por tanto, ese resultado no prueba
ausencia de credenciales. El lint estructural y la revisión de cambios son
complementarios y tampoco constituyen una garantía exhaustiva.

Límites: la CSP permite scripts inline para la hidratación de Next.js; no
bloquea por sí sola un script inline inyectado. La prueba E2E verifica que el
formulario representa marcado como texto. IndexedDB carece de cifrado y
retención automática; no hay autenticación ni backend. HTTPS es obligatorio
para un despliegue y no se acredita con una ejecución en localhost.
La auditoría de esta entrega informa 2 vulnerabilidades altas y 1 crítica
en el árbol de dependencias. No se declara una solución libre de riesgos;
resolver Next.js requiere evaluar una migración mayor fuera del incremento.

La entrega utiliza el SHA completo fijado en Classroom, el enlace al CI de
esa revisión y [la evidencia individual](evidence/individual.md).

El Makefile del repositorio define `make verify` como equivalente directo
de `npm run verify`. Si `make` no está instalado en el entorno local, se
documenta y ejecuta el equivalente exacto:

```bash
npm run verify
```

En Windows, el escaneo local de Semana 04 se ejecuta con PowerShell mediante
`Get-ChildItem ... | Select-String ...`; no se usan ni se suben credenciales,
datos personales, ubicaciones reales o fotografías reales.


## Flujo de trabajo del curso

1. Conserva este repositorio como el proyecto del equipo y usa el repositorio privado común en GitHub.
2. Completa únicamente los entregables de la actividad de la semana.
3. Haz cambios pequeños y descriptivos; no borres lo que ya funciona.
4. Ejecuta la verificación local y espera que GitHub Actions termine en verde.
5. Entrega en Classroom la URL del repositorio, el SHA exacto evaluado, el enlace a Actions y `evidence/individual.md`.

No uses datos reales de personas, laboratorios o estudiantes. Todo dato del starter es sintético y el formulario de demostración debe llenarse únicamente con ejemplos ficticios.

## Estructura inicial

- `src/app/`: aplicación Next.js con App Router.
- `src/lib/data/`: datos sintéticos de inspecciones.
- `docs/`: plantillas de documentación de la Semana 1.
- `docs/cache-strategy.md`: decisiones de caché, fallback offline y actualización segura de Semana 3.
- `docs/rendering-decision.md`: comparación CSR/SSR, estados y métrica repetible de Semana 4.
- `docs/sync-policy.md`: política de conflictos, reintentos e idempotencia de Semana 5.
- `docs/capabilities.md`: decisiones de soporte de cámara, geolocalización, notificaciones y fallbacks sin PII.
- `scripts/verify.mjs`: verificación reproducible local.
- `tests/`: prueba mínima del starter.

Las decisiones de arquitectura y las nuevas carpetas se incorporan en las actividades correspondientes; no es necesario adelantarlas.

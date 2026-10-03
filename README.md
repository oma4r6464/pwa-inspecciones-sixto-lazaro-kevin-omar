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
- `scripts/verify.mjs`: verificación reproducible local.
- `tests/`: prueba mínima del starter.

Las decisiones de arquitectura y las nuevas carpetas se incorporan en las actividades correspondientes; no es necesario adelantarlas.

# Decisión de renderizado — Semana 4

## Alcance

Semana 4 compara renderizado del lado del cliente y del servidor para el mismo dominio de inspecciones de laboratorios. Todo el contenido usado es sintético y no contiene datos reales de estudiantes, personal, ubicaciones privadas, fotografías ni secretos.

## Rutas implementadas

- CSR: `src/app/inspecciones/page.tsx`
- SSR: `src/app/inspecciones/[id]/page.tsx`
- Estado reutilizable: `src/components/loading-state.tsx`
- Pruebas: `tests/rendering.spec.ts` y `tests/inspecciones.spec.mjs`

## Decisión

Se usa **CSR** en `/inspecciones` porque el listado requiere interacción inmediata: búsqueda local, recarga simulada y simulación de error. La ruta declara `"use client"` y maneja estados con `useState` y `useEffect`.

Se usa **SSR** en `/inspecciones/[id]` porque el detalle tiene contenido estable, derivado de datos sintéticos locales, y conviene que el HTML llegue desde el servidor con la información de la inspección. La ruta no declara `"use client"`, lee desde `src/lib/data/inspections.ts` e invoca `notFound()` para IDs inexistentes.

## Comparación CSR vs SSR

| Criterio | `/inspecciones` CSR | `/inspecciones/[id]` SSR |
|---|---|---|
| Objetivo | Interacción de listado | Detalle estable |
| Datos | Sintéticos en memoria de la vista | Sintéticos desde `src/lib/data/inspections.ts` |
| Estados | Carga, error, resultados y sin coincidencias | Contenido o `notFound()` |
| Ventaja | Respuesta rápida a búsqueda/filtros | HTML inicial con contenido de detalle |
| Trade-off | Depende de JavaScript para la interacción | Menos interactivo, pero más predecible |
| Riesgo principal | Hydration mismatch si el contenido inicial depende de valores no deterministas | Manejo incorrecto de IDs inexistentes |

## Estados de carga y error

El listado CSR usa `LoadingState` para mostrar carga mientras simula obtención de datos. También expone un botón para simular error de red y un botón de reintento.

El detalle SSR no simula carga del cliente porque se resuelve en servidor. El estado de error se representa con `notFound()` cuando el `id` no existe.

## Supuestos

- Los datos de `src/lib/data/inspections.ts` y `FAKE_INSPECTIONS` son sintéticos.
- No existe backend real todavía.
- No se usan credenciales, tokens, PII ni resultados de quizzes.
- La comparación se hace dentro del alcance de Next.js App Router.
- No se modifican workflows de GitHub Actions; la entrega se adapta al workflow existente.

## Métrica repetible

La métrica de carga repetible para esta semana es el tamaño y tipo de render reportado por `npm run build`.

En la verificación local de integración, Next reportó:

- `/inspecciones`: ruta estática con cliente interactivo, tamaño aproximado `1.77 kB`, First Load JS aproximado `89 kB`.
- `/inspecciones/[id]`: ruta dinámica server-rendered on demand, tamaño aproximado `1.49 kB`, First Load JS aproximado `97.5 kB`.

Estas cifras pueden variar ligeramente por versión de dependencias o cambios acumulados, pero el comando es reproducible:

```bash
npm run build
```

## Límites conocidos

- La ruta CSR usa una simulación local, no una API real.
- Los datos del listado se pierden al recargar porque no hay persistencia de Semana 4.
- No hay medición Lighthouse automatizada.
- La comparación de carga se basa en la salida reproducible de `next build`, no en medición de dispositivo físico.
- La app mantiene service worker de Semana 3; para evitar confundir pruebas manuales, se recomienda probar renderizado con caché limpia cuando se mida en navegador.

## Verificación

Comandos ejecutables:

```bash
npm ci
npm run verify
npm test
npm run build
```

`make verify` equivale a `npm run verify` en el Makefile. Si `make` no está disponible en Windows, se documenta y ejecuta el equivalente exacto:

```bash
npm run verify
```

Las pruebas cubren:

- Existencia de rutas CSR/SSR.
- Que el detalle SSR no declare `"use client"`.
- Que el detalle maneje IDs inexistentes con `notFound()`.
- Que el listado CSR use `LoadingState` y estados de carga/error.
- Que no se haga `fetch()` a servicios externos desde el detalle.

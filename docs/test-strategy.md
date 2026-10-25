# Estrategia de pruebas — Semana 8

## Diagnóstico de la versión base

La línea base se revisó antes de los cambios de Semana 8:

- SHA base: `ca799d93ad3cb6446456f661a8a233cc1812f195` (`main`).
- Entorno observado: Node.js `v26.2.0`, npm `11.13.0`.
- `npm ci`: terminó con código `0` e instaló 32 paquetes. npm reportó 3 vulnerabilidades en dependencias: 2 altas y 1 crítica. No se ejecutó una corrección automática.
- `npm test`: terminó con código `0`. Pasaron starter, manifest, service worker, offline, rendering, inspecciones, sincronización, capabilities y security.
- `npm run dev`: Next.js informó `Ready` en `http://localhost:3000`; la solicitud HTTP devolvió `200` y el título fue “Inspecciones de laboratorio”.

### Preparación, acción y resultados del formulario

La prueba manual se hizo en la aplicación local con valores sintéticos:

| Preparación | Acción | Resultado esperado | Resultado observado |
|---|---|---|---|
| Formulario abierto; ubicación y resumen vacíos. | Pulsar “Guardar inspección”. | Rechazar la captura y mostrar error. | Se mostró “Ubicación y resumen son obligatorios”; la lista conservó 3 tarjetas. |
| Formulario abierto; ubicación y resumen contienen tres espacios cada uno. | Pulsar “Guardar inspección”. | Rechazar los valores que quedan vacíos tras recortar espacios. | Se mostró el mismo error; la lista conservó 3 tarjetas. |
| Formulario abierto; ubicación “Laboratorio Demo 08”, resumen “Inspección sintética de referencia” y responsable vacío. | Pulsar “Guardar inspección”. | Aceptar la captura; el responsable es opcional. | Se mostró el mensaje de éxito, la lista pasó a 4 tarjetas y el responsable apareció como “Sin asignar”. |

En la línea base, la comprobación de campos estaba dentro del componente `src/app/page.tsx`, por lo que no podía probarse directamente como regla pura. Además, el guardado de demostración se realiza en memoria y genera el ID a partir de `Date.now()`; no integra la cola de sincronización.

### Diagnóstico del riesgo de duplicación

El escenario de respuesta remota perdida no se pudo reproducir en el flujo real porque la demo no usa backend ni transporte remoto. El riesgo se delimita así: si un envío remoto se acepta pero se pierde la respuesta, un reintento con un ID nuevo podría representar una segunda captura. No se afirma que esto ocurra actualmente en un backend.

La cola existente evita duplicar entradas al encolar el mismo ID. La garantía depende de que el productor conserve y reutilice ese ID al reintentar. No deduplica capturas equivalentes con IDs distintos. La suite acumulada de la línea base ya incluía un caso de reencolado con el mismo ID y un solo envío.

## Contratos para integración

### Validación de captura

Implementación: `src/lib/validation/inspection-capture.ts`.

```ts
validateInspectionCapture({ location, summary })
```

- `location` y `summary` son obligatorios.
- Se considera vacío todo valor cuya llamada a `.trim()` produzca una cadena vacía.
- Un resultado válido tiene la forma `{ valid: true }`.
- Un resultado inválido tiene la forma `{ valid: false, missingFields: ["location", "summary"] }`, incluyendo únicamente los campos faltantes y en el orden ubicación, resumen.
- La regla valida, pero no devuelve ni aplica la normalización de los valores.
- `inspector` no forma parte de esta regla y permanece opcional en el formulario.
- `src/app/page.tsx` usa esta función al enviar el formulario y conserva el mensaje visible existente.

### Cola e idempotencia

Implementación: `src/lib/sync/queue.ts`; tipos de registro: `src/lib/storage/schema.ts`.

- La llave de idempotencia es `InspectionRecord.id`. El productor debe conservar el mismo ID durante los reintentos de una misma operación.
- `enqueue(record)` repetido con el mismo ID mantiene una sola entrada pendiente.
- El mismo ID con payload cambiado actualiza el registro y avanza su versión; no representa una segunda entrada.
- En una sincronización exitosa, `synchronize(true, send)` devuelve el ID en `synchronized` y elimina la entrada de pendientes.
- La garantía es local a la cola y al ID; no garantiza deduplicación remota, persistencia entre reinicios con `MemoryQueueStorage` ni deduplicación semántica entre IDs distintos.
- Las pruebas unitarias usan `MemoryQueueStorage` y un sender en memoria; no se requiere red, hardware ni servicios externos.

## Matriz riesgo–prueba

| Riesgo/regla | Preparación y acción | Aserción de prueba | Prueba y resultado |
|---|---|---|---|
| Captura válida rechazada por error | Ubicación y resumen sintéticos no vacíos. | Resultado exacto `{ valid: true }`. | `tests/unit/inspection-capture.test.ts`: PASS. |
| Campo obligatorio vacío aceptado | Ambos campos `""`. | `valid: false`; faltantes exactos `location`, `summary`. | `tests/unit/inspection-capture.test.ts`: PASS. |
| Campo de espacios aceptado | Ubicación con espacios; resumen con tabulador y salto de línea. | Ambos campos reportados como faltantes. | `tests/unit/inspection-capture.test.ts`: PASS. |
| Error identifica campos en forma precisa | Ubicación válida y resumen de espacios. | Únicamente `summary` aparece en `missingFields`. | `tests/unit/inspection-capture.test.ts`: PASS. |
| Reintento encola dos veces la misma operación | Encolar el mismo registro sintético dos veces y sincronizar con sender en memoria. | Una entrada pendiente antes de sincronizar, una llamada al sender, ID sincronizado y cola vacía al final. | `tests/unit/inspection-queue.test.ts`: PASS. |
| Edición confundida con una segunda captura | Encolar el mismo ID con un payload distinto. | Una entrada, misma llave e incremento a versión 2 con el payload actualizado. | `tests/unit/inspection-queue.test.ts`: PASS. |
| Regresión en suite acumulada | Ejecutar `npm test`. | Se conservan las suites previas, incluida sincronización. | Última ejecución observada: PASS. |

Las pruebas unitarias se ejecutan con `npm run test:unit`. La ejecución observada produjo 6 aprobadas y 0 fallidas y guardó el reporte de salida/cobertura en `reports/week-08/unit-report.txt`. Node reportó cobertura de línea de 100 % para `inspection-capture.ts`, 71.69 % para `queue.ts` y 64.72 % total de los archivos instrumentados en esa corrida. La cobertura parcial de la cola no representa cobertura total de sus políticas.

## Límites y siguientes verificaciones

- La prueba del formulario comprueba el helper que usa el flujo real; no automatiza el DOM del formulario.
- La cola se prueba en memoria; no se cubren IndexedDB, persistencia tras reinicio, concurrencia entre pestañas ni garantías de un backend.
- No se cubre deduplicación de payloads equivalentes que tengan IDs diferentes.
- Las vulnerabilidades reportadas por `npm ci` en la línea base se registran como observación; esta actividad no cambió dependencias ni verificó una remediación.
- `npm run verify` comprueba presencia de artefactos y genera `reports/verification.json`; no sustituye `npm run test:unit`, `npm test` ni `npm run build`.

# Política de sincronización: conflictos y reintentos — Semana 5

## Alcance

Define cómo se sincronizan las inspecciones pendientes y cómo se resuelven los conflictos sin perder datos ni duplicar registros. Todo es determinista y reproducible: **no hay red real ni servicios externos**; la "versión remota" es una simulación que se pasa como parámetro.

- Política (funciones puras): `src/lib/sync/conflict-policy.ts`.
- Integración: `src/lib/sync/queue.ts` (`SyncQueue`) y metadatos opcionales en `src/lib/storage/schema.ts`.
- Pruebas: `tests/sync.spec.ts` (se ejecutan con `npm test` / `npm run test -- --run`).

## Modelo de versiones

Cada inspección tiene un `id` estable (llave de idempotencia) y una `version` entera que sube en cada edición local (`metadata.version`, 1 al crearla). La política compara tres valores, en este orden:

1. `version` (mayor gana),
2. `updatedAt` (más reciente gana),
3. contenido canónico (`canonicalize`, llaves ordenadas) como desempate fijo.

Se descartó usar solo el reloj (last-write-wins puro): los relojes de dispositivos distintos no son confiables y un desfase borraría ediciones válidas. El contador de versión es el criterio principal; el reloj solo desempata.

## Decisión de conflictos: `resolveConflict(local, remote)`

| Situación | `action` | Resultado |
| --- | --- | --- |
| Versiones idénticas | `noop` | No cambia nada |
| Local más reciente, sin información que fusionar | `keep-local` | Se conserva local; debe enviarse |
| Remota más reciente, sin información que fusionar | `accept-remote` | Se adopta la remota |
| La perdedora tiene información que la ganadora no | `merge` | Versión fusionada con `version = max + 1` |

**Qué se conserva en la fusión.** Gana la versión superior campo a campo; de la perdedora se conservan (a) los campos que la ganadora no tiene y (b) la nota (`notes`) cuando es distinta, agregada como `[versión anterior] …`. Si ambas tienen un campo escalar con valores distintos (por ejemplo `score`), gana el de la versión ganadora y el campo queda listado en `discarded` para dejar rastro.

**Convergencia.** La función es simétrica: `resolveConflict(a, b).result` es igual a `resolveConflict(b, a).result`. Si dos dispositivos reciben la versión del otro, llegan al mismo estado. En la fusión, `version = max + 1` hace que el resultado se propague como una versión nueva.

## Reintentos seguros

- **Clasificación (`classifyFailure`)**: red/sin código, 408, 425, 429 y 5xx son *temporales*; 409 y 412 son *conflicto*; el resto de 4xx son *permanentes*.
- **Qué se reintenta (`decideRetry`)**: solo los temporales. Un conflicto no se reintenta a ciegas: primero se reconcilia con `resolveConflict`. Un permanente no se reintenta porque repetirlo no cambia el resultado.
- **Backoff (`nextBackoffMs`)**: exponencial sin aleatoriedad, `1000 · 2^(intento−1)` ms con tope de 30 000 ms. Se evita el *jitter* para que las pruebas sean reproducibles (límite: sin jitter, muchos clientes reintentarían a la vez contra un servidor real).
- **Tope**: 5 intentos (`DEFAULT_RETRY_POLICY.maxAttempts`). Al llegar, `retryable = false`.
- **En la cola**: `updateStatus(id, "FAILED", msg, { failureStatus })` guarda `retryable` y `nextAttemptAt`. `getReadyToSync(now)` devuelve solo lo que se puede enviar ahora; `getPending()` conserva su comportamiento anterior (todo lo pendiente o fallido, incluidos agotados) para mostrar estado.

## Idempotencia y respuestas fuera de orden

- **Misma inspección = un solo registro.** `enqueue` usa el `id` como llave; reencolar tras un fallo no crea otra fila. Si los datos son iguales no cambia nada; si son distintos es una edición nueva (`version + 1`) sobre el mismo registro, así una edición hecha mientras estaba `PENDING` ya no se pierde.
- **Edición durante el envío.** Si un registro `IN_PROGRESS` se edita, al confirmarse la versión vieja (`syncedVersion` menor a la actual) vuelve a `PENDING` en vez de marcarse `SYNCED`.
- **Respuestas repetidas o tardías (`shouldApplyResponse`)**: con `metadata.lastRemoteVersion` como referencia, una versión mayor se aplica (`apply`), una igual es `duplicate` y una menor es `stale`. Las dos últimas se ignoran sin escribir.
- `operationKey(id, version)` identifica una operación de envío (`inspection-1@v3`); misma inspección y versión es la misma operación.

## Limitaciones conocidas

- La fusión solo conserva información de `notes` y campos exclusivos; para otros campos con valores distintos gana la versión superior (queda en `discarded`).
- No hay servidor ni sincronización real: la versión remota es simulada y no se prueba latencia, concurrencia entre pestañas ni IndexedDB en un navegador real (las pruebas usan `fake-indexeddb`).
- Sin *jitter* en el backoff (decisión consciente por reproducibilidad).
- Reencolar manualmente un registro agotado le da un intento más: conserva su contador de intentos y, si vuelve a fallar, queda agotado otra vez.
- `npm audit` sigue reportando vulnerabilidades heredadas de dependencias; no se modificaron versiones.

## Cómo verificarlo

```bash
npm ci
npm run verify
npm run test -- --run
npm run build
```

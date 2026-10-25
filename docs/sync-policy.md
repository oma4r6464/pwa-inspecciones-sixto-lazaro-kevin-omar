# Politica de sincronizacion offline

## Alcance

La semana 5 agrega una estrategia offline-first para registrar inspecciones con datos sinteticos, mantener una cola local, sincronizar con reintentos, evitar duplicados y resolver conflictos de forma determinista.

## Cola e idempotencia

La cola usa `id` como llave estable de inspeccion. Encolar dos veces el mismo `id` conserva una sola entrada. Si el contenido cambia, se trata como una nueva version del mismo registro, no como un duplicado.

La implementacion expone `QueueStorage` para que la aplicacion pueda conectar IndexedDB u otro almacenamiento persistente. Las pruebas usan `MemoryQueueStorage` para mantener ejecucion determinista en Node y GitHub Actions.

## Reintentos

Los fallos temporales son red simulada, `408`, `425`, `429` y `5xx`. Los conflictos son `409` y `412`. El resto de `4xx` se considera permanente.

El backoff es exponencial y reproducible: `1000 * 2^(intento - 1)` con tope de `30000` ms. No se usa jitter porque las pruebas deben ser deterministas.

## Conflictos

La politica compara `version`, despues `updatedAt` y finalmente una serializacion canonica del contenido. La version remota solo reemplaza a la local cuando gana ese orden total.

Si la version perdedora contiene informacion que la ganadora no tiene, se fusiona y se incrementa la version resultante. Las notas distintas se conservan agregando la nota anterior al texto libre; otros campos escalares en conflicto conservan el valor de la version ganadora y se reportan en `discarded`.

## Respuestas fuera de orden

Cada envio puede identificarse con `operationKey(id, version)`. Una respuesta remota se aplica si trae una version mayor a la ultima procesada; si es igual se trata como duplicada, y si es menor se considera tardia.

## Supuestos y limites

- Los datos son sinteticos y no incluyen PII.
- No se usa red real ni servicios privados.
- La persistencia real de navegador queda detras del contrato `QueueStorage`.
- El backoff sin jitter favorece reproducibilidad, pero en produccion convendria agregar jitter para evitar reintentos simultaneos.
- La fusion automatica conserva notas y campos exclusivos; conflictos escalares conservan la version ganadora.

## Verificacion

```bash
npm ci
npm run test -- --run
npm run build
make verify
```

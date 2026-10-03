# Política de sincronización offline

La cola local usa el `id` de la inspección como clave de idempotencia. Guardar
dos veces el mismo `id` conserva una sola entrada y, si la segunda versión es
más reciente, reemplaza el contenido pendiente.

Cuando la aplicación está offline, `synchronize(false, ...)` no invoca ningún
transporte y conserva la cola. Al recuperar conectividad, cada entrada se
intenta como máximo tres veces por ejecución. Un error temporal deja la
entrada pendiente con su contador de intentos para que una ejecución posterior
pueda reanudarla. No se usa red real en las pruebas.

Los conflictos se resuelven con **last-write-wins** usando `updatedAt`. La
versión remota gana únicamente si es estrictamente más nueva; en empate se
conserva la versión local para que el resultado sea determinista y no genere
escrituras innecesarias. Los `id` distintos son un error de programación y se
rechazan explícitamente.

## Límites

- El almacenamiento incluido es una abstracción en memoria para pruebas; la
  aplicación puede conectarlo a IndexedDB mediante `QueueStorage`.
- La cola no simula reloj, latencia ni red: el transporte se inyecta como una
  función determinista.
- Una falla permanente queda pendiente después del límite de reintentos; el
  producto debe decidir cuándo notificarla o reintentarlo en una nueva sesión.

# Inventario de datos y privacidad — Semana 9

## Alcance

La PWA funciona como una demo local sin backend, cuenta de usuario ni
integracion con servicios de terceros. El inventario describe lo que existe en
el codigo actual; no atribuye cifrado, borrado remoto o controles que no estan
implementados. Todos los ejemplos y pruebas usan datos sinteticos.

## Datos tratados

| Dato sintetico | Origen | Finalidad y necesidad | Almacenamiento y acceso | Transferencias | Retencion y borrado |
| --- | --- | --- | --- | --- | --- |
| Identificador, resultado, notas, ubicacion textual, inspector, fecha y hallazgos de una inspeccion | Datos fijos de `src/lib/data/inspections.ts` y formulario | Mostrar el flujo de inspeccion, validar capturas y simular sincronizacion; son necesarios para la demo | Estado de React y cola de sincronizacion. La cola puede persistir en IndexedDB `pwa-inspecciones-queue`, store `queue`, clave `items`; cualquier codigo de la misma aplicacion puede leerla desde el perfil del navegador | No hay backend ni solicitudes de API; el service worker no intercepta solicitudes cross-origin ni no-GET | En memoria: hasta recarga o cierre. IndexedDB: permanece hasta que la aplicacion o el usuario borre la base; no hay expiracion ni boton de borrado implementado |
| `incidentId`, `correlationId`, estado, intento y duracion | Contexto tecnico sintetico creado por `safe-error.ts` | Diagnostico sin incluir contenido de inspeccion; solo se conservan campos permitidos y numeros acotados | En el objeto retornado; no se envia ni se persiste desde este modulo | Ninguna | Vida del objeto en memoria; no existe registro persistente |
| Ubicacion aproximada opcional | API de geolocalizacion, solo despues de accion explicita | Asociar contexto aproximado a una inspeccion; no es necesaria para continuar porque existe fallback sintetico | Memoria; se redondea a un decimal y se fuerza una precision minima de 10 km. No se guarda desde el modulo | No se envia a un servidor | Se pierde al cerrar o recargar; no existe borrado selectivo porque no se persiste |
| Evidencia sintetica de camara o fallback manual | API de camara opcional o generador local | Probar evidencia y fallback sin bloquear la inspeccion; la captura real no es necesaria | Memoria; el generador declara `hasPII: false` y no guarda una imagen | Ninguna | Vida del objeto en memoria; no existe almacenamiento de imagen ni borrado remoto |
| Estado de permiso y notificacion sintetica | APIs `Notification` y service worker, bajo accion explicita | Avisar de un cambio sintetico; es opcional y no se solicita automaticamente | El permiso lo administra el navegador; el texto fijo se entrega al service worker si esta disponible | No se manda contenido a terceros | La decision de permiso queda bajo el navegador; la PWA no implementa historial ni borrado de notificaciones |

## Offline, cache y capacidades

- **IndexedDB:** `IndexedDbQueueStorage` mantiene una copia en memoria y
  escribe la cola completa de inspecciones en el dispositivo. `flush()` permite
  esperar la escritura, pero no hay cifrado, vencimiento, migracion de datos ni
  borrado de la base.
- **Cache Storage:** `public/sw.js` precachea el shell (`/`,
  `/manifest.webmanifest` y `/icon.svg`) y cachea recursos GET del mismo
  origen. No cachea APIs porque no existe backend y deja pasar solicitudes
  cross-origin y no-GET. Las navegaciones usan network-first y los assets
  cache-first con revalidacion.
- **Camara, geolocalizacion y notificaciones:** son capacidades opcionales.
  Solo se solicitan despues de una accion y cada una tiene fallback o resultado
  explicito cuando no hay soporte o permiso. El microfono no se solicita.
- **Robots:** `public/robots.txt` pide a rastreadores no indexar ninguna ruta.
  Es una instruccion para crawlers, no un mecanismo de autenticacion, control de
  acceso, borrado ni proteccion de datos.

## Decisiones, limites y riesgos

Se conserva el funcionamiento offline porque es parte del producto, aunque
IndexedDB aumenta la exposicion para cualquier persona con acceso al perfil del
navegador. La aplicacion no ofrece autenticacion, cifrado local, control por
roles, sincronizacion con servidor ni politica automatica de retencion. Un
futuro backend tendria que definir legitimacion, acceso, cifrado en transito,
retencion, borrado verificable y respuesta a solicitudes de privacidad antes de
recibir datos reales.

La CSP limita scripts, conexiones, workers y manifiesto al mismo origen,
bloquea objetos embebidos y marcos, y deja `unsafe-inline` solo porque el
renderizado de Next.js lo requiere en esta configuracion. `Permissions-Policy`
permite camara, geolocalizacion y notificaciones únicamente al mismo origen y
desactiva microfono, pagos y USB. Estos encabezados reducen superficie del
navegador, pero no reemplazan validacion de entradas, permisos del sistema ni
autenticacion.

## Verificacion reproducible

```text
npm test -- --run
npm run lint
npm run typecheck
npm run build
npm run verify
```

La prueba de seguridad comprueba la normalizacion del contexto de error, la
validacion positiva y negativa de capturas, la ausencia de detalles sensibles
en errores, la existencia de `robots.txt` y la configuracion de CSP y permisos.

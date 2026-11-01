# Modelo de amenazas — Semana 9

## Alcance y supuestos

Este análisis describe la PWA presente en esta rama: una aplicación Next.js
para inspecciones de laboratorio de demostración. Los datos de prueba y de
interfaz deben ser sintéticos. No hay autenticación, backend de inspecciones,
servicio remoto real ni carga de fotografías. La sincronización actual usa
`syntheticRemoteSend`; no acredita transporte seguro ni controles del servidor.

El modelo se limita al flujo de captura, almacenamiento offline, representación
en pantalla, sincronización simulada, caché del service worker y solicitudes de
capacidades del dispositivo. No es una certificación ni una garantía frente a
un dispositivo comprometido, extensiones maliciosas, XSS en dependencias o
ataques a infraestructura que esta versión no contiene.

## Activos

| Activo | Ubicación actual | Clasificación y observación |
| --- | --- | --- |
| Captura de inspección: ubicación, resumen, responsable, estado, fecha y hallazgos | Estado de React y cola IndexedDB | Sintética por contrato del proyecto. IndexedDB persiste la captura entre recargas y no cifra el contenido. |
| Integridad e idempotencia de la cola | IndexedDB, `InspectionSyncQueue` | Evita duplicados por ID y valida payloads al encolar y antes de enviar. |
| Recursos de arranque de la PWA | Caché Cache Storage del service worker | Shell, manifest, icono, navegaciones same-origin y otros `GET` same-origin admitidos por el worker. |
| Permisos del navegador y acceso a capacidades | Cámara, geolocalización y notificaciones | La cámara y notificaciones se solicitan tras una acción. La interfaz actual simula la ubicación y no solicita coordenadas reales. |
| Contexto de diagnóstico seguro | Interfaz de error | Identificador de incidente/correlación y números normalizados; no necesita el objeto `Error` ni el contenido de la captura. |
| Secretos de acceso | No hay credenciales de usuario o tokens de API en el flujo actual | No hay servidor autenticado ni secretos requeridos por la sincronización sintética. Esto no sustituye un escaneo automatizado de secretos. |

## Entradas, flujos y límites de confianza

1. **Formulario → validación:** ubicación, resumen, responsable y estado
   provienen del navegador y se consideran entradas no confiables, aunque la
   interfaz los presente como sintéticos.
2. **Validación → guardado:** `validateInspectionCapture` delega en los
   controles de `src/lib/security/inspection-input.ts`. El almacén vuelve a
   validar el payload antes de encolarlo, sin depender de que el llamador sea
   la página.
3. **Almacén → IndexedDB:** la cola se persiste en el origen del navegador.
   IndexedDB es un límite de confianza distinto: datos antiguos, alterados por
   el usuario o incompatibles con una versión nueva no se presumen válidos.
4. **Cola → sincronización:** cada payload se vuelve a validar inmediatamente
   antes de llamar al remitente. El remitente actual es sintético; todavía no
   hay autenticación, transporte, validación de servidor ni autorización real.
5. **Datos → representación:** los campos se muestran como texto en JSX; no
   se usa `dangerouslySetInnerHTML`. La salida React no sustituye la validación
   del formato ni una política CSP.
6. **Service worker → caché:** `public/sw.js` precachea el shell y usa
   network-first para navegaciones. Para otros `GET` same-origin aplica caché
   con revalidación; no hay API de inspecciones hoy, pero la regla no excluye
   explícitamente una futura ruta API.
7. **Interfaz → capacidades:** la cámara solicita permiso únicamente tras
   una acción y libera el stream; no guarda una fotografía real. Notificaciones
   también requieren acción explícita. El control de ubicación de esta interfaz
   inyecta un proveedor sintético; la función de geolocalización sí contempla
   el proveedor del navegador, pero ese flujo no está conectado a la captura.

Los límites relevantes son: entrada del cliente, almacenamiento local del
origen, contenido de caché y cualquier futuro servicio remoto o API. El
dispositivo y la cuenta de navegador quedan fuera del control de la aplicación.

## Reglas de entrada implementadas

| Campo | Regla | Normalización |
| --- | --- | --- |
| `location` / ubicación | Texto obligatorio, 1–80 caracteres Unicode | `trim()`; rechaza caracteres de control |
| `summary` / `notes` | Texto obligatorio, 1–500 caracteres Unicode | `trim()`; rechaza caracteres de control |
| `inspector` | Texto opcional, máximo 80 caracteres Unicode | `trim()`; vacío se convierte en `Sin asignar`; rechaza caracteres de control |
| `status` / `result` | Solo `ok` o `attention` | Sin coerción |
| `date` | Debe ser texto; lo genera la aplicación | No se valida todavía el formato calendárico |
| `findings` | Entero no negativo; lo genera la aplicación | No se comprueba todavía coherencia con el estado |
| Propiedades adicionales | Rechazadas en captura y payload | No se conservan |

Los textos aceptan acentos y puntuación, incluidos caracteres similares a
marcado HTML. La defensa de representación depende de que React los represente
como texto y de no introducir sinks HTML sin escape.

La validación de captura se utiliza en la UI; la validación de payload se exige
en `InspectionStore.save`, al encolar y antes de enviar. Si un registro antiguo
de IndexedDB es inválido, no se envía y permanece en la cola para diagnóstico
o gestión posterior; no se elimina automáticamente.

## Amenazas, controles, pruebas y riesgo residual

| Amenaza / impacto | Controles implementados | Prueba prevista o reproducible | Estado y riesgo residual |
| --- | --- | --- | --- |
| Entradas vacías, tipos inesperados, valores fuera de límite o campos extra pueden crear registros inconsistentes, agotar recursos o contaminar la cola. | Esquema estricto de campos y estado; longitudes acotadas; rechazo de controles; trim; validación en formulario, almacén, cola y envío. | `npm run test:unit`: casos sintéticos válidos, vacíos, Unicode en el límite, excedidos, control, estado inválido, tipo y propiedad extra. `npm run test:integration`: captura inválida rechazada antes de persistir. Ambos comandos pasaron en esta rama durante la implementación. | **Implementado y probado.** Fecha solo se comprueba como texto y hallazgos como entero no negativo; falta validar formato de fecha y coherencia de negocio. Los registros antiguos inválidos no se envían, pero siguen almacenados. |
| Ejecución de contenido no confiable al mostrar texto suministrado por una captura. | Renderizado de valores mediante interpolación JSX, sin `dangerouslySetInnerHTML`; límites de entrada y rechazo de controles. | `npm run test:e2e`: caso de marcado sintético representado como texto. La prueba E2E integrada incluye marcado en el resumen y comprueba que se muestra como texto sin crear elementos ni ejecutar código. | **Mitigación parcial.** La CSP está aplicada desde `security-headers.mjs`; permite scripts inline para hidratación, por lo que la defensa ante marcado sigue dependiendo del renderizado como texto. Cambios futuros que usen HTML crudo, URL o atributo dinámico requieren revisión específica. |
| Exposición de datos al compartir el dispositivo, inspeccionar el perfil del navegador o ejecutar código same-origin. | Datos del proyecto son sintéticos; no se incluyen fotografías reales; caché se destina al shell y la cola se valida al sincronizar. | `npm run test:integration`: verifica persistencia offline tras reabrir IndexedDB y sincronización; `npm run test:e2e`: flujo offline y reconexión. Ambos pasaron en esta rama durante la implementación. | **Riesgo residual alto si se introdujeran datos reales.** IndexedDB no está cifrada ni protegida por autenticación; XSS same-origin o acceso local al perfil podría leerla. No hay retención, borrado seguro ni política de usuario para la cola. |
| Caché accidental de contenido que debiera ser privado al ampliar la aplicación. | El service worker no intercepta métodos distintos de GET ni solicitudes cross-origin; el precache inicial es pequeño. | `npm test` incluye `service-worker.spec.ts`; prueba estructura y políticas críticas, no demuestra confidencialidad de todas las respuestas en un navegador real. Pasó en esta rama durante la implementación. | **Pendiente.** El handler cubre cualquier GET same-origin que no sea navegación; antes de crear endpoints deben excluirse explícitamente API y respuestas privadas o definirse una política de no-cache. |
| Revelación de contenido de captura, excepciones internas o secretos mediante mensajes y diagnósticos. | `safe-error.ts` conserva únicamente IDs saneados y valores numéricos; la UI muestra mensajes genéricos y referencias, no el objeto Error ni el payload. No se registran errores de guardado/sincronización en consola. | `npm test` ejecuta `tests/security.spec.ts` para verificar el contexto seguro; E2E provoca un error sintético de IndexedDB y comprueba que el detalle interno no aparece. Ambos pasaron en esta rama. | **Implementado para errores de captura.** No hay sesión ni credenciales en el flujo actual. La biblioteca no reemplaza un escáner de secretos ni auditoría centralizada; el ID mostrado es una referencia local, no un sistema de incidentes. |
| Abuso de permisos del dispositivo o recolección no consentida. | Cámara y notificaciones solo se solicitan bajo acción; la cámara se libera y el fallback es sintético. La UI usa ubicación simulada. | `npm test` incluye `capabilities.spec.ts`; E2E prueba denegación de cámara y fallback. Pasaron en esta rama durante la implementación. | **Implementado con límites.** Existe `Permissions-Policy` aplicada: cámara/geolocalización same-origin; micrófono, pago y USB desactivados. La función reutilizable de geolocalización puede solicitar posición real si se conecta en otro flujo; revisar consentimiento, precisión y no persistencia antes de hacerlo. |
| Suplantación, modificación o acceso no autorizado a registros remotos. | No hay backend ni sincronización remota real en este alcance; la cola usa IDs estables para evitar duplicados. | No aplicable a la sincronización sintética actual. | **No implementado / fuera de alcance.** Una futura API necesita autenticación, autorización por registro, validación en servidor, TLS, protección contra replays y política de conflictos. |

## Manejo de fallos y decisiones

- Los fallos de apertura de IndexedDB, guardado y sincronización se presentan
  con texto genérico y una referencia construida por `createSafeErrorContext`.
  No se copia `error.message`, no se imprimen valores del formulario y no se
  convierte un fallo de persistencia en un mensaje de éxito.
- Si la sincronización falla o rechaza un registro inválido, la interfaz indica
  que sigue pendiente. La cola conserva el registro; la recuperación, edición o
  eliminación manual de una entrada heredada aún no está resuelta.
- Se mantiene la persistencia offline porque forma parte del flujo actual.
  Es una decisión de disponibilidad y no equivale a protección de
  confidencialidad: solo se deben usar datos sintéticos hasta definir cifrado,
  retención, autenticación y borrado para datos reales.
- Los controles de entrada no pretenden ser un filtro de HTML. Se conservan
  puntuación y acentos; la defensa contra ejecución depende del renderizado de
  texto y de no insertar contenido con APIs HTML.

## Controles de CSP, cabeceras y permisos (Semana 9, issue #39)

Responsable: `oma4r6464`. Enlaza con las amenazas de #38 (filas de ejecución de
contenido no confiable y de abuso de permisos de la tabla anterior) y entrega
a #40 los escenarios de la última subsección.

### Dónde está y cómo se aplica

- `src/lib/security/security-headers.mjs`: única fuente de la CSP, la
  `Permissions-Policy` y el resto de cabeceras. Es `.mjs` porque
  `next.config.mjs` no puede importar TypeScript.
- `next.config.mjs`: aplica las cabeceras a `/:path*` (páginas, `sw.js`,
  manifest, icono y estáticos de `/_next`) y desactiva `X-Powered-By`.
- Producción (`npm run build && npm start`) usa la política estricta;
  desarrollo (`npm run dev`) añade solo lo que exige el servidor de Next.js.

### Política aplicada (producción)

| Directiva | Valor | Motivo |
| --- | --- | --- |
| `default-src` | `'self'` | Todo lo no listado solo puede venir del propio origen. |
| `script-src` | `'self' 'unsafe-inline'` | Excepción: ver abajo. |
| `style-src` | `'self'` | La app solo usa hojas de estilo propias, sin estilos inline. |
| `img-src` | `'self' data:` | Icono y recursos propios. |
| `font-src`, `connect-src`, `worker-src`, `manifest-src` | `'self'` | Service worker, manifest y sincronización sintética son del mismo origen; no hay APIs ni CDN externos. |
| `frame-src`, `object-src`, `frame-ancestors` | `'none'` | No se usan marcos ni plugins y nadie puede incrustar la app. |
| `base-uri`, `form-action` | `'self'` | Evita cambiar la base de URLs o enviar formularios a otros orígenes. |

Otras cabeceras: `Permissions-Policy: camera=(self), geolocation=(self),
microphone=(), payment=(), usb=()`, `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` y
`Strict-Transport-Security: max-age=31536000` (solo fuera de desarrollo).

### Excepciones justificadas

- **`script-src 'unsafe-inline'` (producción):** las páginas estáticas de
  Next.js 14 incluyen scripts inline de arranque (`self.__next_f.push(...)`) y
  no tienen nonce; sin la excepción la aplicación no se hidrata. Usar nonce
  exigiría adaptar el renderizado a respuestas dinámicas y revisar su
  interacción con el shell offline; se conserva la estrategia estática. Riesgo residual: la CSP no
  bloquea un script inline inyectado; se compensa con el renderizado como texto
  y la validación de entradas de #38.
- **`'unsafe-eval'` y `style-src 'unsafe-inline'` (solo desarrollo):** los exige
  React Refresh y el servidor de desarrollo. No se envían en producción.
- No se añade `upgrade-insecure-requests` para no romper las pruebas locales
  sobre HTTP; la obligación de HTTPS se documenta abajo.

### Permisos y fallback

- **Cámara:** se pide solo al pulsar "Comprobar camara", sin audio; si se
  deniega, no existe o falla, se usa evidencia sintética y el flujo continúa.
- **Geolocalización:** la interfaz usa un proveedor sintético y no pide la
  posición real; sin soporte o con permiso denegado se usa la ubicación
  sintética.
- **Notificaciones:** se piden solo al pulsar "Probar notificacion"; si se
  deniegan o no hay soporte, se muestra un aviso local. No hay cabecera para
  controlarlas.
- Ningún permiso se solicita al cargar la página.

### HTTPS y entorno local

- **Despliegue:** HTTPS es requisito. El service worker, la cámara, la
  geolocalización y las notificaciones solo funcionan en contextos seguros, y
  HSTS solo tiene efecto sobre HTTPS. El servidor o proxy de despliegue debe
  terminar TLS y redirigir HTTP a HTTPS.
- **Local:** `http://localhost` y `http://127.0.0.1` se tratan como contexto
  seguro. `npm run dev` usa la CSP de desarrollo, no registra el service worker
  y no envía HSTS. `npm run build && npm start` usa la política de producción y
  es el entorno de las pruebas E2E y de la comprobación de cabeceras.

### Cómo comprobarlo

```powershell
npm run build
npm start
# en otra terminal:
npm run check:headers
```

`check:headers` consulta `/`, `/inspecciones`, `/inspecciones/inspection-001`,
`/manifest.webmanifest`, `/sw.js` y `/icon.svg` y compara cada cabecera con el
valor esperado. Manualmente: `curl -I http://127.0.0.1:3000/` o la pestaña Red
de DevTools. `npm test` valida la política (`tests/security-headers.spec.mjs`)
y `npm run test:e2e` (`tests/e2e/security-headers.spec.ts`) comprueba las
cabeceras en respuestas reales y que la navegación, el service worker y las
opciones no generan violaciones de la CSP.

### Escenarios para #40

1. Las seis rutas anteriores devuelven CSP, Permissions-Policy, nosniff,
   X-Frame-Options y Referrer-Policy, y no `X-Powered-By`.
2. Cargar `/`, `/inspecciones` y un detalle sin violaciones de CSP en consola,
   con el service worker registrado.
3. Desde la consola de la página, `fetch("https://example.com")` queda
   bloqueado por `connect-src`.
4. Incrustar la app en un `iframe` de otro origen queda bloqueado.
5. Cámara denegada o inexistente, ubicación sin soporte o denegada y
   notificación denegada: el flujo de captura continúa con datos sintéticos.
6. Texto sintético que parezca marcado HTML se muestra como texto; la CSP no
   cubre este caso por la excepción de `'unsafe-inline'`.

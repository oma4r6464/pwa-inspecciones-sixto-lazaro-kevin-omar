# Evidencia individual — equipo pwa-inspecciones-sixto-lazaro-kevin-omar

Repositorio privado del equipo:
https://github.com/oma4r6464/pwa-inspecciones-sixto-lazaro-kevin-omar

SHA final del equipo: se fija en Classroom con el último commit entregado en `main`.

---

### Jesús Emanuel Vega Medina (jesus-vegmed) — Semana 8 E2E

- Contribución concreta: agregué [tests/e2e/inspection-flow.spec.ts](../tests/e2e/inspection-flow.spec.ts),
  [playwright.config.ts](../playwright.config.ts), el workflow
  [.github/workflows/academic-evaluation.yml](../.github/workflows/academic-evaluation.yml)
  y documenté el alcance en [docs/test-strategy.md](../docs/test-strategy.md).
- Decisión y motivo: usar Playwright con Chromium y `context.setOffline()` para
  probar el flujo real de crear, persistir, recargar y sincronizar; los permisos
  de cámara se mockean para mantener la prueba sintética y reproducible.
- Comando ejecutado: `npm ci`, `npx playwright install chromium` y `npm run test:e2e`.
  Resultado y reporte: se registran después de ejecutar la suite en
  `reports/e2e/html`; los reportes de defectos controlados quedan en
  `reports/week-08/e2e-defect-failure.txt` y
  `reports/week-08/e2e-defect-recovery.txt`.
- Qué demuestra: interacción en navegador, persistencia IndexedDB, reconexión,
  sincronización única y captura completada con fallback de cámara. Qué no demuestra:
  un backend real, hardware físico, coordenadas reales ni varias pestañas.
- Defecto controlado: en la rama temporal `tmp/week-08-duplicate-regression`
  (SHA `59857202c296992040c758643208137e77e6e141`) se quitó la deduplicación de
  la cola. `npm run test:unit` falló con `2 !== 1` en la prueba de idempotencia.
  Se restauró la solución sobre `31380fb72e36c45df5e6c6ff115ca6f79e106a78` y
  el mismo comando pasó. Las salidas están en
  `reports/week-08/e2e-defect-failure.txt` y
  `reports/week-08/e2e-defect-recovery.txt`; el defecto no se integra.
- Limitación: el transporte remoto de la aplicación es sintético y no valida
  disponibilidad de un servicio externo.
- Uso de IA: utilicé GitHub Copilot para estructurar los escenarios Playwright,
  el workflow y la documentación. Validé personalmente selectores, aislamiento,
  permisos mockeados, la corrida real y la evidencia de fallo/recuperación.

- Nombre: Kevin Omar Sixto Lázaro
- Mi contribución concreta (con enlace a archivo, commit o revisión):
  Configuré el proyecto localmente (`npm ci`, `npm run dev`), creé el
  repositorio privado del equipo en GitHub y subí el commit inicial del
  starter sin incluir `node_modules`, `.next` ni archivos de entorno.
  Completé `docs/requirements.md`
  (https://github.com/oma4r6464/pwa-inspecciones-sixto-lazaro-kevin-omar/blob/main/docs/requirements.md)
  y `docs/decision-record.md`
  (https://github.com/oma4r6464/pwa-inspecciones-sixto-lazaro-kevin-omar/blob/main/docs/decision-record.md).
  Commit de referencia: https://github.com/oma4r6464/pwa-inspecciones-sixto-lazaro-kevin-omar/commit/f5cfff5503b2250474400242bcb66165edfb446c.

- Decisión que puedo explicar:
  Elegí PWA sobre web tradicional, app nativa y multiplataforma porque
  no requiere publicación en tiendas, permite iteración rápida con un
  equipo pequeño, y sienta la base (service worker, manifest) para
  resolver en fases futuras el problema central del proyecto: la
  conectividad intermitente dentro de los laboratorios. Puedo explicar
  los trade-offs frente a app nativa (mayor costo de mantenimiento, dos
  bases de código) y frente a web tradicional (sin ninguna tolerancia a
  pérdida de conexión).

- Comando o prueba que ejecuté y resultado real:
  `npm run verify` — resultado: "Starter verificable: PASS", generó
  `reports/verification.json`. También ejecuté
  `bash public-tests/check.sh`, que dio "PUBLIC_OK" (con un warning no
  fatal de `rg: command not found`, que no afectó el resultado final).

- Qué comprueba esta prueba y qué no:
  `npm run verify` comprueba que los archivos requeridos existan, que
  la prueba proporcionada del starter pase y que el proyecto compile.
  No comprueba la calidad del análisis en `requirements.md` ni
  `decision-record.md` — eso se revisa por lectura, como aclara el
  profesor. Tampoco verifica que los requisitos funcionales marcados
  como "producto futuro" (RF-02, RF-03, RF-05) estén implementados,
  porque efectivamente no lo están todavía — solo RF-01 y RF-04 son
  funcionalidad real del starter actual. Un resultado PASS no certifica
  ausencia de secretos ni sustituye una calificación.

- Limitación que encontré:
  El `.gitignore` inicial excluye `reports/verification.json`. Al
  principio pensé que era un descuido, pero la aclaración del profesor
  confirma que es intencional ("el reporte no se sube a Git
  deliberadamente"), así que se entrega por separado en Classroom en
  vez de subirse al repositorio.

  Usé Claude (Anthropic) como asistente para: (1) guiar los comandos de
  git para inicializar y subir el repositorio, (2) redactar un borrador
  inicial de `docs/requirements.md` y `docs/decision-record.md`
  adaptado a las plantillas propias del starter. Validé manualmente
  cada sección contrastándola con el enunciado de la actividad y el
  contenido real del proyecto (datos de demo, estructura de carpetas),
  y ajusté el contenido antes de la entrega final. No usé IA para el
  quiz presencial.

---

### Jesús Emanuel Vega Medina (jesus-vegmed) — Semana 3

- Decisiones técnicas: navegación con estrategia network-first y fallback a `/`; assets same-origin con cache-first y revalidación; actualización controlada mediante `SKIP_WAITING`; registro del Service Worker únicamente en producción. Todo el contenido usado por la app es sintético.
- Límites y fallos encontrados: no hay backend, sincronización en segundo plano ni persistencia real. `npm ci` reporta vulnerabilidades heredadas y no se ejecutó `npm audit fix --force` para evitar cambios incompatibles. En este Windows no está disponible `bash`, por lo que `public-tests/check.sh` debe ejecutarse desde Bash/WSL; su equivalente local es `npm run verify`.
- Pruebas ejecutadas: `npm ci` terminó correctamente; `npm test` terminó con `starter.spec.mjs`, `manifest.spec.ts`, `service-worker.spec.ts` y `offline.spec.ts` en PASS; `npm run verify` terminó con `Starter verificable: PASS`; `npm run build` queda como validación de compilación de producción.
- Uso de IA: utilicé GitHub Copilot para revisar la implementación, ajustar el ciclo de vida y caché del Service Worker, ampliar las pruebas y redactar esta evidencia. Validé manualmente los cambios, ejecuté la suite local y revisé que no hubiera secretos ni datos reales.
- Commit SHA final del merge en `main`: `86435b83a493e2760afe788ae87e4aaebe585e58`.

### Jesús Emanuel Vega Medina (jesus-vegmed) — Pruebas de sincronización offline

- Contribución concreta: agregué `tests/sync.spec.ts`, el runner
  `scripts/run-sync-spec.mjs`, y la implementación aislada de cola,
  esquema y política en `src/lib/sync/`. La documentación asociada está en
  `docs/sync-policy.md`.
- Decisión técnica: usar una cola inyectable con almacenamiento en memoria
  para que las pruebas sean deterministas y sustituible por IndexedDB, usar
  el `id` como clave de idempotencia y aplicar last-write-wins por `updatedAt`,
  conservando local en empates.
- Prueba ejecutada y resultado real: `npm ci`, `npm run test -- --run`,
  `npm run verify` y `npm run build`; todos terminaron correctamente. La suite
  cubre guardado offline, recuperación de conectividad, reintentos,
  duplicados, conflictos y fallas persistentes reanudables.
- Limitación: la cola entregada no conecta todavía un backend ni IndexedDB;
  el transporte y el almacenamiento real deben integrarse en una etapa
  posterior. Las pruebas usan exclusivamente datos sintéticos y no red real.
- Uso de IA: utilicé GitHub Copilot como apoyo para estructurar la suite,
  revisar casos de regresión y redactar la documentación. Validé manualmente
  el comportamiento, el build y los resultados locales; no se usaron secretos
  ni datos reales.

---

- Nombre: Armando Valerio Salmeron
- Mi contribución concreta (con enlace a archivo, commit o revisión):
  Revisé la documentación y amplié los requisitos en `docs/requirements.md`. Agregué el Escenario C (Auditoría administrativa) para cubrir el uso desde escritorio por un coordinador, e incorporé el requisito RF-06 (Edición de inspección) contemplando la posibilidad de corregir errores de captura durante las primeras 24 horas.
  Commit de referencia: https://github.com/oma4r6464/pwa-inspecciones-sixto-lazaro-kevin-omar/commit/66c7f57b5b3183180817122d6aec10fe958c4917.
- Decisión que puedo explicar:
  Estoy de acuerdo con la elección de PWA porque permite que el desarrollo sea más rápido con Next.js (una sola base de código en lugar de dos apps nativas) y nos dará la base para agregar el soporte sin conexión más adelante usando un Service Worker.
- Comando o prueba que ejecuté y resultado real:
  Ejecuté `npm run verify` y el resultado fue PASS.
- Qué comprueba esta prueba y qué no:
  Comprueba que los archivos de configuración existen y el proyecto compila. Sin embargo, no verifica la calidad de nuestro análisis de requisitos en la documentación, ya que eso requiere una revisión manual por parte del profesor.
- Limitación que encontré:
  Actualmente la app solo muestra datos sintéticos ya escritos y no almacena nada; implementar el guardado es algo que queda para etapas futuras.
- Uso de IA (herramienta, propósito, fragmentos influenciados y validación humana):
  Usé Antigravity (IA) como apoyo para idear el Escenario C y el requisito de edición, validándolos para asegurarme de que coincidieran con el alcance y los objetivos de la Semana 1.

---

- Nombre: Samuel Jonathan Trujillo Bolaños
- Mi contribución concreta (con enlace a archivo, commit o revisión):
  Revisé la consistencia documental de la entrega, ajusté los criterios
  de aceptación de Semana 1 para que coincidieran con el flujo real de
  verificación, y agregué mi evidencia individual sin modificar la
  configuración de GitHub Actions. También confirmé que la rama de
  trabajo `dev` partiera de los avances más recientes del equipo.
  Commit de referencia: https://github.com/oma4r6464/pwa-inspecciones-sixto-lazaro-kevin-omar/commit/76b00c3b2d73a7ff73ef5409ba52f768bf483f0b.

- Decisión que puedo explicar:
  Puedo explicar por qué la estrategia PWA es adecuada para este caso:
  permite trabajar con una sola base de código web, distribuir cambios
  sin tiendas de aplicaciones y preparar el soporte futuro para
  conectividad intermitente. La limitación principal es que en Semana 1
  todavía no existe operación offline real ni sincronización local.

- Comando o prueba que ejecuté y resultado real:
  Ejecuté `npm run verify`, `npm test` y `npm run build`; los comandos
  terminaron correctamente en el entorno local. La validación completa
  también debe confirmarse con la corrida de GitHub Actions del commit
  final que se entregue.

- Qué comprueba esta prueba y qué no:
  Comprueba que la estructura requerida exista, que la prueba del
  starter pase y que la aplicación compile. No califica por sí sola la
  calidad del análisis en `docs/requirements.md` ni en
  `docs/decision-record.md`, y tampoco demuestra que las funciones
  futuras como guardado, edición real, autenticación u operación offline
  ya estén implementadas.

- Limitación que encontré:
  La entrega actual corresponde al alcance documental y de arranque de
  Semana 1. Las funciones marcadas como producto futuro quedan
  documentadas, pero no implementadas todavía.

- Uso de IA (herramienta, propósito, fragmentos influenciados y validación humana):
  Usé una herramienta de apoyo asistido para revisar redacción,
  consistencia documental y resultados de verificación. Validé el
  contenido contrastándolo con la consigna, los archivos del proyecto y
  los comandos ejecutados antes de dejarlo como evidencia.

---

- Nombre: Samuel Jonathan Trujillo Bolaños (Revisión final y evidencia - Semana 2)
- Mi contribución concreta (con enlace a archivo, commit o revisión):
  Revisé el entregable de Semana 2 sobre `main` y reforcé los puntos
  que podían afectar una revisión privada: agregué `id`, `scope`,
  `lang`, `orientation`, categorías y propósito maskable al
  `public/manifest.webmanifest`; alineé `src/app/layout.tsx` con los
  metadatos del shell instalable; dejé visible en `src/app/page.tsx`
  que la captura es únicamente de datos sintéticos; amplié
  `tests/manifest.spec.ts` para validar esos campos críticos; y
  documenté en `README.md` el flujo `npm ci`, `npm run verify`,
  `npm test`, `npm run build` y el equivalente exacto de `make verify`.
  Commit de referencia:
  https://github.com/oma4r6464/pwa-inspecciones-sixto-lazaro-kevin-omar/commit/93ade3480e7e5847e915567408790e958ec6d3f1.

- Decisión que puedo explicar:
  Se mantuvo el incremento dentro del alcance del shell instalable sin
  modificar GitHub Actions ni los checks públicos. El manifest se
  fortaleció con campos que ayudan a que la PWA sea reconocible como
  instalable, y las pruebas se ampliaron para detectar regresiones en
  manifest, layout, estados de interfaz y restricción de datos
  sintéticos.

- Comando o prueba que ejecuté y resultado real:
  Ejecuté `npm run verify`, `npm test` y `npm run build` en `main`.
  `npm run verify` terminó con "Starter verificable: PASS";
  `npm test` terminó con "starter.spec.mjs: PASS" y
  "manifest.spec.ts: PASS"; `npm run build` compiló correctamente la
  ruta `/`. `make verify` no está disponible en este Windows porque el
  comando `make` no está instalado, por eso se documentó y ejecutó el
  equivalente exacto definido por el Makefile: `npm run verify`.

- Qué comprueba esta prueba y qué no:
  Comprueba que los artefactos obligatorios existan, que el manifest
  tenga campos esenciales de instalación, que el layout publique el
  manifest y que la página use el App Shell con estados de carga, error
  y vacío. No comprueba instalación física en un teléfono, operación
  offline real, service worker, persistencia ni sincronización.

- Limitación que encontré:
  La app todavía conserva inspecciones nuevas solo en memoria durante la
  sesión de demostración. También queda pendiente revisar
  vulnerabilidades reportadas por `npm ci` con una actualización
  controlada de dependencias, evitando `npm audit fix --force` porque
  puede introducir cambios incompatibles.

- Uso de IA (herramienta, propósito, fragmentos influenciados y validación humana):
  Usé un asistente de desarrollo con IA para apoyar la auditoría del
  entregable, ordenar criterios de prueba y revisar consistencia entre
  consigna, código y documentación. Validé manualmente los cambios en
  los archivos del repositorio y ejecuté las pruebas indicadas antes de
  dejar esta evidencia.

---

- Nombre: Armando Valerio Salmeron (Encargado de Configuración PWA - Semana 2)
- Mi contribución concreta (con enlace a archivo, commit o revisión):
  Creé el archivo `public/manifest.webmanifest` incluyendo nombre, colores de tema/fondo, display y el icono SVG.
  También modifiqué `src/app/layout.tsx` para inyectar los metadatos necesarios (links al manifest, meta tags de `theme-color`, iconos para Apple). Actualicé el `README.md` indicando cómo verificar la PWA.
- Decisión que puedo explicar:
  Se optó por usar un único archivo `icon.svg` referenciado con distintos tamaños en el `manifest.webmanifest` para simplificar la gestión de assets y asegurar que el icono se vea nítido en cualquier resolución. El color de tema se definió en `#005a9c` acorde con un estilo sobrio para aplicaciones de laboratorio.
- Comando o prueba que ejecuté y resultado real:
  Se ejecutó `npm run dev` y se comprobó manualmente desde Chrome DevTools (pestaña "Application > Manifest") que los metadatos cargaran correctamente. También se validó que `npm run build` terminara sin errores de metadatos.
- Qué comprueba esta prueba y qué no:
  Comprueba que la aplicación levante y el navegador reconozca el manifest de forma correcta. No comprueba mediante tests automatizados (ej. Playwright) que el manifest tenga las keys correctas, eso se implementará en el test E2E posteriormente.
- Limitación que encontré:
  Al usar SVGs, navegadores antiguos en iOS podrían tener problemas si se agrega a la pantalla de inicio; en producción final convendría exportar PNGs en distintos tamaños.
- Uso de IA (herramienta, propósito, fragmentos influenciados y validación humana):
  Usé Antigravity (IA) para redactar el JSON base del manifest y actualizar el layout con las nuevas convenciones de metadatos de Next.js 14. Validé los metadatos generados abriendo la vista de Application en Chrome.


---

- Nombre: Kevin Omar Sixto Lázaro (Encargado de App Shell y estados - Semana 2)
- Mi contribución concreta (con enlace a archivo, commit o revisión):
  Creé `src/components/app-shell.tsx`: shell instalable con header/navegación (logo, enlaces "Inicio"/"Inspecciones", menú móvil) y componentes reutilizables de estado (`LoadingState`, `ErrorState`, `EmptyState`). Modifiqué `src/app/page.tsx` para usar el `AppShell` y agregar un formulario de "Agregar inspección" (ubicación, responsable, estado, resumen) que dispara estados de carga, éxito y error (con reintento), sin alterar los registros sintéticos de `src/lib/data/inspections.ts`. Agregué control para vaciar lista (estado vacío) y restaurar datos sintéticos. Implementé `tests/manifest.spec.ts` para pruebas automatizadas de manifest, layout y estados. Actualicé `src/app/globals.css` con estilos y animaciones.
- Decisión que puedo explicar:
  Se separó el App Shell en un componente cliente interactivo manteniendo el `RootLayout` en el servidor. Como todavía no existe backend, se gestiona la interacción en memoria (`useState`) alternando éxito y error para posibilitar una comprobación determinista de fallos y reintentos. Se implementó una suite de validación automatizada en `tests/manifest.spec.ts` para garantizar la integridad de metadatos y componentes.
- Comando o prueba que ejecuté y resultado real:
  `npm run verify` (PASS), `npm test` (starter.spec.mjs: PASS y tests/manifest.spec.ts: PASS) y `npm run build` (build Next.js exitoso).
- Qué comprueba esta prueba y qué no:
  Comprueba que los artefactos obligatorios existan, que el manifest tenga formato y propiedades correctas (icons, theme_color, standalone), que layout integre el manifest, y que el App Shell y los estados estén exportados e integrados. No simula la instalación en un dispositivo físico con Service Worker (alcance de semanas posteriores).
- Limitación que encontré:
  La persistencia de inspecciones creadas es temporal en memoria durante la sesión; los datos se reinician con los datos sintéticos al recargar la página.
- Uso de IA (herramienta, propósito, fragmentos influenciados y validación humana):
  Usé Antigravity / Claude como apoyo para estructurar el componente AppShell, diseñar la lógica de alternancia de estados en el formulario y la suite de validación `tests/manifest.spec.ts`. Validé manualmente ejecutando `npm run verify`, `npm test`, `npm run build` y comprobando la interfaz y manifest en DevTools.

---

### Kevin Omar Sixto Lázaro — Semana 04

- Commit SHA de la implementación:
  `6b93c16ba453fe104c022baa4d4a4591badcfbc0`.

- Mi contribución concreta:
  Implementé la ruta SSR `src/app/inspecciones/[id]/page.tsx` para el
  detalle de inspección. La ruta lee los datos sintéticos desde
  `src/lib/data/inspections.ts`, genera metadatos con
  `generateMetadata`, muestra ubicación, responsable, fecha, estado,
  hallazgos y resumen, y usa `notFound()` cuando el identificador no
  existe.

- Decisión técnica:
  Elegí SSR para el detalle porque la información es estable y puede
  entregarse desde servidor sin depender de interacción del cliente. Así
  se evita hydration mismatch y se deja el detalle disponible como HTML
  renderizado bajo demanda.

- Prueba ejecutada:
  `npm test`, incluyendo `tests/rendering.spec.ts`, valida que la ruta
  de detalle exista, no declare `"use client"`, use `notFound()` y no
  haga `fetch()` a servicios externos. También se validó con
  `npm run build`, donde `/inspecciones/[id]` aparece como ruta dinámica
  server-rendered.

- Limitación:
  El detalle todavía depende de datos sintéticos locales; no hay backend,
  persistencia real ni medición en dispositivo físico.

- Uso declarado de IA:
  Usé apoyo de IA para revisar estructura de la ruta SSR, metadatos y
  criterios de prueba. Validé manualmente el resultado con los comandos
  de verificación y revisando que no hubiera datos reales ni secretos.

---

### Jesús Emanuel Vega Medina — Semana 04

- Commit SHA de la implementación:
  `79c1712c417378623a6bda51e9a71e9423e2680e`.

- Mi contribución concreta:
  Agregué controles de seguridad de Semana 4: `docs/security-controls.md`,
  `src/lib/security/safe-error.ts`, `tests/security.spec.ts`, reportes
  reproducibles en `reports/week-04/` y evidencia técnica en
  `evidence/week-04/engineering.json`.

- Decisión técnica:
  No persistir inspecciones sintéticas y sanitizar el contexto de error
  a cinco campos técnicos (`incidentId`, `correlationId`, `status`,
  `attempt`, `durationMs`). Esta decisión evita filtrar datos sensibles
  y mantiene la demo dentro del alcance de datos sintéticos.

- Prueba ejecutada:
  `npm test`, incluyendo `tests/security.spec.ts`, valida que valores
  sensibles sintéticos y propiedades desconocidas no sobrevivan al
  contexto técnico. También se ejecutaron `npm run verify` y
  `npm run build`.

- Limitación:
  No hay backend, sesión real, persistencia segura ni fotografías; todo
  el contenido es ficticio y la demo en memoria se pierde al recargar.

- Uso declarado de IA:
  Usé GitHub Copilot para revisar el alcance de Semana 04, proponer el
  sanitizador, redactar documentación y pruebas. Validé manualmente el
  resultado con `npm ci`, `npm test`, `npm run verify` y `npm run build`;
  no se usaron secretos ni datos reales.

//////////////////////////////////////////////////////////
### Kevin Omar Sixto Lázaro — Semana 3
- Commit:  40b271ae91ae5755928b5cef20d8bcc7cdaaf792
- Decisión técnica: network-first para peticiones de navegación (siempre la versión más fresca si hay red, con fallback a caché y luego a "/") y cache-first con revalidación en segundo plano para assets estáticos same-origin; el service worker nuevo no se activa automáticamente — se queda en "waiting" y solo se activa cuando el usuario confirma, vía mensaje SKIP_WAITING, para no perder estado de una pestaña abierta.
- Prueba ejecutada: verificación manual en Chrome DevTools — Application → Service Workers muestra sw.js "activated and is running"; con la casilla "Offline" marcada la app sigue renderizando completamente (header, tarjetas de inspecciones) en vez de mostrar el error de "sin conexión" del navegador.
- Limitación: aún no hay pruebas automatizadas (tests/service-worker.spec.ts y tests/offline.spec.ts) — quedaron repartidas al equipo; tampoco hay push notifications ni background sync.
- Uso de IA: usé Claude para diseñar la estrategia de caché, detectar y corregir un bug real (el registro nunca corría porque el evento "load" del navegador ya había disparado antes de que el useEffect de React se ejecutara), y para revisar el código antes de integrarlo.

---

### Samuel Jonathan Trujillo Bolaños — Semana 3
- Commit de referencia:
  25cef8ca0d0c7f17b3f70b06cf0a620e8ac05426.

- Mi contribución concreta:
  Revisé los últimos commits de `main` y los issues abiertos de Semana
  3. Completé `docs/cache-strategy.md` con la estrategia real del
  service worker, fallback offline, invalidación de caché, actualización
  segura y trade-offs. También actualicé `scripts/verify.mjs` para que
  `npm run verify` falle si falta algún artefacto obligatorio de Semana
  3, y reforcé `README.md` con el flujo de prueba del service worker,
  Cache Storage y modo offline.

- Decisión técnica que puedo explicar:
  Mantuve la estrategia ya implementada: navegación con network-first
  para priorizar frescura y fallback offline, assets same-origin con
  cache-first y revalidación en segundo plano para velocidad y
  disponibilidad, y actualización segura mediante confirmación del
  usuario antes de enviar `SKIP_WAITING`. No modifiqué GitHub Actions ni
  los checks públicos; conecté la verificación desde los scripts locales
  existentes.

- Comando o prueba que ejecuté y resultado real:
  Ejecuté `npm ci`, `npm run verify`, `npm test` y `npm run build`.
  `npm run verify` terminó con "Starter verificable: PASS";
  `npm test` terminó con `starter.spec.mjs: PASS`,
  `manifest.spec.ts: PASS`, `service-worker.spec.ts: PASS` y
  `offline.spec.ts: PASS`; `npm run build` compiló correctamente la
  ruta `/`. `make verify` no está disponible en este Windows porque el
  comando `make` no está instalado, así que ejecuté el equivalente
  exacto definido en el Makefile: `npm run verify`.

- Qué comprueba esta prueba y qué no:
  Comprueba existencia de artefactos obligatorios, presencia de
  listeners de service worker, versionado de caché, precache mínimo,
  fallback offline, flujo de `SKIP_WAITING` y recarga segura de una sola
  vez. No instala la PWA en un dispositivo físico ni prueba
  sincronización en segundo plano, push notifications o persistencia
  real de inspecciones.

- Limitación que encontré:
  `npm ci` reportó vulnerabilidades heredadas de dependencias. No
  ejecuté `npm audit fix --force` porque puede cambiar versiones con
  riesgo de incompatibilidad y no forma parte del alcance de esta
  entrega. También queda pendiente una página offline dedicada; por
  ahora el fallback seguro es `/`.

- Uso de IA (herramienta, propósito, fragmentos influenciados y validación humana):
  Usé un asistente de desarrollo con IA para apoyar la auditoría contra
  la consigna, organizar la documentación de caché y revisar que la
  evidencia fuera consistente con los comandos ejecutados. Validé
  manualmente el resultado revisando los archivos del repositorio,
  issues abiertos y salidas de verificación local.

---

### Armando Valerio Salmeron — Semana 4

- **Mi contribución concreta**:
  Implementé la ruta CSR `/inspecciones` y el componente interactivo `LoadingState`. Añadí controles para filtrar las inspecciones por nombre e inspector, y botones para recargar o simular fallos, probando la responsividad del UI. También creé `tests/inspecciones.spec.mjs` y lo integré a `tests/starter.spec.mjs` para validar la existencia de la ruta y de los estados críticos.
  Commit de referencia: `81c559d`

- **Decisión técnica que puedo explicar**:
  Elegí renderizado del lado del cliente (CSR usando `"use client"`) para la ruta de listado porque requería alta interactividad (filtrado rápido, simulación de error y recarga). Con CSR obtenemos transiciones muy ágiles al interactuar, devolviendo inmediatamente el `LoadingState` mientras simulamos la obtención de los datos.

- **Prueba ejecutada y resultado**:
  Ejecuté `npm test`, resultando en PASS tanto para los tests anteriores como para el nuevo `inspecciones.spec.mjs`. También ejecuté `npm run build` donde Next.js compiló de manera exitosa todas las rutas, demostrando que no existen errores de *hydration mismatch* entre el servidor y el cliente.

- **Limitación que encontré**:
  Como el requerimiento prohíbe datos reales, la vista actualmente utiliza datos sintéticos generados en memoria (`FAKE_INSPECTIONS`). Si se recarga la página, cualquier estado modificado o filtrado se pierde. La resiliencia offline de estos datos es un pendiente a mejorar.

- **Uso de IA**:
  Utilicé Antigravity (asistente de IA) para estructurar rápidamente el cascarón del componente de React, las clases de TailwindCSS y la prueba unitaria en Node. Revisé y validé el código generado asegurándome de que compilara sin problemas, interactuando manualmente en el navegador para verificar la barra de búsqueda y simulación de errores.

---

### Samuel Jonathan Trujillo Bolaños — Semana 4

- Commit SHA de integración:
  `09c71da28b18e85987f38ecf7d7da5cdccff6f07`.

- Mi contribución concreta:
  Integré los PR de Semana 4 sobre `main`, resolví conflictos en `tests/starter.spec.mjs` y `scripts/verify.mjs`, y completé el issue de documentación creando `docs/rendering-decision.md`. También actualicé `README.md` para explicar las rutas `/inspecciones` y `/inspecciones/[id]`, la comparación CSR/SSR, la verificación y la evidencia acumulada.

- Decisión técnica que puedo explicar:
  Se mantiene `/inspecciones` como CSR porque la vista necesita búsqueda, recarga y simulación de error en cliente. Se mantiene `/inspecciones/[id]` como SSR porque el detalle es estable, se puede resolver desde datos sintéticos locales y debe manejar IDs inexistentes con `notFound()`. La comparación queda documentada con una métrica repetible tomada de `npm run build`.

- Comando o prueba que ejecuté y resultado real:
  Ejecuté `npm run verify`, `npm test` y `npm run build` durante la integración. `npm test` terminó con PASS para pruebas acumuladas de manifest, service worker, offline, renderizado SSR y listado CSR. `npm run build` compiló `/`, `/inspecciones` y `/inspecciones/[id]`, mostrando `/inspecciones/[id]` como ruta dinámica server-rendered.

- Qué comprueba esta prueba y qué no:
  Comprueba que existen los artefactos obligatorios, que el detalle no usa `"use client"`, que maneja `notFound()`, que el listado usa `LoadingState` y que los tests acumulados siguen pasando. No mide Lighthouse en dispositivo real ni prueba un backend, porque la actividad usa datos sintéticos locales.

- Limitación que encontré:
  El listado CSR usa datos sintéticos en memoria y pierde estado al recargar. La métrica de carga usada es la salida reproducible de `next build`, no una medición de navegador en hardware físico.

- Uso de IA (herramienta, propósito, fragmentos influenciados y validación humana):
  Usé un asistente de desarrollo con IA para apoyar la resolución de conflictos, revisar la cobertura de entregables y redactar la documentación técnica. Validé manualmente los cambios revisando archivos, ejecutando pruebas y comprobando que no se modificaran GitHub Actions.

---

### Armando Valerio Salmeron — Semana 5

- **Mi contribución concreta (con enlace a archivo, commit o revisión)**:
  Implementé la base offline-first para guardar inspecciones localmente
  cuando la red no está disponible. Aporté el esquema local en
  `src/lib/storage/schema.ts` y la cola idempotente en
  `src/lib/sync/queue.ts`, usando el `id` como llave estable para evitar
  duplicados.

- **Decisión técnica que puedo explicar**:
  La cola final usa un contrato `QueueStorage` para poder conectar una
  persistencia real en otra etapa, pero las pruebas usan
  `MemoryQueueStorage` para que el comportamiento sea determinista en
  Node y GitHub Actions. La idempotencia se resuelve en la cola: una
  inspección repetida con el mismo `id` no crea otra entrada.

- **Comando o prueba que ejecuté y resultado real**:
  Ejecuté `npm run test -- --run`; el resultado fue PASS para las
  pruebas acumuladas, incluyendo `sync.spec.ts`. También se validó con
  `npm run verify`.

- **Qué comprueba esta prueba y qué no**:
  Comprueba guardado offline, sincronización al recuperar red simulada,
  reintentos, idempotencia y conflictos. No comprueba un backend real,
  IndexedDB en navegador ni concurrencia entre pestañas.

- **Limitación que encontré**:
  La persistencia real de navegador queda pendiente; por ahora se dejó
  el contrato de almacenamiento para integrarla sin cambiar la lógica
  principal de la cola.

- **Uso de IA (herramienta, propósito, fragmentos influenciados y validación humana)**:
  Utilicé Antigravity como apoyo para estructurar la cola y revisar
  casos de idempotencia. Validé manualmente con pruebas locales y datos
  exclusivamente sintéticos.

---

### Kevin Omar Sixto Lázaro — Semana 5

- Mi contribución concreta:
  Integré la política de conflictos y reintentos en
  `src/lib/sync/conflict-policy.ts`, conectando decisiones puras para
  `resolveConflict`, `operationKey`, clasificación de fallos y backoff
  determinista.

- Decisión técnica:
  Separar la política de conflictos de la cola para que pueda probarse
  sin red, reloj implícito ni almacenamiento real. La política compara
  `version`, `updatedAt` y contenido canónico para resolver empates de
  forma reproducible.

- Prueba ejecutada:
  `npm run test -- --run`, con PASS en `tests/sync.spec.ts`.

- Limitación:
  La política simula la versión remota; no existe todavía servidor real
  ni API de sincronización.

- Uso declarado de IA:
  Usé apoyo de IA para revisar casos borde de conflictos y reintentos.
  Validé el resultado leyendo la implementación y ejecutando la suite.

---

### Jesús Emanuel Vega Medina — Semana 5

- Mi contribución concreta:
  Reforcé `tests/sync.spec.ts` para cubrir guardado offline,
  recuperación de conectividad simulada, reintentos, duplicados,
  conflictos, respuestas repetidas y respuestas fuera de orden.

- Decisión técnica:
  Mantener pruebas deterministas sin servicios privados ni red real. El
  transporte se inyecta como función y el almacenamiento se sustituye por
  memoria durante la prueba.

- Prueba ejecutada:
  `npm run test -- --run`, con PASS en pruebas de manifest, service
  worker, offline, renderizado, sincronización y seguridad.

- Limitación:
  La prueba no valida latencia real, IndexedDB en navegador ni
  condiciones de carrera entre pestañas.

- Uso declarado de IA:
  Usé GitHub Copilot para proponer casos de prueba y revisar regresiones.
  Validé manualmente el resultado con la suite local y datos sintéticos.

---

### Samuel Jonathan Trujillo Bolaños — Semana 5

- Commit SHA de integración:
  `e8964a7`.

- Mi contribución concreta:
  Integré los PR de Semana 5 sobre `main`, resolví conflictos entre la
  cola offline, las pruebas y la política de conflictos, agregué
  `.github/workflows/week-05-w05-sync-data.yml`, actualicé `README.md`,
  `docs/sync-policy.md`, `scripts/verify.mjs` y esta evidencia.

- Decisión técnica que puedo explicar:
  Se conservó una cola con almacenamiento inyectable y pruebas en
  memoria para no depender de IndexedDB en Node. También se mantuvo una
  política pura de conflictos/reintentos para cubrir idempotencia,
  fallos temporales, conflictos y respuestas fuera de orden sin servicios
  externos.

- Comando o prueba ejecutada y resultado real:
  Ejecuté `npm run test -- --run`; terminó en PASS para las pruebas
  acumuladas de semanas 1 a 5. La verificación final de build, verify y
  GitHub Actions se realiza sobre el commit final de entrega.

- Qué comprueba esta prueba y qué no:
  Comprueba que los artefactos obligatorios existen y que la lógica de
  cola, conflicto, reintento e idempotencia se comporta de forma
  reproducible. No comprueba sincronización contra backend real ni
  persistencia en dispositivo físico.

- Limitación encontrada:
  La entrega queda lista para conectar un almacenamiento persistente real
  mediante `QueueStorage`, pero en esta semana se mantiene sin backend y
  sin datos reales.

- Uso de IA:
  Usé un asistente de desarrollo con IA para apoyar la resolución de
  conflictos, revisar cobertura contra la consigna y redactar evidencia.
  Validé manualmente con lectura de archivos y ejecución de pruebas.

---

### Armando Valerio Salmeron — Capacidades de Dispositivo (Cámara Opcional)

- **Mi contribución concreta (con enlace a archivo, commit o revisión)**:
  Implementé el módulo de capacidades `src/lib/device/camera.ts`, la suite de pruebas unitarias `tests/capabilities.spec.ts`, el runner `scripts/run-capabilities-spec.mjs`, y la documentación de diseño y privacidad en `docs/capabilities.md`. También integré la verificación en `scripts/verify.mjs`, `tests/starter.spec.mjs` y `README.md`.

- **Decisión técnica que puedo explicar**:
  Diseñé la detección de cámara como una mejora progresiva (`progressive enhancement`) con inyección de dependencias (`MockableNavigator`), lo que permite que el módulo se pruebe de forma 100% determinista en Node.js sin navegador real. Se categorizan los estados (`available`, `unsupported`, `permission_denied`, `recoverable_error`) y se garantiza que ante cualquier fallo o rechazo, la función `attachEvidenceWithFallback` devuelva un registro sintético sin bloquear la inspección. No se solicita acceso al importar y no se almacena ninguna foto real ni PII.

- **Comando o prueba que ejecuté y resultado real**:
  Ejecuté `npm run test -- --run` (resultando en PASS para todas las suites acumuladas y `capabilities.spec.ts: PASS`), `npm run verify` (`Starter verificable: PASS`) y `npm run build` (compilación exitosa).

- **Qué comprueba esta prueba y qué no**:
  Comprueba que la detección no falle sin `mediaDevices`, que la denegación de permisos no dispare errores no controlados, que los streams se liberen con `stopCameraStream`, y que la evidencia generada sea estrictamente sintética sin filtrar PII. No comprueba el sensor físico ni la calidad óptica de una cámara real de hardware.

- **Limitación que encontré**:
  El módulo no conecta con almacenamiento blob persistente en disco ni con WebRTC; el payload de evidencia permanece estructurado como descriptor sintético en memoria.

- **Uso de IA (herramienta, propósito, fragmentos influenciados y validación humana)**:
  Utilicé Antigravity para estructurar los tipos de TypeScript y proponer la clasificación de errores de la API `MediaDevices`. Validé manualmente el comportamiento ejecutando las pruebas locales y asegurándome de cumplir con todas las directrices de privacidad académica.
### Kevin Omar Sixto Lázaro — Semana 6

- Commit SHA de integración:
  `240f44aed39ce2ac8309ba5a24710c1b288fd606`.

- Mi contribución concreta:
  Implementé `src/lib/device/geolocation.ts` con `requestLocation()`,
  detección de soporte, manejo de permiso denegado, timeout y error
  recuperable, fallback sintético y redondeo de coordenadas. Agregué
  `tests/capabilities.spec.ts`, su runner en
  `scripts/run-capabilities-spec.mjs` y `docs/capabilities.md`.

- Decisión técnica:
  El proveedor de geolocalización es inyectable y el permiso solo se
  solicita desde una acción explícita. Se limita la precisión
  (redondeo a ~11 km) y se devuelve siempre una ubicación utilizable
  para que la captura de la inspección nunca se rompa.

- Prueba ejecutada:
  `npm run test -- --run`, con PASS en `tests/capabilities.spec.ts`.

- Limitación:
  No se probó con un dispositivo físico ni con permisos reales del
  navegador; todos los datos son sintéticos.

- Uso declarado de IA:
  Usé apoyo de IA para guiar la estructura del módulo, las pruebas y la
  documentación. Validé el resultado leyendo el código y ejecutando la
  suite.

---

### Jesús Emanuel Vega Medina — Semana 6

- Mi contribución concreta:
  Implementé `src/lib/notifications/client.ts` para solicitar permisos de
  notificación solo bajo una acción explícita y entregar avisos sintéticos
  cuando existe un service worker activo.

- Decisión técnica:
  La API normaliza los casos sin soporte, permiso denegado, permiso pendiente,
  service worker ausente y error recuperable. No usa push remoto, tokens,
  claves ni servicios externos.

- Prueba ejecutada:
  `npm run test -- --run`, con cobertura determinista de permisos y fallback
  de notificaciones dentro de `tests/capabilities.spec.ts`.

- Limitación:
  No se valida entrega de notificaciones en un dispositivo físico ni en
  segundo plano; la entrega depende de las restricciones del navegador.

- Uso declarado de IA:
  Usé apoyo de IA para revisar escenarios de permisos y fallbacks. Validé la
  integración mediante lectura de código y ejecución de las pruebas locales.

---

### Samuel Jonathan Trujillo Bolaños — Semana 6

- Seguimiento de integracion:
  Se conectaron controles opcionales al formulario de inicio y se limito a
  tres segundos la espera del service worker para devolver un aviso local.
  La prueba automatizada reproduce un worker que nunca queda listo y una
  entrega exitosa simulada. La ubicacion de la demostracion usa un proveedor
  sintetico; no se verificaron permisos en hardware fisico. Se uso apoyo de
  un asistente de desarrollo con IA para implementar y revisar estos cambios;
  las comprobaciones automatizadas no sustituyen la validacion humana en un
  navegador real.

- Mi contribución concreta:
  Integré los cambios de cámara, geolocalización y notificaciones sobre
  `main`, resolví los conflictos de archivos compartidos, unifiqué la suite y
  actualicé la documentación, verificación y el workflow formativo de la
  semana.

- Decisión técnica:
  Se mantuvo una única suite acumulada para evitar que las aportaciones de
  cada capacidad sobrescribieran la cobertura de las demás. Los fallbacks
  permanecen deterministas y no solicitan permisos por importar módulos.

- Prueba ejecutada:
  `npm run verify`, `npm run test -- --run` y `npm run build`; la validación
  final también se confirma en GitHub Actions sobre el SHA de entrega.

- Limitación:
  Las pruebas usan mocks y datos sintéticos; no sustituyen la validación de
  permisos reales en hardware físico.

- Uso declarado de IA:
  Usé un asistente de desarrollo con IA para analizar conflictos y revisar la
  cobertura. Validé manualmente los cambios y ejecuté las comprobaciones.

---

### Armando Valerio Salmeron — Semana 8

- **Mi contribución concreta y enlace**:
  Extraje la regla de captura en
  [`src/lib/validation/inspection-capture.ts`](../src/lib/validation/inspection-capture.ts)
  y la conecté al submit del formulario en
  [`src/app/page.tsx`](../src/app/page.tsx). Agregué pruebas unitarias para
  validación y cola en [`tests/unit/`](../tests/unit/), un comando reproducible
  `test:unit` en [`package.json`](../package.json), el reporte de prueba y
  cobertura en [`reports/week-08/unit-report.txt`](../reports/week-08/unit-report.txt),
  y el diagnóstico, contratos y matriz riesgo–prueba en
  [`docs/test-strategy.md`](../docs/test-strategy.md). La contribución quedó
  integrada mediante los PR #33 y #36; el SHA evaluado es el que se fija en
  Classroom.

- **Decisión técnica y motivo**:
  Mantener la regla de validación como función pura compartida por el flujo y
  las pruebas: `location` y `summary` son obligatorios tras recortar espacios,
  mientras que `inspector` sigue siendo opcional. Para idempotencia reutilicé
  `InspectionSyncQueue` con `MemoryQueueStorage`, usando el ID estable del
  registro como llave, sin duplicar la regla en pruebas ni depender de red o
  hardware.

- **Comandos ejecutados y resultados reales**:
  - `npm ci`: PASS, terminó con código 0 e instaló 32 paquetes. npm reportó
    3 vulnerabilidades en dependencias (2 altas y 1 crítica); no ejecuté
    `npm audit fix`.
  - `npm run dev`: Next.js informó `Ready`; `http://localhost:3000` respondió
    HTTP 200. La comprobación manual del formulario rechazó campos vacíos y
    espacios, y aceptó datos sintéticos válidos.
  - `npm test`: PASS, suite acumulada con starter, manifest, service worker,
    offline, rendering, inspecciones, sincronización, capabilities y security.
  - `npm run test:unit`: PASS, 6 pruebas aprobadas y 0 fallidas. Reporte:
    [`reports/week-08/unit-report.txt`](../reports/week-08/unit-report.txt).
    Cobertura de líneas informada: validación 100 %, cola 71.69 % y total de
    archivos instrumentados 64.72 %.
  - `npm run verify`: PASS, “Starter verificable: PASS”; genera
    `reports/verification.json` y comprueba artefactos requeridos, no sustituye
    pruebas ni build.
  - `npm run build`: PASS, compilación optimizada y verificación de tipos
    completadas.

- **Qué demuestra y qué no**:
  Las pruebas unitarias demuestran resultados explícitos para capturas válidas,
  campos obligatorios vacíos o con espacios, reporte de campos faltantes,
  reencolado del mismo ID sin duplicar el envío y actualización de versión al
  cambiar el payload. La prueba manual confirma el mensaje del formulario y
  una captura sintética aceptada en la interfaz. No demuestra persistencia en
  IndexedDB, deduplicación del servidor, tratamiento de dos IDs distintos con
  contenido equivalente, concurrencia entre pestañas ni funcionamiento en
  hardware.

- **Limitación**:
  La demo guarda en memoria y no usa un backend; por ello, el escenario de
  respuesta remota perdida no se reprodujo. La idempotencia se limita a un ID
  estable y al almacenamiento usado por la cola. La cobertura de la cola es
  parcial (71.69 % de líneas) y no implica que todos sus caminos estén
  probados.

- **Uso de IA (herramienta, propósito, partes influidas y validación propia)**:
  Usé Copilot SDK en VS Code como asistente de desarrollo para estructurar la
  función de validación, proponer casos de prueba y redactar la matriz y el
  resumen de evidencia. Revisé el contrato frente al formulario y la cola
  existentes, ejecuté personalmente los comandos anteriores y confirmé los
  resultados reportados; la IA no ejecutó ni verificó por sí sola estas
  comprobaciones.


### Kevin Omar Sixto Lázaro — Semana 8

- **Mi contribución concreta y enlace**:
  Issue [#30](https://github.com/oma4r6464/pwa-inspecciones-sixto-lazaro-kevin-omar/issues/30).
  Trabajo en la rama
  [`feat/week-08-integration-persistence`](https://github.com/oma4r6464/pwa-inspecciones-sixto-lazaro-kevin-omar/tree/feat/week-08-integration-persistence),
  creada desde `feat/week-08-validation-idempotency` para partir de los
  contratos de la primera entrega. Implementé el almacenamiento persistente de
  la cola en
  [`src/lib/storage/indexeddb-queue-storage.ts`](../src/lib/storage/indexeddb-queue-storage.ts),
  el punto de integración compartido con la interfaz en
  [`src/lib/sync/inspection-store.ts`](../src/lib/sync/inspection-store.ts) y
  el transporte sintético de la demo en
  [`src/lib/sync/synthetic-remote.ts`](../src/lib/sync/synthetic-remote.ts).
  Agregué las pruebas de integración, fixtures y el remoto controlado en
  [`tests/integration/`](../tests/integration/), el comando `test:integration`
  en [`package.json`](../package.json), la conexión de la interfaz en
  [`src/app/page.tsx`](../src/app/page.tsx), la sección de integración y
  persistencia en [`docs/test-strategy.md`](../docs/test-strategy.md) y el
  reporte [`reports/week-08/integration-report.txt`](../reports/week-08/integration-report.txt).
  La contribución quedó integrada mediante los PR #34 y #36; el SHA evaluado
  es el que se fija en Classroom.

---

### Samuel Jonathan Trujillo Bolaños (KIRA21M) — Semana 8

- **Contribución concreta**: coordiné la integración ordenada de las
  contribuciones de Armando, Kevin y Jesús en `dev` mediante los PR #33, #34
  y #35, y la promoción final a `main` mediante el PR #36. También consolidé
  la estrategia, la evidencia y la verificación del workflow académico.
- **Decisión técnica**: conservar los checks existentes y agregar validaciones
  explícitas de lint estructural, tipos y build antes de unitarias, integración
  y E2E. El lint revisa marcadores de conflicto y patrones de secretos sin
  depender de servicios externos.
- **Pruebas ejecutadas**: `npm run lint`, `npm run typecheck`, `npm run
  test:unit`, `npm run test:integration`, `npm run verify` y `npm run build`.
  GitHub Actions confirmó además el flujo E2E con Chromium sobre el commit
  integrado.
- **Limitación**: las pruebas usan datos sintéticos, mocks y Chromium; no
  sustituyen hardware, permisos reales ni un backend de producción. `npm ci`
  mantiene las advertencias de vulnerabilidades heredadas sin aplicar cambios
  incompatibles.
- **Uso declarado de IA**: utilicé un asistente de desarrollo para revisar la
  cobertura, detectar inconsistencias documentales y proponer comprobaciones.
  Validé manualmente los cambios, los comandos y los resultados antes de
  integrarlos.

- **Decisión técnica y motivo**:
  Implementé `QueueStorage` sobre IndexedDB con una copia en memoria y
  escritura en segundo plano (`flush()` espera la persistencia). Así mantuve la
  interfaz síncrona existente y no tuve que modificar `queue.ts` ni
  `tests/sync.spec.ts`. Usé el `id` del registro como clave de idempotencia,
  conforme al contrato de la primera entrega, y la interfaz conserva el mismo
  `id` al reintentar una captura. El remoto controlado de las pruebas
  deduplica por esa clave y puede simular una respuesta perdida. Interfaz y
  pruebas usan el mismo `inspection-store.ts` para que la integración no sea
  una función aislada. Al revisar `synchronize()` vi que lee la cola al inicio
  y la reescribe al final, por lo que un guardado durante la sincronización
  podía perderse; lo resolví serializando guardar y sincronizar en el store, sin
  cambiar `queue.ts`, y lo cubrí con una prueba. También retiré el fallo
  simulado de la demo (fallaba en intentos pares), porque ahora el error solo
  aparece si falla el almacenamiento local.

- **Comandos ejecutados y resultados reales**:
  - `npm run test:integration`: PASS, 8 pruebas aprobadas y 0 fallidas.
    Reporte:
    [`reports/week-08/integration-report.txt`](../reports/week-08/integration-report.txt).
  - `npm test`: PASS, suite acumulada con starter, manifest, service worker,
    offline, rendering, inspecciones, sincronización, capabilities y security.
  - `npx tsc --noEmit`: la primera ejecución falló con TS2307 porque faltaba
    `src/lib/sync/synthetic-remote.ts`; después de crearlo terminó sin errores.
  - `npm run build`: PASS, compiló correctamente y generó las 5 páginas
    estáticas.

- **Qué demuestra y qué no**:
  Las pruebas demuestran que una inspección guardada sin conexión se lee desde
  almacenamiento después de cerrar y reabrir el consumidor, que reconectar vacía
  la cola y la deja vacía también en el almacenamiento, que reintentar la misma
  operación tras una respuesta perdida deja exactamente un registro remoto, que
  reencolar el mismo id no duplica la entrada, que los casos están aislados y
  que guardar durante una sincronización no pierde la captura nueva. No
  demuestran el comportamiento en IndexedDB de un navegador real (se usó
  `fake-indexeddb` en Node), concurrencia entre pestañas, deduplicación de un
  backend real ni de capturas equivalentes con ids distintos. No ejecuté una
  verificación manual en el navegador ni un E2E de recarga; ese E2E corresponde
  a la tercera entrega.

- **Limitación**:
  El transporte de la demo es sintético y no hay backend. Si el proceso termina
  antes de `flush()`, la última escritura podría perderse. `synchronize()`
  reintenta de inmediato y no consulta `nextAttemptAt`; la interfaz solo
  sincroniza al cargar y al recuperar conexión. La página
  `/inspecciones/[id]` solo lee los datos sintéticos fijos, por lo que una
  inspección nueva no tiene página de detalle. Todos los datos son sintéticos.

- **Uso de IA (herramienta, propósito, partes influidas y validación propia)**:
  proponer el diseño y redactar borradores de código, pruebas y documentación.
  Influyó en el almacenamiento IndexedDB, el store, las pruebas de integración,
  el cambio en `page.tsx`, la sección de `docs/test-strategy.md` y el borrador
  de esta evidencia. 
  leí el código, ejecuté personalmente los comandos anteriores y los
  resultados reportados son los de mi terminal.

---

### Jesus Emanuel Vega Medina (3523110340) — Semana 9

- **Contribución concreta:** agregué el inventario real de datos en
  `docs/privacy-data-inventory.md`, la política `public/robots.txt`, la
  ampliación de `tests/security.spec.ts` y los encabezados CSP y
  `Permissions-Policy` en `next.config.mjs`. También actualicé el verificador
  para exigir los artefactos de esta entrega.
- **Decisión técnica:** mantener el offline existente y documentar sus límites,
  incluyendo la cola en IndexedDB, en vez de atribuir cifrado o borrado que no
  existen. La CSP restringe el mismo origen, bloquea objetos y marcos, y la
  política de permisos conserva sólo cámara, geolocalización y notificaciones
  opcionales; micrófono, pagos y USB quedan desactivados. `robots.txt` bloquea
  rastreo, pero se documenta como una instrucción y no como seguridad.
- **Prueba ejecutada:** `npm test -- --run`, `npm run lint`, `npm run typecheck`,
  `npm run build` y `npm run verify`. La prueba de seguridad conserva el caso
  de normalización de errores y agrega casos positivos y negativos de
  validación, ausencia de detalles sensibles, `robots.txt`, CSP y permisos.
- **Resultado real:** `npm ci` terminó correctamente con 35 paquetes
  instalados; informó 3 vulnerabilidades heredadas (2 altas y 1 crítica).
  `npm test -- --run` pasó starter, manifest, service worker, offline,
  rendering, inspecciones, sync, capabilities y security. También pasaron
  `npm run lint` (66 archivos), `npm run typecheck`, `npm run build` y
  `npm run verify`. Con `npm start`, `GET /robots.txt` devolvió 200 y `GET /`
  devolvió CSP y `Permissions-Policy` con los valores esperados.
- **Limitación:** no hay backend, autenticación, cifrado local, retención
  automática ni navegador físico en esta entrega; `robots.txt` no impide acceso
  y los permisos dependen del navegador.
- **Cambio defendible:** los datos sintéticos permanecen aislados del
  transporte externo; un error de validación no devuelve el contenido recibido
  y la configuración del navegador se comprueba por archivo y comportamiento
  reproducible.
- **Uso de IA:** utilicé Copilot SDK en VS Code para revisar el código
  existente, proponer la estructura del inventario y los casos de prueba.
  Influyó en `docs/privacy-data-inventory.md`, `tests/security.spec.ts`,
  `scripts/run-security-spec.mjs`, `next.config.mjs`, `public/robots.txt` y
  esta sección. Validé manualmente cada cambio, revisé las rutas reales y
  ejecuté los comandos indicados.

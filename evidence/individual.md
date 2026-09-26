# Evidencia individual — equipo pwa-inspecciones-sixto-lazaro-kevin-omar

Repositorio privado del equipo:
https://github.com/oma4r6464/pwa-inspecciones-sixto-lazaro-kevin-omar

SHA final del equipo: se fija en Classroom con el último commit entregado en `main`.

---
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

- Commit SHA de la implementación: `79c1712c6a7d1f979701c4b85e77c4f65b3568d7`.
- Decisión técnica: no persistir inspecciones sintéticas y construir errores sólo con `incidentId`, `correlationId`, `status`, `attempt` y `durationMs`. Se compararon memoria, IndexedDB cifrada y almacenamiento de servidor en `docs/security-controls.md`.
- Prueba ejecutada: `npm test`, incluyendo `tests/security.spec.ts`, valida que valores sensibles sintéticos y propiedades desconocidas no sobrevivan al contexto técnico. Los reportes son `reports/week-04/secret-scan.json`, `reports/week-04/negative-tests.json` y `evidence/week-04/engineering.json`.
- Limitación: no hay backend, sesión real, persistencia segura ni fotografías; todo el contenido es ficticio y la demo en memoria se pierde al recargar.
- Uso declarado de IA: usé GitHub Copilot para revisar el alcance de Semana 04, proponer el sanitizador, redactar documentación y pruebas. Validé manualmente el resultado con `npm ci`, `npm test`, `npm run verify` y `npm run build`; no se usaron secretos ni datos reales.

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

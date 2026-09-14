# Evidencia individual — equipo pwa-inspecciones-sixto-lazaro-kevin-omar

Repositorio privado del equipo:
https://github.com/oma4r6464/pwa-inspecciones-sixto-lazaro-kevin-omar

SHA final del equipo: 239223c5b40e01abdaab87bbc65ad133f0bbd4f4.

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

- Uso de IA (herramienta, propósito, fragmentos influenciados y validación humana):
  Usé Claude (Anthropic) como asistente para: (1) guiar los comandos de
  git para inicializar y subir el repositorio, (2) redactar un borrador
  inicial de `docs/requirements.md` y `docs/decision-record.md`
  adaptado a las plantillas propias del starter. Validé manualmente
  cada sección contrastándola con el enunciado de la actividad y el
  contenido real del proyecto (datos de demo, estructura de carpetas),
  y ajusté el contenido antes de la entrega final. No usé IA para el
  quiz presencial.

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


//////////////////////////////////////////////////////////
Nombre: Kevin Omar Sixto Lázaro (Encargado de App Shell y estados - Semana 2)
Mi contribución concreta (con enlace a archivo, commit o revisión): Creé src/components/app-shell.tsx: un shell instalable con header/navegación (logo, enlaces "Inicio"/"Inspecciones", menú hamburguesa en móvil) y tres componentes reutilizables de estado (LoadingState, ErrorState, EmptyState). Modifiqué src/app/page.tsx para usar el AppShell y agregar un formulario real de "Agregar inspección" (ubicación, responsable, estado, resumen) que, al guardar, dispara los estados de carga, éxito (con aviso animado) y error (con reintento), sin alterar los 3 registros sintéticos originales de src/lib/data/inspections.ts. También agregué un control para vaciar la lista y así poder verificar el estado vacío, con un botón para restaurar los datos sintéticos. Actualicé src/app/globals.css con los estilos y animaciones correspondientes (header, formulario, spinner, toast de éxito).
Decisión que puedo explicar: Como todavía no existe un backend real, decidí simular la persistencia en memoria (useState) en vez de dejar los estados como demostraciones desconectadas de una acción real. El guardado alterna éxito/error de forma predecible (intento impar = éxito, intento par = error) en lugar de aleatorio, para que el estado de error sea reproducible en cualquier revisión sin depender de la suerte.
Comando o prueba que ejecuté y resultado real: Ejecuté npm run verify (PASS), npm test (starter.spec.mjs: PASS) y npm run build (compiló sin errores) después de cada cambio. Probé manualmente en localhost:3000: carga inicial, guardar una inspección dos veces seguidas (primera éxito, segunda error con reintento), y el enlace "Vaciar lista" seguido de "Restaurar datos sintéticos".
Qué comprueba esta prueba y qué no: Comprueba que la aplicación compila, pasa el verificador de estructura del starter y que los 4 estados (carga, éxito, error, vacío) se pueden reproducir manualmente en el navegador. No comprueba automáticamente (con un framework de pruebas como Playwright o Testing Library) que cada estado muestre el texto o los elementos correctos; eso queda como trabajo futuro.
Limitación que encontré: El guardado de inspecciones es solo en memoria: al recargar la página se pierden los datos agregados y vuelve a los 3 registros sintéticos originales. La funcionalidad completa de creación (persistencia real, validaciones de backend) sigue pendiente como RF-02 en docs/requirements.md.
Uso de IA (herramienta, propósito, fragmentos influenciados y validación humana): Usé Claude (Anthropic) para diseñar la estructura del componente AppShell, los tres estados reutilizables y el flujo del formulario con estados alternados de éxito/error. Validé cada cambio ejecutando npm run verify, npm test y npm run build localmente, y probando manualmente cada estado en el navegador antes de aceptarlo.

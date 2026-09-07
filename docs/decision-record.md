# ADR-001 — Estrategia de aplicación

## Estado

Aceptada — 4 de septiembre de 2026.

## Contexto y restricciones

El proyecto es una aplicación para registrar inspecciones de laboratorio,
usada por técnicos que a veces trabajan en zonas con conectividad
intermitente y frecuentemente desde dispositivos móviles mientras
recorren las instalaciones. Todos los datos manejados son sintéticos,
sin información real de personas ni instituciones. El proyecto se
desarrolla dentro de una materia de 14 semanas con un equipo pequeño de
estudiantes, por lo que la solución debe ser mantenible sin dedicar
tiempo excesivo a infraestructura, y debe poder desplegarse e
instalarse de forma reproducible (`npm ci && npm run dev` sin pasos
ocultos) para que cualquier evaluador pueda levantarla igual que el
equipo.

## Alternativas consideradas

**PWA (Progressive Web App)**
Instalación: sin fricción, vía navegador. Offline: soportable mediante
service worker (a agregarse en semanas futuras). Distribución: sin
tiendas de aplicaciones, actualización inmediata para todos los
usuarios. Costo de desarrollo: bajo, una sola base de código con
tecnologías web estándar (Next.js). Mantenimiento: bajo para un equipo
pequeño. Acceso a capacidades del dispositivo: limitado (sin acceso
profundo a hardware). Riesgos: menor rendimiento que nativo en tareas
intensivas, que no aplica a este caso de uso.

**Web tradicional (sin capacidades PWA)**
Instalación: ninguna, solo navegador. Offline: nulo, sin ninguna
tolerancia a pérdida de conexión. Distribución: inmediata. Costo de
desarrollo: el más bajo. Mantenimiento: bajo. Acceso a capacidades del
dispositivo: nulo. Riesgos: no resuelve el problema central del proyecto
(conectividad intermitente), por lo que queda descartada.

**Aplicación nativa (iOS/Android)**
Instalación: requiere tienda de aplicaciones. Offline: robusto desde el
diseño. Distribución: lenta, sujeta a revisión de tiendas y
actualizaciones manuales de los usuarios. Costo de desarrollo: alto,
requiere dos bases de código o un framework nativo por plataforma.
Mantenimiento: alto para un equipo de estudiantes. Acceso a
capacidades del dispositivo: completo. Riesgos: costo y tiempo
incompatibles con las 14 semanas de la materia.

**Multiplataforma (React Native / Flutter, etc.)**
Instalación: requiere tienda de aplicaciones igualmente. Offline:
soportable con más esfuerzo que una PWA. Distribución: igual de lenta
que nativo. Costo de desarrollo: medio-alto, requiere aprender un
framework adicional. Mantenimiento: medio. Acceso a capacidades del
dispositivo: alto. Riesgos: complejidad de build y curva de aprendizaje
no justificadas para el alcance actual del proyecto.

## Decisión

Se selecciona **PWA** porque satisface mejor las restricciones: no
requiere publicación en tiendas, permite iteración rápida por parte de
un equipo pequeño, y sienta las bases (mediante service worker y
manifest) para resolver el problema central de conectividad intermitente
en fases posteriores del curso, sin necesidad de reescribir la
aplicación. Esta decisión **no resuelve todavía** el soporte offline
real, el guardado local de formularios sin conexión, la sincronización
en segundo plano ni las notificaciones — esas capacidades quedan fuera
del alcance de esta semana y se abordarán después.

## Consecuencias y riesgos

**Consecuencias positivas:** menor costo de desarrollo y mantenimiento,
despliegue reproducible con herramientas web estándar, ruta clara de
evolución hacia soporte offline sin cambiar de arquitectura.

**Costos:** sin acceso a capacidades avanzadas del hardware del
dispositivo, que no se necesitan para el caso de uso actual.

**Riesgos técnicos:** si el service worker y la sincronización offline
no se implementan a tiempo en semanas futuras, el problema central del
proyecto (conectividad intermitente) queda sin resolver.

**Mitigación:** planear la incorporación de service worker y manifest
como siguientes hitos del proyecto, priorizándolos sobre funcionalidades
no críticas.

## Validación

Esta decisión se validará revisando que, en semanas futuras, el
escenario B (conectividad intermitente) quede resuelto agregando
service worker y sincronización sobre la misma base de Next.js, sin
haber requerido reescribir la aplicación en otra tecnología. También se
verificará con el flujo actual del proyecto (`npm run verify`,
`npm test`, `npm run build` y, cuando el entorno lo permita,
`bash public-tests/check.sh`) que la instalación siga siendo
reproducible en cada entrega.


# Requisitos del producto — completar en Semana 1

> Conserva estos encabezados y reemplaza las instrucciones por tu análisis. No uses datos reales.

## 1. Problema y contexto

Los técnicos de laboratorio de computo registran
sus inspecciones en papel o en hojas de cálculo dispersas, lo que genera
pérdida de evidencia, demoras en reportar incidencias críticas y falta de trazabilidad histórica por laboratorio. Se necesita una aplicación web
que permita registrar inspecciones de forma rápida, incluso con
conectividad inestable dentro de las instalaciones.

Fuera del alcance de esta semana: modo offline real, service worker,
manifest, sincronización en segundo plano, notificaciones push y
autenticación de usuarios. Estas capacidades se agregarán en semanas
posteriores.

## 2. Usuarios y escenarios

**Usuarios principales:**
**Técnico de laboratorio**: registra inspecciones y marca hallazgos.

**Responsable de laboratorio**: revisa el historial de su área y da
  seguimiento a las inspecciones que requieren atención.

**Administrador académico**: consulta reportes agregados de todos los
  laboratorios para auditorías y planeación de mantenimiento.

**Escenario A — Conectividad estable**
Una técnica entra al Laboratorio de Redes con Wi-Fi normal, abre la app,
completa el formulario de inspección (cableado, ventilación, estaciones
de trabajo), lo envía y lo ve reflejado de inmediato en el listado de
"Inspecciones recientes".

**Escenario B — Conectividad intermitente**
Un técnico inspecciona el Laboratorio de Electrónica, en un cuarto con
mala señal. La conexión se cae mientras completa el formulario. La app
no debe bloquearse ni perder lo ya escrito; en esta etapa (sin offline
real todavía) debe avisar claramente que el registro no se pudo enviar,
para que el técnico lo reintente al recuperar señal.

**Escenario C — Auditoría administrativa**
El administrador académico entra a la aplicación desde su computadora de
escritorio. Al cargar la pantalla principal, puede ver rápidamente las 
inspecciones recientes de todos los laboratorios e identificar de forma 
visual (gracias a las etiquetas) cuáles fueron marcadas como 
"Requiere atención" para programar el mantenimiento necesario.

## 3. Requisitos funcionales


| # | Requisito | Criterio de aceptación |
|---|-----------|-------------------------|
| RF-01 | Mostrar un listado de inspecciones recientes con estado, fecha, laboratorio, responsable y hallazgos. **(Implementado)** | Al cargar `/`, se muestran las inspecciones sintéticas de demo con esos 5 campos visibles. |
| RF-02, producto futuro | Permitir registrar una nueva inspección con laboratorio, descripción, responsable y estado. | Al enviar el formulario con datos válidos, la inspección aparece en el listado sin recargar la página. |
| RF-03, producto futuro | Validar campos obligatorios antes de guardar. | Si falta laboratorio o descripción, se muestra un error y no se crea el registro. |
| RF-04 | Distinguir visualmente inspecciones "Sin incidencias" de "Requiere atención". **(Implementado)** | Cada tarjeta muestra una etiqueta de color distinto según el estado. |
| RF-05, producto futuro | Informar al usuario cuando una acción no pudo completarse por error de red. | Si falla el envío, aparece un mensaje visible indicando que debe reintentar. |
| RF-06, producto futuro | Permitir editar una inspección enviada. | El usuario puede corregir errores en los datos enviados dentro de las primeras 24 horas posteriores al registro inicial. |

## 4. Requisitos no funcionales

| # | Requisito | Métrica |
|---|-----------|---------|
| RNF-01 | Reproducibilidad de instalación | `npm ci && npm run dev` debe levantar el proyecto sin errores en una máquina limpia. |
| RNF-02 | Rendimiento de carga | La página `/` debe renderizar contenido visible en menos de 2 segundos en entorno local. |
| RNF-03 | Accesibilidad básica | Todos los campos de formulario deben tener `label` asociado y navegación por teclado funcional. |
| RNF-04 | Seguridad y privacidad | No se almacenan datos reales de personas; ningún secreto o credencial se sube al repositorio. |
| RNF-05 | Preparación para operación offline futura | La estructura de datos y componentes debe permitir agregar un service worker sin rediseñar la app (verificado por revisión de código, no por prueba automatizada esta semana). |

## 5. Datos sintéticos y límites

Todos los datos usados (nombres de laboratorios, responsables como
"Técnica A", hallazgos, fechas) son ficticios, generados únicamente para
esta actividad. Está prohibido usar nombres reales de personas,
credenciales, datos institucionales sensibles o cualquier información
que permita identificar a alguien fuera del contexto del ejercicio.

## 6. Criterios de aceptación de la Semana 1


| Entrega | Verificación |
|---------|--------------|
| Instalación limpia | `npm ci && npm run dev` corre sin errores y `http://localhost:3000` muestra 3 inspecciones sintéticas. |
| Requisitos funcionales y no funcionales documentados | Este archivo (`docs/requirements.md`) completo con RF-01 a RF-05 y RNF-01 a RNF-05. |
| Decisión de arquitectura documentada | `docs/decision-record.md` completo con comparación y decisión justificada. |
| Evidencia individual | `evidence/individual.md` con contribución, SHA y prueba realizada. |
| Verificación automatizada | `make verify && bash public-tests/check.sh` corre sin errores y `reports/verification.json` se genera. |

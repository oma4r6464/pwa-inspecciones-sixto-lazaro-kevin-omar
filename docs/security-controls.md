# Controles de seguridad y privacidad — Semana 04

## Alcance y datos revisados

La aplicación trabaja sólo con datos sintéticos en memoria. Se revisaron los
lugares donde podrían terminar datos de sesión, identificadores personales,
ubicación, referencias de fotografías o comentarios internos: estado React,
service worker, reportes, consola y documentación. No hay backend, sesión real,
subida de archivos ni fotografías.

| Dato | Control aplicado | Prueba |
| --- | --- | --- |
| Sesión o credenciales | No se almacenan ni se escriben en logs; el service worker no cachea APIs. | `reports/week-04/secret-scan.json` |
| Identificadores personales | Los registros de demostración usan etiquetas sintéticas y no se exportan. | `tests/security.spec.ts` |
| Ubicación | Sólo existe como texto ficticio de laboratorio y vive en memoria. | `reports/week-04/negative-tests.json` |
| Fotografías/evidencia | No existe carga ni persistencia de imágenes o referencias. | `evidence/week-04/engineering.json` |
| Comentarios internos | El resumen sintético sólo se renderiza en la sesión y no entra al contexto de error. | `tests/security.spec.ts` |

## Manejo de errores

`src/lib/security/safe-error.ts` define la única forma permitida de construir
contexto técnico: `incidentId`, `correlationId`, `status`, `attempt` y
`durationMs`. Normaliza identificadores, limita números y descarta cualquier
propiedad adicional; por diseño no recibe ni serializa el objeto `Error` ni
datos del formulario. La interfaz muestra un mensaje genérico y no detalles
internos.

El service worker conserva el fallback offline y no registra el objeto de
error. Los reportes de Semana 04 son artefactos de verificación, no bitácoras
de usuarios.

## Decisión de almacenamiento

Se eligió **no persistir datos de inspección en esta semana**. Es la opción con
menor exposición mientras no exista autenticación, backend ni política de
retención.

| Alternativa | Ventaja | Riesgo o costo |
| --- | --- | --- |
| Estado en memoria, elegido | Cero datos persistentes y fácil de auditar. | Se pierde al recargar o cerrar la sesión. |
| IndexedDB cifrada en el dispositivo | Soportaría trabajo offline y mayor capacidad. | Requiere gestión de claves, borrado, migraciones y riesgo de acceso local. |
| Almacén de servidor con sesión | Permitiría control central, auditoría y revocación. | Requiere backend, autenticación, autorización, transporte seguro y retención. |

IndexedDB o un almacén de servidor sólo serían aceptables después de definir
claves, permisos, retención y borrado. No se simula una credencial ni se
incluyen secretos para aparentar ese control.

## Amenazas, pruebas y riesgo residual

- **Fuga por logs o errores:** mitigada al conservar sólo el contexto seguro y
  mostrar errores genéricos. Se verifica con la prueba positiva/negativa de
  `tests/security.spec.ts` y `reports/week-04/negative-tests.json`.
- **Persistencia accidental en caché:** mitigada porque el service worker sólo
  precachea el shell y no intercepta APIs. Se documenta en
  `docs/cache-strategy.md` y se referencia en `reports/week-04/secret-scan.json`.
- **Secreto escrito en el repositorio:** mitigado mediante el escaneo
  reproducible descrito en `evidence/week-04/engineering.json`.

El riesgo residual es que cualquier persona con acceso al dispositivo puede
ver la demo mientras la pestaña está abierta, y que un futuro cambio podría
introducir persistencia sin pasar por esta prueba. No hay datos reales,
credenciales reales, ubicaciones reales ni fotografías reales en este alcance.
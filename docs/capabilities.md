# Capacidades opcionales

La cámara y la geolocalización se solicitan únicamente desde una acción que
llame a sus funciones. Si el navegador no expone la API, el usuario rechaza el
permiso o el dispositivo no está disponible, las funciones devuelven un
resultado `ok: false` controlado.

Las notificaciones siguen dos pasos: `requestNotificationPermission()` solo se
ejecuta desde una acción explícita del usuario; `notifyInspectionChange()` no
solicita permisos y solo prepara una notificación sintética cuando el permiso
ya es `granted` y existe un service worker listo. En cualquier otro caso
devuelve un motivo de fallback (`unsupported`, `denied`, `default` o
`service-worker-unavailable`).

No se usan push, claves VAPID, endpoints externos, tokens ni datos reales. El
cuerpo de la notificación es fijo y mínimo para que la prueba sea reproducible.
La suite `tests/capabilities.spec.ts` simula los estados `granted`, `denied`,
`default`, la API ausente, el service worker ausente y capacidades sintéticas de
cámara y geolocalización.

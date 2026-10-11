# Capacidades opcionales del dispositivo

## Alcance

La Semana 6 incorpora camara, geolocalizacion aproximada y notificaciones como
capacidades opcionales. Una inspeccion continua con datos sinteticos si una
capacidad no existe, se deniega el permiso o hay un error recuperable.

## Decisiones tecnicas

| Capacidad | Activacion | Fallback | Datos tratados |
| --- | --- | --- | --- |
| Camara | Accion explicita | Descriptor de evidencia sintetica | No se captura ni guarda una foto real |
| Geolocalizacion | Accion explicita | Punto sintetico `(0, 0)` | Coordenadas a un decimal; no se persisten |
| Notificaciones | Accion explicita | Aviso local | No se usan claves push, tokens ni servicios externos |

La deteccion de soporte no solicita permisos. Las funciones de solicitud se
invocan desde controles de interfaz y normalizan los estados para que no se
dependa de mensajes propios del navegador.

## Privacidad y seguridad

Los errores de camara usan mensajes fijos para evitar exponer detalles del
dispositivo. La adjuncion sintetica libera el stream y admite promesas
rechazadas sin bloquear la inspeccion. Los identificadores se limitan a 80
caracteres; las etiquetas siguen siendo entradas del usuario y deben contener
solo texto ficticio. Sanitizar caracteres no garantiza anonimizar datos.

- No se solicita una capacidad al cargar la aplicacion ni al importar un modulo.
- La camara libera sus pistas cuando el consumidor termina con el stream.
- La geolocalizacion usa `enableHighAccuracy: false`, redondea coordenadas y
  fija una precision minima de 10 km.
- Los fallbacks, pruebas y ejemplos emplean solo datos sinteticos.
- No se almacenan fotos, ubicaciones reales, PII, secretos, tokens ni claves.

## Estados y fallbacks

La camara clasifica `available`, `unsupported`, `permission_denied` y
`recoverable_error`. La geolocalizacion clasifica `granted`, `unsupported`,
`denied`, `timeout` y `error`. Todo estado no exitoso entrega un fallback
utilizable y deja el flujo desbloqueado.

Las notificaciones se solicitan solo cuando el navegador las soporta y la
persona usuaria inicia la accion. Si estan denegadas o no disponibles, la app
debe mostrar su alternativa local sin interrumpir la inspeccion.

## Alternativas descartadas

- Pedir permisos en el arranque: degrada la confianza y no es necesario.
- Guardar multimedia o coordenadas exactas: aumenta el riesgo sin valor para
  este incremento academico.
- Usar push remoto, mapas o geocoding: requeriria infraestructura y credenciales
  fuera del alcance de la entrega.

## Limites conocidos

Las pruebas usan proveedores inyectables y mocks deterministas; no validan un
sensor fisico, permisos reales del navegador, calidad optica ni entrega push en
segundo plano. Una integracion futura debera solicitar cada permiso desde la UI
y decidir, con consentimiento, si persistir evidencia real.

## Verificacion

```bash
npm ci
npm run verify
npm run test -- --run
npm run build
```


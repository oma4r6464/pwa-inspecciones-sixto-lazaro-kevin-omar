# Capacidades del dispositivo: geolocalizacion minima y privacidad

## Alcance

La Semana 6 agrega `src/lib/device/geolocation.ts`, una capacidad opcional para obtener contexto de ubicacion de una inspeccion. La capacidad nunca es obligatoria: si falla, la captura de la inspeccion continua con una ubicacion sintetica.

## Decision de privacidad

- **Permiso solo bajo accion explicita.** El modulo no llama a `navigator.geolocation` al importarse ni al cargar la app. Solo `requestLocation()` solicita ubicacion, y debe invocarse desde una accion del usuario (por ejemplo, un boton).
- **Precision limitada.** Las coordenadas se redondean a 1 decimal (aprox. 11 km) y la precision reportada nunca baja de 10 000 m. Se pide `enableHighAccuracy: false`.
- **Sin persistencia ni red.** El resultado no se guarda ni se envia. No se usan mapas, geocoding, llaves privadas ni tokens.
- **Sin filtrar detalles del navegador.** Los mensajes al usuario son fijos; no se copia el texto de error original.
- **Datos sinteticos.** El fallback usa el punto (0, 0), que no corresponde a ninguna ubicacion real del proyecto. Todos los valores de las pruebas son ficticios. El repositorio, el README y la evidencia no contienen coordenadas reales.

## Estados

| Estado | Cuando ocurre | Ubicacion devuelta | Reintento |
| --- | --- | --- | --- |
| `granted` | El navegador entrega una posicion valida | Aproximada (redondeada) | No necesario |
| `unsupported` | No existe `navigator.geolocation` | Sintetica | No |
| `denied` | El usuario niega el permiso | Sintetica | No |
| `timeout` | Se agota el tiempo (8 s por defecto) | Sintetica | Si |
| `error` | Posicion no disponible, dato invalido o excepcion | Sintetica | Si |

`requestLocation()` nunca rechaza la promesa: siempre resuelve con un resultado utilizable, por lo que la captura de inspecciones no se rompe.

## Alternativas descartadas

- **Pedir permiso al cargar la app:** viola la regla de accion explicita y degrada la confianza del usuario.
- **Guardar coordenadas exactas:** aumenta el riesgo de exponer ubicaciones sensibles sin necesidad para el caso de uso.
- **Servicios externos de mapas o geocoding:** introducen terceros, llaves y trafico de datos de ubicacion.

## Supuestos y limites

- El proveedor se inyecta para poder probar en Node con mocks deterministas; en el navegador se usa `navigator.geolocation`.
- No se probo con un dispositivo fisico ni con permisos reales del navegador.
- La interfaz (boton, formulario de ubicacion manual) no forma parte de esta actividad; el modulo expone el fallback sintetico mediante `createFallbackLocation(label)`.

## Verificacion

```bash
npm ci
npm run test -- --run
npm run verify
npm run build
```
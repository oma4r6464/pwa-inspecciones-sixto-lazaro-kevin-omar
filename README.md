# PWA de inspecciones de laboratorio

Proyecto integrador para **Aplicaciones Web Progresivas**. La app usa
un shell instalable para consultar inspecciones y mantenimiento de
laboratorios con datos sinteticos.

## Alcance actual

- Semana 1: arranque reproducible del starter, requisitos y decision de producto.
- Semana 2: manifest web, layout base, navegacion, shell de aplicacion y estados de carga, error y vacio.

No se usan datos reales de personas, estudiantes o laboratorios. Los registros incluidos en `src/lib/data/inspections.ts` son sinteticos.

## Requisitos locales

- Node.js 20.19 o posterior compatible con Next.js.
- npm 10 o superior.
- Git.

Versiones utilizadas en esta revision local: Node.js 24.19.0 y npm 11.17.0.

## Setup y ejecucion

```bash
npm ci
npm run dev
```

Abre <http://localhost:3000>. Debes ver el shell de inspecciones con
navegacion principal, resumen operativo, tarjetas de inspecciones y la
seccion de estados cubiertos.

## Verificacion local

La verificacion se mantiene alineada con los checks existentes del repositorio:

```bash
npm run verify
npm test
npm run build
```

Si el entorno tiene `make` disponible, el equivalente del Makefile para la
verificacion estructural es:

```bash
make verify
```

`npm run verify` genera `reports/verification.json`. `npm test` ejecuta la
prueba del starter y tambien carga `tests/manifest.spec.ts`, donde se valida
el manifest, sus iconos, la referencia desde el layout y los estados criticos
del `AppShell`. `npm run build` comprueba la compilacion de produccion.

## Artefactos principales

- `public/manifest.webmanifest`: configuracion instalable de la PWA.
- `public/icons/icon-192.svg` y `public/icons/icon-512.svg`: iconos usados por el manifest.
- `src/app/layout.tsx`: metadata, viewport y enlace al manifest.
- `src/app/page.tsx`: entrada de la pagina principal.
- `src/components/app-shell.tsx`: shell con navegacion, contenido y estados de carga, error y vacio.
- `tests/manifest.spec.ts`: prueba automatizada del comportamiento critico de Semana 2.
- `evidence/individual.md`: evidencia individual, decisiones, pruebas, limitaciones y uso declarado de IA.

## Decisiones y supuestos

- El manifest se declara desde `layout.tsx` para que Next.js publique el enlace en el documento raiz.
- El shell se implementa como componente de servidor porque por ahora solo consume datos sinteticos locales.
- Los estados de carga, error y vacio quedan modelados como variantes de `AppShellState`; esto permite probarlos sin depender todavia de una API real.
- No se modifica la configuracion de GitHub Actions existente; las pruebas nuevas se integran al comando `npm test` que ya ejecuta el CI.

## Limites conocidos

- Todavia no hay service worker ni cache offline real.
- La app no guarda inspecciones ni sincroniza cambios.
- La navegacion actual es interna al shell; rutas adicionales quedan para incrementos posteriores.
- La evidencia final debe fijarse con el SHA exacto del commit entregado y la corrida verde de GitHub Actions.

## Entrega

Para Classroom se debe subir:

- URL del repositorio: <https://github.com/oma4r6464/pwa-inspecciones-sixto-lazaro-kevin-omar>
- SHA exacto del commit final entregado.
- Enlace de la corrida de GitHub Actions del mismo commit.
- Archivo `evidence/individual.md` o su contenido como evidencia individual.

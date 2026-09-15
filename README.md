# PWA de inspecciones de laboratorio — proyecto base

Starter oficial para la materia **Aplicaciones Web Progresivas**.

Este repositorio es el punto de partida común para las actividades de las semanas 1–13. En la Semana 1 no debes construir todavía toda la PWA: debes poner en marcha este proyecto, documentar el problema y dejar una primera versión reproducible. Cada semana conservarás el mismo repositorio y agregarás la capacidad indicada por la actividad.

## Requisitos locales

- Node.js 20.19 o posterior compatible con Next.js.
- npm 10 o superior.
- Git y una cuenta de GitHub.

Versiones utilizadas en esta revisión: Node.js 24.19.0 y npm 11.17.0.

## Arranque verificable

```bash
npm ci
npm run dev
```

Abre <http://localhost:3000>. Debes ver la pantalla inicial de inspecciones con datos sintéticos y el **App Shell** instalable.
Para verificar el avance de la **Semana 2**:
- **Manifest PWA**: Abre Chrome DevTools > Application > Manifest y comprueba los metadatos y el icono SVG.
- **App Shell y Navegación**: Menú interactivo responsivo (móvil y escritorio) con enlaces a Inicio e Inspecciones.
- **Estados de interfaz**:
  - *Carga*: Estado visible durante la simulación de lectura inicial y guardado (`LoadingState`).
  - *Éxito*: Notificación toast animada tras agregar una inspección sintética.
  - *Error con reintento*: Alternancia determinista de fallo en segundo intento con botón "Reintentar" (`ErrorState`).
  - *Vacío*: Botón "Vaciar lista" para visualizar `EmptyState` y botón para "Restaurar datos sintéticos".

Antes de entregar ejecuta:

```bash
npm ci
npm run verify
npm test
npm run build
```

`npm run verify` comprueba la presencia de artefactos requeridos y genera `reports/verification.json`. `npm test` ejecuta tanto el test de starter (`tests/starter.spec.mjs`) como la suite de validación de manifest y componentes (`tests/manifest.spec.ts`). `npm run build` valida la compilación optimizada en producción. Si el entorno tiene Bash disponible, `bash public-tests/check.sh` ejecuta una comprobación estructural adicional y de ausencia de secretos. La corrida verde de GitHub Actions es la evidencia técnica del arranque.

El Makefile del repositorio define `make verify` como equivalente directo
de `npm run verify`. Si `make` no está instalado en el entorno local, se
documenta y ejecuta el equivalente exacto:

```bash
npm run verify
```


## Flujo de trabajo del curso

1. Conserva este repositorio como el proyecto del equipo y usa el repositorio privado común en GitHub.
2. Completa únicamente los entregables de la actividad de la semana.
3. Haz cambios pequeños y descriptivos; no borres lo que ya funciona.
4. Ejecuta la verificación local y espera que GitHub Actions termine en verde.
5. Entrega en Classroom la URL del repositorio, el SHA exacto evaluado, el enlace a Actions y `evidence/individual.md`.

No uses datos reales de personas, laboratorios o estudiantes. Todo dato del starter es sintético y el formulario de demostración debe llenarse únicamente con ejemplos ficticios.

## Estructura inicial

- `src/app/`: aplicación Next.js con App Router.
- `src/lib/data/`: datos sintéticos de inspecciones.
- `docs/`: plantillas de documentación de la Semana 1.
- `scripts/verify.mjs`: verificación reproducible local.
- `tests/`: prueba mínima del starter.

Las decisiones de arquitectura y las nuevas carpetas se incorporan en las actividades correspondientes; no es necesario adelantarlas.


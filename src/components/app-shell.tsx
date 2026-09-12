import type { Inspection } from "../lib/data/inspections";

export type AppShellState = "ready" | "loading" | "error" | "empty";

type AppShellProps = {
  inspections: Inspection[];
  state?: AppShellState;
  lastUpdated?: string;
};

const stateDescriptions: Record<AppShellState, string> = {
  ready: "Datos sinteticos disponibles",
  loading: "Cargando inspecciones sinteticas",
  error: "No se pudo cargar la informacion",
  empty: "Sin inspecciones para mostrar"
};

export function AppShell({
  inspections,
  state = "ready",
  lastUpdated = "2026-09-11"
}: AppShellProps) {
  const totalFindings = inspections.reduce((total, inspection) => total + inspection.findings, 0);

  return (
    <div className="app-shell">
      <header className="hero" id="inicio">
        <nav className="top-nav" aria-label="Navegación principal">
          <a href="#inicio">Inicio</a>
          <a href="#resumen">Resumen</a>
          <a href="#inspecciones">Inspecciones</a>
          <a href="#estados">Estados</a>
        </nav>

        <p className="eyebrow">Proyecto integrador · Semana 2</p>
        <h1>Inspecciones de laboratorio</h1>
        <p className="lead">
          Shell instalable para dar seguimiento al mantenimiento de laboratorios,
          preparado para trabajar con datos sinteticos y conectividad intermitente.
        </p>
        <div className="hero-actions" aria-label="Estado de instalacion">
          <span className="status-pill">Manifest activo</span>
          <span className="status-pill status-pill-light">{stateDescriptions[state]}</span>
        </div>
      </header>

      <main className="content" id="contenido">
        <section aria-labelledby="summary-heading" className="content-section" id="resumen">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Panel de control</p>
              <h2 id="summary-heading">Resumen operativo</h2>
            </div>
            <span className="count">Actualizado: {lastUpdated}</span>
          </div>

          <div className="summary-grid">
            <article className="summary-card">
              <span className="metric">{inspections.length}</span>
              <p>Inspecciones sinteticas listas para revision.</p>
            </article>
            <article className="summary-card">
              <span className="metric">{totalFindings}</span>
              <p>Hallazgos de demostracion registrados.</p>
            </article>
            <article className="summary-card">
              <span className="metric">PWA</span>
              <p>Shell con manifest, navegacion y estados base.</p>
            </article>
          </div>
        </section>

        <section aria-labelledby="inspections-heading" className="content-section" id="inspecciones">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Datos de demostracion</p>
              <h2 id="inspections-heading">Inspecciones recientes</h2>
            </div>
            <span className="count">{inspections.length} registros</span>
          </div>

          <InspectionState state={state} inspections={inspections} />
        </section>

        <section aria-labelledby="states-heading" className="content-section" id="estados">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Comportamiento critico</p>
              <h2 id="states-heading">Estados cubiertos</h2>
            </div>
          </div>

          <div className="state-preview-grid">
            <article className="state-preview">
              <strong>Carga</strong>
              <span>Mensaje accesible con `role="status"`.</span>
            </article>
            <article className="state-preview">
              <strong>Error</strong>
              <span>Alerta visible cuando falla la lectura.</span>
            </article>
            <article className="state-preview">
              <strong>Vacio</strong>
              <span>Respuesta clara cuando no hay registros.</span>
            </article>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Aplicaciones Web Progresivas · Universidad Tecnológica de Tehuacán</p>
      </footer>
    </div>
  );
}

function InspectionState({
  state,
  inspections
}: {
  state: AppShellState;
  inspections: Inspection[];
}) {
  if (state === "loading") {
    return (
      <section className="state-panel" role="status" aria-live="polite" aria-busy="true">
        Cargando inspecciones sinteticas para el panel de mantenimiento.
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="state-panel state-panel-error" role="alert">
        No se pudieron cargar las inspecciones. Revisa la conexion o intenta nuevamente.
      </section>
    );
  }

  if (state === "empty" || inspections.length === 0) {
    return (
      <section className="state-panel">
        No hay inspecciones sinteticas registradas para este periodo.
      </section>
    );
  }

  return (
    <div className="inspection-grid">
      {inspections.map((inspection) => (
        <article className="inspection-card" key={inspection.id}>
          <div className="card-topline">
            <span className={`badge badge-${inspection.status}`}>{inspection.statusLabel}</span>
            <span className="muted">{inspection.date}</span>
          </div>
          <h3>{inspection.location}</h3>
          <p>{inspection.summary}</p>
          <dl>
            <div>
              <dt>Responsable</dt>
              <dd>{inspection.inspector}</dd>
            </div>
            <div>
              <dt>Hallazgos</dt>
              <dd>{inspection.findings}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

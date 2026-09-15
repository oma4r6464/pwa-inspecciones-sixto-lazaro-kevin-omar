"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { inspections as syntheticInspections, type Inspection, type InspectionStatus } from "../lib/data/inspections";
import { AppShell, EmptyState, ErrorState, LoadingState } from "../components/app-shell";

type LoadStatus = "loading" | "error" | "empty" | "ready";

type NewInspectionInput = {
  location: string;
  inspector: string;
  summary: string;
  status: InspectionStatus;
};

const EMPTY_FORM: NewInspectionInput = {
  location: "",
  inspector: "",
  summary: "",
  status: "ok"
};


function loadInitialInspections(): Promise<Inspection[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(syntheticInspections), 600);
  });
}

function mockSaveInspection(
  current: Inspection[],
  input: NewInspectionInput,
  attemptNumber: number
): Promise<Inspection[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const willFail = attemptNumber % 2 === 0;
      if (willFail) {
        reject(new Error("Fallo simulado al guardar la nueva inspección"));
        return;
      }
      const newInspection: Inspection = {
        id: `inspection-demo-${Date.now()}`,
        location: input.location.trim(),
        date: new Date().toISOString().slice(0, 10),
        inspector: input.inspector.trim() || "Sin asignar",
        status: input.status,
        statusLabel: input.status === "ok" ? "Sin incidencias" : "Requiere atención",
        findings: input.status === "ok" ? 0 : 1,
        summary: input.summary.trim()
      };
      resolve([newInspection, ...current]);
    }, 1200);
  });
}

export default function HomePage() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [data, setData] = useState<Inspection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewInspectionInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const attemptCount = useRef(0);
  const pendingInput = useRef<NewInspectionInput | null>(null);

  // Carga inicial al entrar a la página.
  useEffect(() => {
    let cancelled = false;
    loadInitialInspections().then((result) => {
      if (cancelled) return;
      if (result.length === 0) {
        setStatus("empty");
      } else {
        setData(result);
        setStatus("ready");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);


  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const runSave = (input: NewInspectionInput) => {
    pendingInput.current = input;
    attemptCount.current += 1;
    setShowForm(false);
    setStatus("loading");

    mockSaveInspection(data, input, attemptCount.current)
      .then((result) => {
        setData(result);
        setStatus("ready");
        setSuccessMessage(`Inspección "${input.location.trim()}" agregada correctamente.`);
        setForm(EMPTY_FORM);
        pendingInput.current = null;
      })
      .catch(() => {
        setStatus("error");
      });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.location.trim() || !form.summary.trim()) {
      setFormError("Ubicación y resumen son obligatorios.");
      return;
    }
    setFormError(null);
    runSave(form);
  };

  const handleRetry = () => {
    if (pendingInput.current) {
      runSave(pendingInput.current);
    }
  };
  const handleClearAll = () => {
    setShowForm(false);
    setSuccessMessage(null);
    setData([]);
    setStatus("empty");
  };

  const handleRestore = () => {
    setStatus("loading");
    loadInitialInspections().then((result) => {
      setData(result);
      setStatus("ready");
    });
  };

  return (
    <AppShell>
      <div className="page-shell">
        <header className="hero">
          <p className="eyebrow">Proyecto base · Semana 2</p>
          <h1>Inspecciones de laboratorio</h1>
          <p className="lead">
            Registro de mantenimiento para trabajar con conectividad intermitente. Los datos
            mostrados y capturados en esta pantalla son sintéticos; no ingreses datos reales.
          </p>
          <span className="status">
            Estado del starter: ejecutable · App shell instalable en progreso
          </span>
        </header>

        {successMessage && (
          <div className="success-toast" role="status" aria-live="polite">
            <span className="success-toast-icon" aria-hidden="true">
              ✓
            </span>
            <span>{successMessage}</span>
          </div>
        )}

        <section aria-labelledby="inspections-heading" className="content-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Datos de demostración</p>
              <h2 id="inspections-heading">Inspecciones recientes</h2>
            </div>
            <div className="section-heading-actions">
              {status === "ready" ? <span className="count">{data.length} registros</span> : null}
              <button
                type="button"
                className="add-inspection-button"
                onClick={() => setShowForm((open) => !open)}
                disabled={status === "loading"}
              >
                {showForm ? "Cancelar" : "+ Agregar inspección"}
              </button>
            </div>
          </div>

          {showForm && (
            <form className="add-inspection-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label htmlFor="location">Ubicación sintética *</label>
                <input
                  id="location"
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Laboratorio Demo 01"
                />
              </div>
              <div className="form-row">
                <label htmlFor="inspector">Responsable sintético</label>
                <input
                  id="inspector"
                  type="text"
                  value={form.inspector}
                  onChange={(e) => setForm({ ...form, inspector: e.target.value })}
                  placeholder="Técnica Demo"
                />
              </div>
              <div className="form-row">
                <label htmlFor="status">Estado</label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as InspectionStatus })}
                >
                  <option value="ok">Sin incidencias</option>
                  <option value="attention">Requiere atención</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="summary">Resumen *</label>
                <textarea
                  id="summary"
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Descripción sintética de lo revisado"
                  rows={2}
                />
              </div>
              {formError && <p className="form-error">{formError}</p>}
              <button type="submit" className="add-inspection-submit">
                Guardar inspección
              </button>
            </form>
          )}

          {status === "loading" && <LoadingState />}

          {status === "error" && <ErrorState onRetry={handleRetry} />}

          {status === "empty" && (
            <EmptyState actionLabel="Restaurar datos sintéticos" onAction={handleRestore} />
          )}

          {status === "ready" && (
            <>
              <div className="inspection-grid">
                {data.map((inspection) => (
                  <article className="inspection-card" key={inspection.id}>
                    <div className="card-topline">
                      <span className={`badge badge-${inspection.status}`}>
                        {inspection.statusLabel}
                      </span>
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
              <button type="button" className="clear-all-link" onClick={handleClearAll}>
                Vaciar lista (demostración del estado vacío)
              </button>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

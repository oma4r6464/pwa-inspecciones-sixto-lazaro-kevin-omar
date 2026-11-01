"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { inspections as syntheticInspections, type Inspection, type InspectionStatus } from "../lib/data/inspections";
import { validateInspectionCapture } from "../lib/validation/inspection-capture";
import { createSafeErrorContext, type SafeErrorContext } from "../lib/security/safe-error";
import { AppShell, EmptyState, ErrorState, LoadingState } from "../components/app-shell";
import { CapabilityControls } from "../components/capability-controls";
import {
  newInspectionId,
  openInspectionStore,
  toViewInspection,
  type InspectionStore
} from "../lib/sync/inspection-store";
import { syntheticRemoteSend } from "../lib/sync/synthetic-remote";

type LoadStatus = "loading" | "error" | "empty" | "ready";
type SyncState = "pending" | "synced";

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

export default function HomePage() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [data, setData] = useState<Inspection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewInspectionInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<SafeErrorContext | null>(null);
  const [syncError, setSyncError] = useState<SafeErrorContext | null>(null);
  const [storageError, setStorageError] = useState<SafeErrorContext | null>(null);
  const [syncState, setSyncState] = useState<Record<string, SyncState>>({});
  const store = useRef<InspectionStore | null>(null);
  const pendingInput = useRef<NewInspectionInput | null>(null);
  const pendingId = useRef<string | null>(null);

  const runSync = useCallback(async () => {
    const current = store.current;
    if (!current || !navigator.onLine) return;
    try {
      const result = await current.synchronize(true, syntheticRemoteSend);
      if (result.failed.length > 0) {
        setSyncError(
          createSafeErrorContext({
            incidentId: "inspection-sync",
            correlationId: "sync-local"
          })
        );
      } else {
        setSyncError(null);
      }
      if (result.synchronized.length === 0) return;
      setSyncState((prev) => {
        const next = { ...prev };
        result.synchronized.forEach((id) => {
          next[id] = "synced";
        });
        return next;
      });
    } catch {
      setSyncError(
        createSafeErrorContext({
          incidentId: "inspection-sync",
          correlationId: "sync-local"
        })
      );
    }
  }, []);

  // Carga inicial: datos sintéticos + inspecciones pendientes guardadas en IndexedDB.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const base = await loadInitialInspections();
      let opened: InspectionStore | null = null;
      try {
        opened = await openInspectionStore(window.indexedDB);
      } catch {
        setStorageError(
          createSafeErrorContext({
            incidentId: "inspection-storage",
            correlationId: "storage-local"
          })
        );
        opened = null;
      }
      if (cancelled) {
        opened?.close();
        return;
      }
      if (opened) setStorageError(null);
      store.current = opened;
      const queued = opened ? opened.pending() : [];
      setSyncState(Object.fromEntries(queued.map((item) => [item.id, "pending" as SyncState])));
      const all = [...queued.map(toViewInspection), ...base];
      setData(all);
      setStatus(all.length === 0 ? "empty" : "ready");
      void runSync();
    })();
    return () => {
      cancelled = true;
      store.current?.close();
      store.current = null;
    };
  }, [runSync]);

  // Al recuperar la conexión se drena la cola pendiente.
  useEffect(() => {
    window.addEventListener("online", runSync);
    return () => window.removeEventListener("online", runSync);
  }, [runSync]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const saveInspection = async (input: NewInspectionInput, id: string): Promise<Inspection> => {
    const current = store.current;
    if (!current) throw new Error("Almacenamiento local no disponible");
    const item = await current.save(id, {
      result: input.status,
      notes: input.summary,
      location: input.location,
      inspector: input.inspector,
      date: new Date().toISOString().slice(0, 10),
      findings: input.status === "ok" ? 0 : 1
    });
    return toViewInspection(item);
  };

  const runSave = (input: NewInspectionInput) => {
    pendingInput.current = input;
    // La misma captura conserva su id al reintentar: es la clave de idempotencia.
    if (!pendingId.current) pendingId.current = newInspectionId();
    setShowForm(false);
    setStatus("loading");

    saveInspection(input, pendingId.current)
      .then((inspection) => {
        setSaveError(null);
        setData((current) => [inspection, ...current.filter((item) => item.id !== inspection.id)]);
        setSyncState((prev) => ({ ...prev, [inspection.id]: "pending" }));
        setStatus("ready");
        setSuccessMessage(`Inspección "${input.location.trim()}" agregada correctamente.`);
        setForm(EMPTY_FORM);
        pendingInput.current = null;
        pendingId.current = null;
        void runSync();
      })
      .catch(() => {
        setSaveError(
          createSafeErrorContext({
            incidentId: "inspection-save",
            correlationId: pendingId.current ?? "save-local"
          })
        );
        setStatus("error");
      });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateInspectionCapture(form);
    if (!validation.valid) {
      setFormError("Revisa los campos: hay valores vacíos, demasiado largos o no permitidos.");
      return;
    }
    setFormError(null);
    runSave(validation.value);
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
      const queued = store.current ? store.current.pending().map(toViewInspection) : [];
      setData([...queued, ...result]);
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

        {storageError && (
          <div className="form-error" role="alert">
            El almacenamiento local no está disponible. No se pueden guardar capturas ahora.
            {" "}Referencia: {storageError.incidentId}
          </div>
        )}
        {syncError && (
          <div className="form-error" role="alert">
            No se pudo completar la sincronización. Los registros no sincronizados siguen en la
            cola local. {" "}Referencia: {syncError.incidentId}
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
              <CapabilityControls />
              <button type="submit" className="add-inspection-submit">
                Guardar inspección
              </button>
            </form>
          )}

          {status === "loading" && <LoadingState />}

          {status === "error" && (
            <ErrorState
              title="No se pudo guardar la inspección"
              description={`La captura no se guardó. Puedes reintentar sin volver a llenar el formulario. Referencia: ${
                saveError?.incidentId ?? "inspection-save"
              }`}
              onRetry={handleRetry}
            />
          )}

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
                    {syncState[inspection.id] && (
                      <p
                        className="muted"
                        data-inspection-id={inspection.id}
                        data-sync-status={syncState[inspection.id]}
                      >
                        {syncState[inspection.id] === "pending"
                          ? "Pendiente de sincronizar"
                          : "Sincronizada"}
                      </p>
                    )}
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
                    <Link href={`/inspecciones/${inspection.id}`} className="detail-link">
                      Ver detalle →
                    </Link>
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
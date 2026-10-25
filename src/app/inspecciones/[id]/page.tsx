import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { inspections } from "../../../lib/data/inspections";
import { AppShell } from "../../../components/app-shell";

type InspectionDetailPageProps = {
  params: { id: string };
};

function findInspection(id: string) {
  return inspections.find((item) => item.id === id);
}

export function generateMetadata({ params }: InspectionDetailPageProps): Metadata {
  const inspection = findInspection(params.id);

  if (!inspection) {
    return { title: "Inspección no encontrada" };
  }

  return {
    title: `${inspection.location} · Detalle de inspección`,
    description: inspection.summary
  };
}

export default function InspectionDetailPage({ params }: InspectionDetailPageProps) {
  const inspection = findInspection(params.id);

  if (!inspection) {
    notFound();
  }

  return (
    <AppShell>
      <div className="page-shell">
        <Link href="/" className="detail-back-link">
          ← Volver a inspecciones
        </Link>

        <header className="detail-hero">
          <p className="eyebrow">Detalle de inspección · Semana 4</p>
          <h1>{inspection.location}</h1>
          <span className={`badge badge-${inspection.status}`}>{inspection.statusLabel}</span>
        </header>

        <section aria-labelledby="detail-heading" className="content-section">
          <h2 id="detail-heading" className="sr-only">
            Información de la inspección
          </h2>

          <div className="detail-card">
            <dl className="detail-meta">
              <div>
                <dt>Ubicación</dt>
                <dd>{inspection.location}</dd>
              </div>
              <div>
                <dt>Responsable</dt>
                <dd>{inspection.inspector}</dd>
              </div>
              <div>
                <dt>Fecha</dt>
                <dd>{inspection.date}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{inspection.statusLabel}</dd>
              </div>
              <div>
                <dt>Hallazgos</dt>
                <dd>{inspection.findings}</dd>
              </div>
            </dl>

            <div className="detail-summary">
              <h3>Resumen</h3>
              <p>{inspection.summary}</p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
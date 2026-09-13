"use client";

import { ReactNode, useState } from "react";

/**
 * Shell instalable de la app (Semana 2).
 *
 * Decisión: se implementa como un componente cliente porque la navegación
 * (menú hamburguesa en móvil) requiere estado local. El layout raíz
 * (src/app/layout.tsx) sigue siendo un server component; solo el shell
 * visual necesita interactividad.
 */

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Inspecciones", href: "/#inspections-heading" }
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <a className="app-shell-brand" href="/">
          <span className="app-shell-logo" aria-hidden="true">
            IL
          </span>
          <span className="app-shell-title">Inspecciones de laboratorio</span>
        </a>

        <button
          type="button"
          className="app-shell-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="app-shell-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">☰</span>
          <span className="sr-only">Abrir menú de navegación</span>
        </button>

        <nav
          id="app-shell-nav"
          className={`app-shell-nav${menuOpen ? " is-open" : ""}`}
          aria-label="Navegación principal"
        >
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="app-shell-main">{children}</main>

      <footer className="app-shell-footer">
        <p>Aplicaciones Web Progresivas · Universidad Tecnológica de Tehuacán</p>
      </footer>
    </div>
  );
}

type StateMessageProps = {
  title?: string;
  description?: string;
};

export function LoadingState({
  title = "Cargando inspecciones…",
  description = "Estamos preparando los datos sintéticos."
}: StateMessageProps) {
  return (
    <div className="state-panel state-loading" role="status" aria-live="polite">
      <span className="state-spinner" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

type ErrorStateProps = StateMessageProps & { onRetry?: () => void };

export function ErrorState({
  title = "No se pudieron cargar las inspecciones",
  description = "Ocurrió un error al obtener los datos. Intenta de nuevo.",
  onRetry
}: ErrorStateProps) {
  return (
    <div className="state-panel state-error" role="alert">
      <span className="state-icon" aria-hidden="true">
        ⚠
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {onRetry ? (
        <button type="button" className="state-retry" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

type EmptyStateProps = StateMessageProps & { actionLabel?: string; onAction?: () => void };

export function EmptyState({
  title = "Sin inspecciones registradas",
  description = "Cuando se agreguen inspecciones sintéticas aparecerán aquí.",
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <div className="state-panel state-empty">
      <span className="state-icon" aria-hidden="true">
        🗂
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {onAction ? (
        <button type="button" className="state-retry" onClick={onAction}>
          {actionLabel ?? "Restaurar"}
        </button>
      ) : null}
    </div>
  );
}
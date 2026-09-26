export type SafeErrorContext = {
  incidentId: string;
  correlationId: string;
  status: number;
  attempt: number;
  durationMs: number;
};

type ErrorContextInput = Partial<SafeErrorContext>;

function safeId(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || fallback;
}

function safeNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

export function createSafeErrorContext(input: ErrorContextInput = {}): SafeErrorContext {
  return {
    incidentId: safeId(input.incidentId, "incident-local"),
    correlationId: safeId(input.correlationId, "correlation-local"),
    status: safeNumber(input.status, 500),
    attempt: safeNumber(input.attempt, 1),
    durationMs: safeNumber(input.durationMs, 0)
  };
}
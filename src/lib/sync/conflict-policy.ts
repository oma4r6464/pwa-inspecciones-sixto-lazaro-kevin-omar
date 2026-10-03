/**
 * Política determinista de conflictos y reintentos (Semana 5).
 *
 * Todo son funciones puras: no leen reloj, red ni almacenamiento. El "ahora" y la
 * versión remota simulada se reciben como parámetros, así el comportamiento es
 * reproducible en pruebas y explicable desde docs/sync-policy.md.
 */
import type { InspectionData } from "../storage/schema";

/* ------------------------------------------------------------------ */
/* Conflictos entre versión local y versión remota simulada            */
/* ------------------------------------------------------------------ */

export type VersionedInspection = {
  id: string;
  /** Contador monotónico por inspección. */
  version: number;
  /** Milisegundos epoch de la última edición. */
  updatedAt: number;
  data: InspectionData;
};

export type ConflictAction = "noop" | "keep-local" | "accept-remote" | "merge";

export type ConflictDecision = {
  action: ConflictAction;
  /** Versión resultante que debe quedar guardada (y, si hace falta, enviarse). */
  result: VersionedInspection;
  reason: string;
  /** Campos cuyo valor de la versión perdedora se descartó (trazabilidad). */
  discarded: string[];
};

/** Serialización estable (llaves ordenadas) para comparar datos sin depender del orden. */
export function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .sort()
      .filter((key) => record[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function isSameData(a: InspectionData, b: InspectionData): boolean {
  return canonicalize(a) === canonicalize(b);
}

/** Orden total: versión, luego updatedAt, luego contenido canónico (desempate fijo). */
function compareVersions(a: VersionedInspection, b: VersionedInspection): number {
  if (a.version !== b.version) return a.version - b.version;
  if (a.updatedAt !== b.updatedAt) return a.updatedAt - b.updatedAt;
  const ca = canonicalize(a.data);
  const cb = canonicalize(b.data);
  return ca === cb ? 0 : ca < cb ? -1 : 1;
}

function mergeData(winner: InspectionData, loser: InspectionData) {
  const merged: InspectionData = { ...loser };
  for (const [key, value] of Object.entries(winner)) {
    if (value !== undefined) merged[key] = value;
  }

  // "notes" es texto libre: si la perdedora tenía otra nota, se conserva en vez de perderla.
  const loserNotes = typeof loser.notes === "string" ? loser.notes.trim() : "";
  const winnerNotes = typeof winner.notes === "string" ? winner.notes : "";
  if (loserNotes && !winnerNotes.includes(loserNotes)) {
    merged.notes = winnerNotes
      ? `${winnerNotes}\n[versión anterior] ${loserNotes}`
      : loserNotes;
  }

  const discarded = Object.keys(winner)
    .filter(
      (key) =>
        key !== "notes" &&
        winner[key] !== undefined &&
        loser[key] !== undefined &&
        canonicalize(winner[key]) !== canonicalize(loser[key])
    )
    .sort();

  return { merged, discarded, changed: !isSameData(merged, winner) };
}

/**
 * Decide qué hacer cuando existe una versión local y una remota de la misma inspección.
 *
 * Es simétrica: resolveConflict(a, b).result equivale a resolveConflict(b, a).result,
 * por lo que dos dispositivos que reciban la versión del otro convergen al mismo estado.
 */
export function resolveConflict(
  local: VersionedInspection,
  remote: VersionedInspection
): ConflictDecision {
  if (local.id !== remote.id) {
    throw new Error("resolveConflict: las versiones deben pertenecer a la misma inspección");
  }

  const order = compareVersions(local, remote);
  if (order === 0) {
    return { action: "noop", result: local, reason: "versiones idénticas", discarded: [] };
  }

  const localWins = order > 0;
  const winner = localWins ? local : remote;
  const loser = localWins ? remote : local;
  const { merged, discarded, changed } = mergeData(winner.data, loser.data);

  if (!changed) {
    return {
      action: localWins ? "keep-local" : "accept-remote",
      result: winner,
      reason: localWins ? "la versión local es más reciente" : "la versión remota es más reciente",
      discarded
    };
  }

  return {
    action: "merge",
    result: {
      id: local.id,
      version: Math.max(local.version, remote.version) + 1,
      updatedAt: Math.max(local.updatedAt, remote.updatedAt),
      data: merged
    },
    reason: "se conservó información de la versión perdedora; la versión fusionada debe sincronizarse",
    discarded
  };
}

/* ------------------------------------------------------------------ */
/* Idempotencia y respuestas fuera de orden                            */
/* ------------------------------------------------------------------ */

/** Llave estable de una operación de envío: misma inspección + misma versión = misma operación. */
export function operationKey(id: string, version: number): string {
  return `${id}@v${version}`;
}

export type ResponseVerdict = "apply" | "duplicate" | "stale";

/**
 * Decide si una respuesta remota debe aplicarse.
 * - apply: trae una versión mayor a la ya procesada.
 * - duplicate: misma versión ya procesada (operación repetida).
 * - stale: versión menor (llegó fuera de orden, tarde).
 */
export function shouldApplyResponse(
  lastRemoteVersion: number | undefined,
  incomingVersion: number
): ResponseVerdict {
  if (lastRemoteVersion === undefined || incomingVersion > lastRemoteVersion) return "apply";
  return incomingVersion === lastRemoteVersion ? "duplicate" : "stale";
}

/* ------------------------------------------------------------------ */
/* Reintentos seguros                                                  */
/* ------------------------------------------------------------------ */

export type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000
};

export type FailureKind = "temporary" | "conflict" | "permanent";

/** Clasifica un fallo por código HTTP simulado. Sin código (undefined/0) se asume fallo de red. */
export function classifyFailure(status?: number): FailureKind {
  if (status === undefined || status === 0) return "temporary";
  if (status === 408 || status === 425 || status === 429 || status >= 500) return "temporary";
  if (status === 409 || status === 412) return "conflict";
  return "permanent";
}

/** Espera exponencial sin aleatoriedad (reproducible): base * 2^(intento-1), con tope. */
export function nextBackoffMs(attempts: number, policy: RetryPolicy = DEFAULT_RETRY_POLICY): number {
  const exponent = Math.max(0, Math.floor(attempts) - 1);
  return Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** exponent);
}

export type RetryDecision = {
  retry: boolean;
  reason: "retry-scheduled" | "max-attempts" | "permanent-failure" | "needs-reconcile";
  nextAttemptAt?: number;
};

export function decideRetry(
  input: { attempts: number; status?: number; now: number },
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): RetryDecision {
  const kind = classifyFailure(input.status);
  if (kind === "permanent") return { retry: false, reason: "permanent-failure" };
  // Un 409/412 no se reintenta a ciegas: primero se reconcilia con resolveConflict.
  if (kind === "conflict") return { retry: false, reason: "needs-reconcile" };
  if (input.attempts >= policy.maxAttempts) return { retry: false, reason: "max-attempts" };
  return {
    retry: true,
    reason: "retry-scheduled",
    nextAttemptAt: input.now + nextBackoffMs(input.attempts, policy)
  };
}

import type { InspectionPayload, InspectionRecord } from "../storage/schema";

export type VersionedInspection = {
  id: string;
  version: number;
  updatedAt: number;
  payload: InspectionPayload;
};

export type ConflictAction = "noop" | "keep-local" | "accept-remote" | "merge";

export type ConflictDecision = {
  action: ConflictAction;
  result: VersionedInspection;
  reason: string;
  discarded: string[];
};

export type FailureKind = "temporary" | "conflict" | "permanent";

export type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

export type RetryDecision = {
  retry: boolean;
  reason: "retry-scheduled" | "max-attempts" | "permanent-failure" | "needs-reconcile";
  nextAttemptAt?: number;
};

export type ResponseVerdict = "apply" | "duplicate" | "stale";

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000
};

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

export function isSamePayload(a: InspectionPayload, b: InspectionPayload): boolean {
  return canonicalize(a) === canonicalize(b);
}

function compareVersions(a: VersionedInspection, b: VersionedInspection): number {
  if (a.version !== b.version) return a.version - b.version;
  if (a.updatedAt !== b.updatedAt) return a.updatedAt - b.updatedAt;
  const left = canonicalize(a.payload);
  const right = canonicalize(b.payload);
  return left === right ? 0 : left < right ? -1 : 1;
}

function cloneVersioned(inspection: VersionedInspection): VersionedInspection {
  return { ...inspection, payload: { ...inspection.payload } };
}

function mergePayload(winner: InspectionPayload, loser: InspectionPayload) {
  const merged: InspectionPayload = { ...loser, ...winner };
  const loserNotes = typeof loser.notes === "string" ? loser.notes.trim() : "";
  const winnerNotes = typeof winner.notes === "string" ? winner.notes : "";

  if (loserNotes && !winnerNotes.includes(loserNotes)) {
    merged.notes = winnerNotes ? `${winnerNotes}\n[version anterior] ${loserNotes}` : loserNotes;
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

  return { merged, discarded, changed: !isSamePayload(merged, winner) };
}

export function resolveConflict(
  local: VersionedInspection,
  remote: VersionedInspection
): ConflictDecision {
  if (local.id !== remote.id) {
    throw new Error("resolveConflict: las versiones deben pertenecer a la misma inspeccion");
  }

  const order = compareVersions(local, remote);
  if (order === 0) {
    return {
      action: "noop",
      result: cloneVersioned(local),
      reason: "versiones identicas",
      discarded: []
    };
  }

  const localWins = order > 0;
  const winner = localWins ? local : remote;
  const loser = localWins ? remote : local;
  const { merged, discarded, changed } = mergePayload(winner.payload, loser.payload);

  if (!changed) {
    return {
      action: localWins ? "keep-local" : "accept-remote",
      result: cloneVersioned(winner),
      reason: localWins ? "la version local es mas reciente" : "la version remota es mas reciente",
      discarded
    };
  }

  return {
    action: "merge",
    result: {
      id: local.id,
      version: Math.max(local.version, remote.version) + 1,
      updatedAt: Math.max(local.updatedAt, remote.updatedAt),
      payload: merged
    },
    reason: "se conservo informacion de la version perdedora",
    discarded
  };
}

export function resolveInspectionConflict(
  local: InspectionRecord,
  remote: InspectionRecord
): InspectionRecord {
  const decision = resolveConflict(
    { id: local.id, version: local.version ?? 1, updatedAt: local.updatedAt, payload: local.payload },
    { id: remote.id, version: remote.version ?? 1, updatedAt: remote.updatedAt, payload: remote.payload }
  );

  return {
    id: decision.result.id,
    updatedAt: decision.result.updatedAt,
    version: decision.result.version,
    payload: { ...decision.result.payload }
  };
}

export function operationKey(id: string, version: number): string {
  return `${id}@v${version}`;
}

export function shouldApplyResponse(
  lastRemoteVersion: number | undefined,
  incomingVersion: number
): ResponseVerdict {
  if (lastRemoteVersion === undefined || incomingVersion > lastRemoteVersion) return "apply";
  return incomingVersion === lastRemoteVersion ? "duplicate" : "stale";
}

export function classifyFailure(status?: number): FailureKind {
  if (status === undefined || status === 0) return "temporary";
  if (status === 408 || status === 425 || status === 429 || status >= 500) return "temporary";
  if (status === 409 || status === 412) return "conflict";
  return "permanent";
}

export function nextBackoffMs(attempts: number, policy: RetryPolicy = DEFAULT_RETRY_POLICY): number {
  const exponent = Math.max(0, Math.floor(attempts) - 1);
  return Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** exponent);
}

export function decideRetry(
  input: { attempts: number; status?: number; now: number },
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): RetryDecision {
  const kind = classifyFailure(input.status);
  if (kind === "permanent") return { retry: false, reason: "permanent-failure" };
  if (kind === "conflict") return { retry: false, reason: "needs-reconcile" };
  if (input.attempts >= policy.maxAttempts) return { retry: false, reason: "max-attempts" };
  return {
    retry: true,
    reason: "retry-scheduled",
    nextAttemptAt: input.now + nextBackoffMs(input.attempts, policy)
  };
}

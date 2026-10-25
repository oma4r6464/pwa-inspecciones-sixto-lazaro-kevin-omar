export type InspectionPayload = {
  result: string;
  notes?: string;
  [key: string]: unknown;
};

export type InspectionRecord = {
  id: string;
  updatedAt: number;
  payload: InspectionPayload;
  version?: number;
};

export type QueuedInspection = InspectionRecord & {
  attempts: number;
  queuedAt: number;
  lastAttempt?: number;
  error?: string;
  lastRemoteVersion?: number;
  nextAttemptAt?: number;
  retryable?: boolean;
};

export function createInspectionRecord(
  id: string,
  payload: InspectionPayload,
  updatedAt: number,
  version = 1
): InspectionRecord {
  if (!id || !Number.isFinite(updatedAt) || !Number.isInteger(version) || version < 1) {
    throw new Error("Una inspeccion requiere id, updatedAt y version validos");
  }

  return { id, payload: { ...payload }, updatedAt, version };
}

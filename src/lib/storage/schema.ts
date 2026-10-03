export type InspectionPayload = {
  result: string;
  notes?: string;
};

export type InspectionRecord = {
  id: string;
  updatedAt: number;
  payload: InspectionPayload;
};

export type QueuedInspection = InspectionRecord & {
  attempts: number;
  queuedAt: number;
};

export function createInspectionRecord(
  id: string,
  payload: InspectionPayload,
  updatedAt: number
): InspectionRecord {
  if (!id || !Number.isFinite(updatedAt)) {
    throw new Error("Una inspeccion requiere id y updatedAt validos");
  }

  return { id, payload: { ...payload }, updatedAt };
}

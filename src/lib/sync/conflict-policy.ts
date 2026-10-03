import type { InspectionRecord } from "../storage/schema";

export function resolveInspectionConflict(
  local: InspectionRecord,
  remote: InspectionRecord
): InspectionRecord {
  if (local.id !== remote.id) {
    throw new Error("No se pueden resolver inspecciones con ids distintos");
  }

  // A remote record wins only when it is newer. Equal timestamps keep local
  // data, making retries deterministic and avoiding an unnecessary overwrite.
  return remote.updatedAt > local.updatedAt ? { ...remote, payload: { ...remote.payload } } : {
    ...local,
    payload: { ...local.payload }
  };
}

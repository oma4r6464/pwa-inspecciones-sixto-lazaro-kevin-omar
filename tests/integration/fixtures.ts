import { IDBFactory } from "fake-indexeddb";
import { createInspectionRecord } from "../../src/lib/storage/schema";
import { IndexedDbQueueStorage } from "../../src/lib/storage/indexeddb-queue-storage";

export const SYNTHETIC_ID = "inspection-synthetic-int-01";

export function syntheticInspection(id = SYNTHETIC_ID, notes = "captura sintetica sin conexion") {
  return createInspectionRecord(
    id,
    {
      result: "attention",
      notes,
      location: "Laboratorio Demo 08",
      inspector: "Técnica Demo",
      date: "2026-10-24",
      findings: 1
    },
    1_000
  );
}

/** Cada llamada devuelve un IndexedDB nuevo y vacio: aisla los casos entre si. */
export function newIsolatedDatabase(): IDBFactory {
  return new IDBFactory();
}

export function openQueueStorage(factory: IDBFactory) {
  return IndexedDbQueueStorage.open(factory);
}
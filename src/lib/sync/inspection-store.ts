import type { Inspection } from "../data/inspections";
import { IndexedDbQueueStorage } from "../storage/indexeddb-queue-storage";
import {
  createInspectionRecord,
  type InspectionPayload,
  type QueuedInspection
} from "../storage/schema";
import { InspectionInputValidationError, validateInspectionPayload } from "../security/inspection-input";
import { InspectionSyncQueue, type SyncResult, type SyncSender } from "./queue";

export type InspectionStore = {
  save(id: string, payload: InspectionPayload, now?: number): Promise<QueuedInspection>;
  pending(): QueuedInspection[];
  synchronize(online: boolean, send: SyncSender): Promise<SyncResult>;
  close(): void;
};


export function newInspectionId(now = Date.now()): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `inspection-${now}-${random}`;
}

export function toViewInspection(item: QueuedInspection): Inspection {
  const payload = item.payload;
  const status = payload.result === "attention" ? "attention" : "ok";
  return {
    id: item.id,
    location: String(payload.location ?? ""),
    date: String(payload.date ?? ""),
    inspector: String(payload.inspector ?? "Sin asignar"),
    status,
    statusLabel: status === "ok" ? "Sin incidencias" : "Requiere atención",
    findings: Number(payload.findings ?? 0),
    summary: String(payload.notes ?? "")
  };
}


export async function openInspectionStore(factory: IDBFactory): Promise<InspectionStore> {
  const storage = await IndexedDbQueueStorage.open(factory);
  const queue = new InspectionSyncQueue(storage);
  let tail: Promise<unknown> = Promise.resolve();

  function serialize<T>(task: () => Promise<T>): Promise<T> {
    const run = tail.then(task);
    tail = run.catch(() => undefined);
    return run;
  }

  return {
    save: (id, payload, now = Date.now()) =>
      serialize(async () => {
        const validation = validateInspectionPayload(payload);
        if (!validation.valid) throw new InspectionInputValidationError(validation.issues);
        const item = queue.enqueue(createInspectionRecord(id, validation.value, now));
        await storage.flush();
        return item;
      }),
    pending: () => queue.pending(),
    synchronize: (online, send) =>
      serialize(async () => {
        const result = await queue.synchronize(online, send);
        await storage.flush();
        return result;
      }),
    close: () => storage.close()
  };
}
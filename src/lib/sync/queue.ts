import type { InspectionRecord, QueuedInspection } from "../storage/schema";

export type SyncSender = (inspection: InspectionRecord) => Promise<void>;

export type QueueStorage = {
  load(): QueuedInspection[];
  save(items: QueuedInspection[]): void;
};

export class MemoryQueueStorage implements QueueStorage {
  private items: QueuedInspection[] = [];

  load(): QueuedInspection[] {
    return this.items.map((item) => ({ ...item, payload: { ...item.payload } }));
  }

  save(items: QueuedInspection[]): void {
    this.items = items.map((item) => ({ ...item, payload: { ...item.payload } }));
  }
}

export class InspectionSyncQueue {
  private readonly storage: QueueStorage;
  private readonly maxRetries: number;

  constructor(storage: QueueStorage = new MemoryQueueStorage(), maxRetries = 3) {
    if (!Number.isInteger(maxRetries) || maxRetries < 1) {
      throw new Error("maxRetries debe ser un entero positivo");
    }
    this.storage = storage;
    this.maxRetries = maxRetries;
  }

  enqueue(inspection: InspectionRecord, queuedAt = inspection.updatedAt): void {
    const items = this.storage.load();
    const existing = items.findIndex((item) => item.id === inspection.id);
    const next: QueuedInspection = {
      ...inspection,
      payload: { ...inspection.payload },
      attempts: existing === -1 ? 0 : items[existing].attempts,
      queuedAt
    };

    if (existing === -1) items.push(next);
    else if (inspection.updatedAt >= items[existing].updatedAt) items[existing] = next;
    this.storage.save(items);
  }

  pending(): QueuedInspection[] {
    return this.storage.load();
  }

  async synchronize(
    online: boolean,
    send: SyncSender
  ): Promise<{ synchronized: string[]; failed: string[] }> {
    if (!online) return { synchronized: [], failed: this.pending().map((item) => item.id) };

    const synchronized: string[] = [];
    const failed: string[] = [];
    const remaining: QueuedInspection[] = [];

    for (const item of this.storage.load()) {
      let sent = false;
      let attempts = 0;
      while (attempts < this.maxRetries && !sent) {
        attempts += 1;
        try {
          await send(item);
          sent = true;
          synchronized.push(item.id);
        } catch {
          if (attempts >= this.maxRetries) failed.push(item.id);
        }
      }
      if (!sent) remaining.push({ ...item, attempts });
    }

    this.storage.save(remaining);
    return { synchronized, failed };
  }
}

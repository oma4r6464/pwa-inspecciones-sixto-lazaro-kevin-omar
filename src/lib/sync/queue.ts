import type { InspectionRecord, QueuedInspection } from "../storage/schema";
import {
  decideRetry,
  isSamePayload,
  shouldApplyResponse,
  type VersionedInspection,
  resolveConflict,
  type ConflictDecision
} from "./conflict-policy";

export type SyncSender = (inspection: InspectionRecord) => Promise<void>;

export type QueueStorage = {
  load(): QueuedInspection[];
  save(items: QueuedInspection[]): void;
};

export type SyncQueueStatus = "PENDING" | "IN_PROGRESS" | "SYNCED" | "FAILED";

export type SyncResult = {
  synchronized: string[];
  failed: string[];
};

export type ReconcileResult = ConflictDecision | { action: "ignored"; reason: "duplicate" | "stale" };

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

  enqueue(inspection: InspectionRecord, queuedAt = inspection.updatedAt): QueuedInspection {
    const items = this.storage.load();
    const existing = items.findIndex((item) => item.id === inspection.id);
    const previous = existing === -1 ? undefined : items[existing];
    const samePayload = previous ? isSamePayload(previous.payload, inspection.payload) : false;
    const nextVersion = previous
      ? samePayload
        ? previous.version ?? inspection.version ?? 1
        : Math.max(previous.version ?? 1, inspection.version ?? 1) + 1
      : inspection.version ?? 1;
    const next: QueuedInspection = {
      ...inspection,
      payload: { ...inspection.payload },
      version: nextVersion,
      attempts: previous?.attempts ?? 0,
      queuedAt,
      retryable: undefined,
      nextAttemptAt: undefined
    };

    if (existing === -1) items.push(next);
    else if ((inspection.updatedAt >= items[existing].updatedAt) || !samePayload) items[existing] = next;
    this.storage.save(items);
    return next;
  }

  pending(): QueuedInspection[] {
    return this.storage.load();
  }

  getById(id: string): QueuedInspection | undefined {
    return this.storage.load().find((item) => item.id === id);
  }

  readyToSync(now: number): QueuedInspection[] {
    return this.storage.load().filter(
      (item) => item.retryable !== false && (item.nextAttemptAt ?? 0) <= now
    );
  }

  markFailed(id: string, status: number | undefined, now: number, error?: string): void {
    const items = this.storage.load();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Inspection not found in queue");

    const attempts = items[index].attempts + 1;
    const decision = decideRetry({ attempts, status, now });
    items[index] = {
      ...items[index],
      attempts,
      lastAttempt: now,
      error,
      retryable: decision.retry,
      nextAttemptAt: decision.nextAttemptAt
    };
    this.storage.save(items);
  }

  async synchronize(online: boolean, send: SyncSender): Promise<SyncResult> {
    if (!online) return { synchronized: [], failed: this.pending().map((item) => item.id) };

    const synchronized: string[] = [];
    const failed: string[] = [];
    const remaining: QueuedInspection[] = [];

    for (const item of this.storage.load()) {
      let sent = false;
      let runAttempts = 0;
      while (runAttempts < this.maxRetries && !sent) {
        runAttempts += 1;
        try {
          await send(item);
          sent = true;
          synchronized.push(item.id);
        } catch {
          if (runAttempts >= this.maxRetries) failed.push(item.id);
        }
      }
      if (!sent) remaining.push({ ...item, attempts: item.attempts + runAttempts });
    }

    this.storage.save(remaining);
    return { synchronized, failed };
  }

  reconcile(localId: string, remote: VersionedInspection): ReconcileResult {
    const items = this.storage.load();
    const index = items.findIndex((item) => item.id === localId);
    if (index === -1) throw new Error("Inspection not found in queue");

    const verdict = shouldApplyResponse(items[index].lastRemoteVersion, remote.version);
    if (verdict !== "apply") return { action: "ignored", reason: verdict };

    const decision = resolveConflict(
      {
        id: items[index].id,
        version: items[index].version ?? 1,
        updatedAt: items[index].updatedAt,
        payload: items[index].payload
      },
      remote
    );

    items[index] = {
      ...items[index],
      payload: { ...decision.result.payload },
      version: decision.result.version,
      updatedAt: decision.result.updatedAt,
      lastRemoteVersion: remote.version,
      retryable: undefined,
      nextAttemptAt: undefined
    };
    this.storage.save(items);
    return decision;
  }
}

import type { QueueStorage } from "../sync/queue";
import type { QueuedInspection } from "./schema";

const DB_NAME = "pwa-inspecciones-queue";
const STORE = "queue";
const KEY = "items";

function cloneItems(items: QueuedInspection[]): QueuedInspection[] {
  return items.map((item) => ({ ...item, payload: { ...item.payload } }));
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export class IndexedDbQueueStorage implements QueueStorage {
  private items: QueuedInspection[] = [];
  private writes: Promise<void> = Promise.resolve();
  private writeError: unknown;

  private constructor(private readonly db: IDBDatabase) {}

  static async open(factory: IDBFactory, name = DB_NAME): Promise<IndexedDbQueueStorage> {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const storage = new IndexedDbQueueStorage(db);
    const tx = db.transaction(STORE, "readonly");
    const stored = await requestToPromise(tx.objectStore(STORE).get(KEY));
    storage.items = Array.isArray(stored) ? cloneItems(stored as QueuedInspection[]) : [];
    return storage;
  }

  load(): QueuedInspection[] {
    return cloneItems(this.items);
  }

  save(items: QueuedInspection[]): void {
    this.items = cloneItems(items);
    const snapshot = cloneItems(items);
    this.writes = this.writes
      .then(async () => {
        const tx = this.db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(snapshot, KEY);
        await transactionDone(tx);
      })
      .catch((error) => {
        this.writeError = error;
      });
  }

  async flush(): Promise<void> {
    await this.writes;
    if (this.writeError) {
      const error = this.writeError;
      this.writeError = undefined;
      throw error;
    }
  }

  close(): void {
    this.db.close();
  }
}
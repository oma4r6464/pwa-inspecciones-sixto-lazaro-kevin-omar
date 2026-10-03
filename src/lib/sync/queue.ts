import {
  DB_NAME,
  DB_VERSION,
  STORE_NAME,
  PendingInspection,
  InspectionData,
  SyncStatus,
} from "../storage/schema";
import {
  ConflictDecision,
  VersionedInspection,
  decideRetry,
  isSameData,
  resolveConflict,
  shouldApplyResponse
} from "./conflict-policy";

export type UpdateStatusOptions = {
  /** Código HTTP simulado del fallo; decide si el reintento es seguro. */
  failureStatus?: number;
  /** Versión que el servidor confirmó al marcar SYNCED. Por defecto, la versión actual. */
  syncedVersion?: number;
};

export type ReconcileResult =
  | ConflictDecision
  | { action: "ignored"; reason: "duplicate" | "stale" };

function currentVersion(record: PendingInspection): number {
  return record.metadata.version ?? 1;
}

/**
 * Abre o crea la base de datos de IndexedDB.
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Si estamos en un entorno donde no hay IndexedDB (ej. Node test sin mock real), fallamos limpiamente o devolvemos un mock.
    if (typeof indexedDB === "undefined") {
      return reject(new Error("IndexedDB no está disponible en este entorno."));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Usamos 'id' como la llave primaria
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Cola idempotente para sincronizar inspecciones.
 */
export class SyncQueue {
  /**
   * Añade una inspección a la cola usando una llave estable (id).
   * Si ya existe una inspección con ese ID, la ignora (idempotencia)
   * o si está en estado FAILED, la actualiza a PENDING para reintento.
   */
  static async enqueue(
    id: string,
    data: InspectionData
  ): Promise<PendingInspection> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existingRecord = getRequest.result as PendingInspection | undefined;
        const now = Date.now();

        if (existingRecord) {
          const sameData = isSameData(existingRecord.data, data);

          // Mismos datos: operación repetida, no se duplica ni se toca nada (idempotencia).
          if (
            sameData &&
            (existingRecord.status === "PENDING" ||
              existingRecord.status === "IN_PROGRESS" ||
              existingRecord.status === "SYNCED")
          ) {
            resolve(existingRecord);
            return;
          }

          // Datos distintos o registro FAILED: es una edición local nueva (o un reintento manual).
          // Se conserva el mismo id (sin duplicar) y se sube la versión para no perder la edición.
          const updatedRecord: PendingInspection = {
            ...existingRecord,
            data,
            // Un registro en vuelo (IN_PROGRESS) sigue en vuelo; al confirmarse se detecta
            // que su versión quedó atrás y vuelve a PENDING (ver updateStatus).
            status: existingRecord.status === "IN_PROGRESS" ? "IN_PROGRESS" : "PENDING",
            metadata: {
              ...existingRecord.metadata,
              updatedAt: now,
              version: sameData ? currentVersion(existingRecord) : currentVersion(existingRecord) + 1,
              nextAttemptAt: undefined,
              retryable: undefined
            },
          };
          const putRequest = store.put(updatedRecord);
          putRequest.onsuccess = () => resolve(updatedRecord);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          // No existe, creamos un nuevo registro
          const newRecord: PendingInspection = {
            id,
            data,
            status: "PENDING",
            metadata: {
              createdAt: now,
              updatedAt: now,
              attempts: 0,
              version: 1,
            },
          };
          const addRequest = store.add(newRecord);
          addRequest.onsuccess = () => resolve(newRecord);
          addRequest.onerror = () => reject(addRequest.error);
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Obtiene todas las inspecciones que están pendientes o fallidas y necesitan sincronizarse.
   */
  static async getPending(): Promise<PendingInspection[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const allRecords = request.result as PendingInspection[];
        const pendingRecords = allRecords.filter(
          (r) => r.status === "PENDING" || r.status === "FAILED"
        );
        resolve(pendingRecords);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /** Lee una inspección de la cola por id (cualquier estado). */
  static async getById(id: string): Promise<PendingInspection | undefined> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result as PendingInspection | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Inspecciones listas para enviarse ahora: PENDING, o FAILED reintentable cuya espera
   * (backoff) ya venció. A diferencia de getPending(), no devuelve fallos permanentes,
   * agotados ni los que todavía están esperando.
   */
  static async getReadyToSync(now: number = Date.now()): Promise<PendingInspection[]> {
    const all = await SyncQueue.getPending();
    return all.filter(
      (r) =>
        r.status === "PENDING" ||
        (r.status === "FAILED" &&
          r.metadata.retryable !== false &&
          (r.metadata.nextAttemptAt ?? 0) <= now)
    );
  }

  /**
   * Actualiza el estado de una inspección en la cola.
   *
   * - FAILED: aplica la política de reintentos (tipo de fallo, tope de intentos, backoff).
   * - SYNCED: descarta confirmaciones repetidas o fuera de orden; si la inspección se editó
   *   mientras estaba en vuelo (versión actual > versión confirmada) vuelve a PENDING.
   */
  static async updateStatus(
    id: string,
    status: SyncStatus,
    errorMsg?: string,
    options: UpdateStatusOptions = {}
  ): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result as PendingInspection | undefined;
        if (!record) {
          return reject(new Error("Inspection not found in queue"));
        }

        const now = Date.now();

        if (status === "SYNCED") {
          const syncedVersion = options.syncedVersion ?? currentVersion(record);
          if (shouldApplyResponse(record.metadata.lastRemoteVersion, syncedVersion) !== "apply") {
            // Confirmación repetida o tardía: no cambia nada.
            resolve();
            return;
          }
          record.status = currentVersion(record) > syncedVersion ? "PENDING" : "SYNCED";
          record.metadata.lastRemoteVersion = syncedVersion;
          record.metadata.error = undefined;
          record.metadata.nextAttemptAt = undefined;
          record.metadata.retryable = undefined;
          record.metadata.updatedAt = now;
        } else {
          record.status = status;
          record.metadata.updatedAt = now;

          if (status === "FAILED") {
            record.metadata.error = errorMsg;
            record.metadata.lastAttempt = now;
            const decision = decideRetry({
              attempts: record.metadata.attempts,
              status: options.failureStatus,
              now
            });
            record.metadata.retryable = decision.retry;
            record.metadata.nextAttemptAt = decision.nextAttemptAt;
          } else if (status === "IN_PROGRESS") {
            record.metadata.lastAttempt = now;
            record.metadata.attempts += 1;
            record.metadata.error = undefined;
          }
        }

        const putRequest = store.put(record);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Reconcilia la copia local con una versión remota (simulada) usando resolveConflict.
   * Respuestas repetidas o fuera de orden se ignoran sin escribir.
   */
  static async reconcile(id: string, remote: VersionedInspection): Promise<ReconcileResult> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result as PendingInspection | undefined;
        if (!record) {
          return reject(new Error("Inspection not found in queue"));
        }

        const verdict = shouldApplyResponse(record.metadata.lastRemoteVersion, remote.version);
        if (verdict !== "apply") {
          resolve({ action: "ignored", reason: verdict });
          return;
        }

        let decision: ConflictDecision;
        try {
          decision = resolveConflict(
            {
              id: record.id,
              version: currentVersion(record),
              updatedAt: record.metadata.updatedAt,
              data: record.data
            },
            remote
          );
        } catch (error) {
          return reject(error);
        }

        const now = Date.now();
        record.data = decision.result.data;
        record.metadata.version = decision.result.version;
        record.metadata.lastRemoteVersion = remote.version;
        record.metadata.updatedAt = now;

        if (decision.action === "accept-remote" || decision.action === "noop") {
          record.status = "SYNCED";
          record.metadata.error = undefined;
          record.metadata.nextAttemptAt = undefined;
          record.metadata.retryable = undefined;
        } else if (record.status !== "IN_PROGRESS") {
          // keep-local y merge: hay una versión que el servidor aún no tiene.
          record.status = "PENDING";
          record.metadata.nextAttemptAt = undefined;
          record.metadata.retryable = undefined;
        }

        const putRequest = store.put(record);
        putRequest.onsuccess = () => resolve(decision);
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }
}

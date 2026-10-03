import {
  DB_NAME,
  DB_VERSION,
  STORE_NAME,
  PendingInspection,
  InspectionData,
  SyncStatus,
} from "../storage/schema";

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
          // Si ya existe y está pendiente, en proceso, o sincronizado, devolvemos sin duplicar.
          if (
            existingRecord.status === "PENDING" ||
            existingRecord.status === "IN_PROGRESS" ||
            existingRecord.status === "SYNCED"
          ) {
            resolve(existingRecord);
            return;
          }
          // Si está fallida, permitimos encolarla de nuevo (reintento manual/automático)
          const updatedRecord: PendingInspection = {
            ...existingRecord,
            data,
            status: "PENDING",
            metadata: {
              ...existingRecord.metadata,
              updatedAt: now,
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

  /**
   * Actualiza el estado de una inspección en la cola.
   */
  static async updateStatus(
    id: string,
    status: SyncStatus,
    errorMsg?: string
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
        record.status = status;
        record.metadata.updatedAt = now;

        if (status === "FAILED") {
          record.metadata.error = errorMsg;
          record.metadata.lastAttempt = now;
        } else if (status === "SYNCED" || status === "IN_PROGRESS") {
          if (status === "IN_PROGRESS") {
             record.metadata.lastAttempt = now;
             record.metadata.attempts += 1;
          }
          record.metadata.error = undefined;
        }

        const putRequest = store.put(record);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }
}

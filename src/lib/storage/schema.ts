export type SyncStatus = "PENDING" | "IN_PROGRESS" | "SYNCED" | "FAILED";

export interface SyncMetadata {
  createdAt: number;
  updatedAt: number;
  attempts: number;
  lastAttempt?: number;
  error?: string;
  // Semana 5: política de conflictos y reintentos (todos opcionales por compatibilidad)
  /** Versión local monotónica de la inspección (1 al crearla, +1 por cada edición). */
  version?: number;
  /** Mayor versión del lado remoto ya procesada; sirve para descartar respuestas repetidas o fuera de orden. */
  lastRemoteVersion?: number;
  /** Momento (ms epoch) a partir del cual se puede reintentar un FAILED. */
  nextAttemptAt?: number;
  /** false cuando el fallo es permanente o se agotaron los intentos. */
  retryable?: boolean;
}

// Datos sintéticos para la inspección
export interface InspectionData {
  title: string;
  inspector: string;
  date: string;
  notes: string;
  score?: number;
  [key: string]: any; // Permite propiedades adicionales
}

export interface PendingInspection {
  // Idempotency key / stable identifier
  id: string; 
  data: InspectionData;
  status: SyncStatus;
  metadata: SyncMetadata;
}

// Nombre de la base de datos y almacén en IndexedDB
export const DB_NAME = "campusops_offline_db";
export const DB_VERSION = 1;
export const STORE_NAME = "pending_inspections";

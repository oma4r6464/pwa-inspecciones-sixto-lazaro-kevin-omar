export type SyncStatus = "PENDING" | "IN_PROGRESS" | "SYNCED" | "FAILED";

export interface SyncMetadata {
  createdAt: number;
  updatedAt: number;
  attempts: number;
  lastAttempt?: number;
  error?: string;
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

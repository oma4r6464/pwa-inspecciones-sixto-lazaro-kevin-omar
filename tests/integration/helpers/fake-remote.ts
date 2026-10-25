import type { InspectionRecord } from "../../../src/lib/storage/schema";

/**
 * Transporte remoto controlado (solo para pruebas).
 * Deduplica por la clave de idempotencia (InspectionRecord.id).
 */
export class FakeRemote {
  online = true;
  receivedCalls = 0;
  private lostResponses = 0;
  private readonly records = new Map<string, InspectionRecord>();

  /** Las proximas n respuestas se pierden: el remoto guarda pero el cliente recibe error. */
  loseNextResponses(n: number): void {
    this.lostResponses = n;
  }

  send = async (inspection: InspectionRecord): Promise<void> => {
    this.receivedCalls += 1;
    if (!this.online) throw new Error("sin conexion");

    if (!this.records.has(inspection.id)) {
      this.records.set(inspection.id, {
        id: inspection.id,
        updatedAt: inspection.updatedAt,
        version: inspection.version,
        payload: { ...inspection.payload }
      });
    }

    if (this.lostResponses > 0) {
      this.lostResponses -= 1;
      throw new Error("respuesta perdida");
    }
  };

  count(): number {
    return this.records.size;
  }

  get(id: string): InspectionRecord | undefined {
    return this.records.get(id);
  }

  reset(): void {
    this.online = true;
    this.receivedCalls = 0;
    this.lostResponses = 0;
    this.records.clear();
  }
}
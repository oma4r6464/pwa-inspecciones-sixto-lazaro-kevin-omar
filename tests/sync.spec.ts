import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { SyncQueue } from "../src/lib/sync/queue";

async function runTests() {
  console.log("sync.spec.ts: running tests...");

  // Datos sintéticos
  const testId = "inspection-test-123";
  const testData = {
    title: "Test de Red",
    inspector: "ArmandoValerio",
    date: new Date().toISOString(),
    notes: "Todo en orden",
  };

  try {
    // 1. Verificar alta e idempotencia
    const item1 = await SyncQueue.enqueue(testId, testData);
    assert.strictEqual(item1.id, testId, "Debe encolar con el ID asignado");
    assert.strictEqual(item1.status, "PENDING", "El estado inicial debe ser PENDING");

    const item2 = await SyncQueue.enqueue(testId, testData);
    assert.strictEqual(item2.id, testId, "Debe devolver el mismo elemento por idempotencia");
    assert.strictEqual(item2.metadata.createdAt, item1.metadata.createdAt, "La fecha de creación no debe cambiar (idempotencia)");

    // 2. Consultar registros pendientes
    const pendingItems = await SyncQueue.getPending();
    assert.ok(pendingItems.length >= 1, "Debe existir al menos un registro pendiente");
    const found = pendingItems.find(p => p.id === testId);
    assert.ok(found, "La inspección insertada debe encontrarse al buscar pendientes");

    // 3. Transición de estado a IN_PROGRESS
    await SyncQueue.updateStatus(testId, "IN_PROGRESS");
    const pendingAfterInProgress = await SyncQueue.getPending();
    const foundInProgress = pendingAfterInProgress.find(p => p.id === testId);
    assert.ok(!foundInProgress, "IN_PROGRESS no debe retornar en getPending()");

    // 4. Transición a FAILED (reintentos de cola)
    await SyncQueue.updateStatus(testId, "FAILED", "Error de red simulado");
    const pendingAfterFailed = await SyncQueue.getPending();
    const foundFailed = pendingAfterFailed.find(p => p.id === testId);
    assert.ok(foundFailed, "FAILED debe retornar en getPending para reintentos");
    assert.strictEqual(foundFailed?.metadata.attempts, 1, "Debe aumentar el contador de intentos");
    assert.strictEqual(foundFailed?.metadata.error, "Error de red simulado", "Debe guardar el error de sincronización");

    // 5. Transición a SYNCED
    await SyncQueue.updateStatus(testId, "SYNCED");
    const pendingAfterSynced = await SyncQueue.getPending();
    const foundSynced = pendingAfterSynced.find(p => p.id === testId);
    assert.ok(!foundSynced, "SYNCED no debe retornar en getPending");

    console.log("sync.spec.ts: PASS");
  } catch (err) {
    console.error("sync.spec.ts: FAIL", err);
    process.exit(1);
  }
}

runTests();

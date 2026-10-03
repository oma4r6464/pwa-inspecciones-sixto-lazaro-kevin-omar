import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { SyncQueue } from "../src/lib/sync/queue";
import {
  DEFAULT_RETRY_POLICY,
  VersionedInspection,
  classifyFailure,
  decideRetry,
  nextBackoffMs,
  operationKey,
  resolveConflict,
  shouldApplyResponse
} from "../src/lib/sync/conflict-policy";

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

// ---------------------------------------------------------------------------
// Semana 5: política de conflictos, reintentos e idempotencia
// ---------------------------------------------------------------------------

function version(
  id: string,
  v: number,
  updatedAt: number,
  data: Record<string, unknown> = {}
): VersionedInspection {
  return {
    id,
    version: v,
    updatedAt,
    data: { title: "Redes", inspector: "Técnica A", date: "2026-10-03", notes: "ok", ...data }
  };
}

function inspection(overrides: Record<string, unknown> = {}) {
  return { title: "Redes", inspector: "Técnica A", date: "2026-10-03", notes: "ok", ...overrides };
}

function runConflictPolicyTests() {
  // Conflicto: gana la versión más alta, local o remota.
  const remoteNewer = resolveConflict(version("a", 1, 100), version("a", 2, 50, { score: 9 }));
  assert.equal(remoteNewer.action, "accept-remote");
  assert.equal(remoteNewer.result.version, 2);

  const localNewer = resolveConflict(version("a", 3, 100), version("a", 2, 500));
  assert.equal(localNewer.action, "keep-local");
  assert.equal(localNewer.result.version, 3);

  // Misma versión: desempata updatedAt; idénticas: noop.
  assert.equal(resolveConflict(version("a", 2, 100), version("a", 2, 200)).action, "accept-remote");
  assert.equal(resolveConflict(version("a", 2, 100), version("a", 2, 100)).action, "noop");

  // Un campo escalar distinto se descarta pero queda registrado, sin fusionar.
  const scalar = resolveConflict(version("a", 1, 100, { score: 5 }), version("a", 2, 100, { score: 8 }));
  assert.equal(scalar.action, "accept-remote");
  assert.deepEqual(scalar.discarded, ["score"]);

  // Conserva información: notas distintas y campos exclusivos de la perdedora se fusionan.
  const merge = resolveConflict(
    version("a", 2, 100, { notes: "nota local", extra: "solo-local" }),
    version("a", 3, 90, { notes: "nota remota" })
  );
  assert.equal(merge.action, "merge");
  assert.equal(merge.result.version, 4, "la fusión sube la versión para poder sincronizarse");
  assert.equal(merge.result.data.extra, "solo-local");
  assert.match(String(merge.result.data.notes), /nota remota/);
  assert.match(String(merge.result.data.notes), /nota local/);

  // Determinismo y convergencia: el resultado no depende de quién sea "local".
  assert.deepEqual(
    resolveConflict(version("a", 2, 100, { notes: "nota local" }), version("a", 3, 90, { notes: "nota remota" })).result,
    resolveConflict(version("a", 3, 90, { notes: "nota remota" }), version("a", 2, 100, { notes: "nota local" })).result
  );
  assert.deepEqual(
    resolveConflict(version("a", 2, 100), version("a", 3, 90)),
    resolveConflict(version("a", 2, 100), version("a", 3, 90))
  );

  // No mezcla inspecciones distintas.
  assert.throws(() => resolveConflict(version("a", 1, 1), version("b", 1, 1)));
}

function runRetryPolicyTests() {
  assert.equal(classifyFailure(undefined), "temporary");
  assert.equal(classifyFailure(0), "temporary");
  assert.equal(classifyFailure(503), "temporary");
  assert.equal(classifyFailure(429), "temporary");
  assert.equal(classifyFailure(409), "conflict");
  assert.equal(classifyFailure(400), "permanent");
  assert.equal(classifyFailure(404), "permanent");

  // Backoff exponencial, reproducible y con tope.
  assert.deepEqual([1, 2, 3, 4].map((n) => nextBackoffMs(n)), [1000, 2000, 4000, 8000]);
  assert.equal(nextBackoffMs(20), DEFAULT_RETRY_POLICY.maxDelayMs);
  assert.equal(nextBackoffMs(3), nextBackoffMs(3));

  const temporary = decideRetry({ attempts: 2, status: 503, now: 10_000 });
  assert.deepEqual(temporary, { retry: true, reason: "retry-scheduled", nextAttemptAt: 12_000 });
  assert.equal(decideRetry({ attempts: DEFAULT_RETRY_POLICY.maxAttempts, status: 503, now: 0 }).reason, "max-attempts");
  assert.equal(decideRetry({ attempts: 1, status: 400, now: 0 }).retry, false);
  assert.equal(decideRetry({ attempts: 1, status: 409, now: 0 }).reason, "needs-reconcile");

  // Idempotencia / orden de respuestas.
  assert.equal(operationKey("inspection-1", 3), "inspection-1@v3");
  assert.equal(shouldApplyResponse(undefined, 1), "apply");
  assert.equal(shouldApplyResponse(2, 3), "apply");
  assert.equal(shouldApplyResponse(3, 3), "duplicate");
  assert.equal(shouldApplyResponse(3, 2), "stale");
}

async function runQueuePolicyTests() {
  // Reintento: reencolar la misma inspección tras fallos no genera registros nuevos.
  const retryId = "w5-retry";
  await SyncQueue.enqueue(retryId, inspection());
  for (let i = 0; i < 3; i++) {
    await SyncQueue.updateStatus(retryId, "IN_PROGRESS");
    await SyncQueue.updateStatus(retryId, "FAILED", "503 simulado", { failureStatus: 503 });
    await SyncQueue.enqueue(retryId, inspection());
  }
  const copies = (await SyncQueue.getPending()).filter((r) => r.id === retryId);
  assert.equal(copies.length, 1, "los reintentos no duplican la inspección");
  assert.equal(copies[0].metadata.version, 1, "mismos datos no cambian la versión");

  // Backoff: un FAILED temporal no está listo hasta que vence nextAttemptAt.
  const backoffId = "w5-backoff";
  await SyncQueue.enqueue(backoffId, inspection());
  await SyncQueue.updateStatus(backoffId, "IN_PROGRESS");
  await SyncQueue.updateStatus(backoffId, "FAILED", "red", { failureStatus: 503 });
  const failed = await SyncQueue.getById(backoffId);
  assert.equal(failed?.metadata.retryable, true);
  const readyAt = failed?.metadata.nextAttemptAt ?? 0;
  assert.ok(readyAt > Date.now() - 1, "debe programar un reintento futuro");
  assert.ok(!(await SyncQueue.getReadyToSync(readyAt - 1)).some((r) => r.id === backoffId));
  assert.ok((await SyncQueue.getReadyToSync(readyAt)).some((r) => r.id === backoffId));

  // Fallo permanente: nunca queda listo, pero sigue visible en getPending.
  const permanentId = "w5-permanent";
  await SyncQueue.enqueue(permanentId, inspection());
  await SyncQueue.updateStatus(permanentId, "IN_PROGRESS");
  await SyncQueue.updateStatus(permanentId, "FAILED", "datos inválidos", { failureStatus: 400 });
  assert.equal((await SyncQueue.getById(permanentId))?.metadata.retryable, false);
  assert.ok(!(await SyncQueue.getReadyToSync(Number.MAX_SAFE_INTEGER)).some((r) => r.id === permanentId));
  assert.ok((await SyncQueue.getPending()).some((r) => r.id === permanentId));

  // Tope de intentos: al llegar a maxAttempts deja de ser reintentable.
  const capId = "w5-cap";
  await SyncQueue.enqueue(capId, inspection());
  for (let i = 0; i < DEFAULT_RETRY_POLICY.maxAttempts; i++) {
    await SyncQueue.updateStatus(capId, "IN_PROGRESS");
    await SyncQueue.updateStatus(capId, "FAILED", "red", { failureStatus: 503 });
  }
  assert.equal((await SyncQueue.getById(capId))?.metadata.retryable, false);

  // Edición mientras está pendiente: misma inspección, versión nueva, datos nuevos.
  const editId = "w5-edit";
  await SyncQueue.enqueue(editId, inspection({ notes: "primera" }));
  const edited = await SyncQueue.enqueue(editId, inspection({ notes: "segunda" }));
  assert.equal(edited.metadata.version, 2);
  assert.equal(edited.data.notes, "segunda");

  // Edición durante el envío: la confirmación de la versión vieja no la marca SYNCED.
  const flightId = "w5-flight";
  await SyncQueue.enqueue(flightId, inspection({ notes: "v1" }));
  await SyncQueue.updateStatus(flightId, "IN_PROGRESS");
  await SyncQueue.enqueue(flightId, inspection({ notes: "v2" }));
  await SyncQueue.updateStatus(flightId, "SYNCED", undefined, { syncedVersion: 1 });
  let flight = await SyncQueue.getById(flightId);
  assert.equal(flight?.status, "PENDING", "la edición hecha en vuelo no se pierde");
  assert.equal(flight?.data.notes, "v2");
  await SyncQueue.updateStatus(flightId, "IN_PROGRESS");
  await SyncQueue.updateStatus(flightId, "SYNCED", undefined, { syncedVersion: 2 });
  assert.equal((await SyncQueue.getById(flightId))?.status, "SYNCED");

  // Confirmaciones repetidas o fuera de orden se ignoran.
  await SyncQueue.updateStatus(flightId, "SYNCED", undefined, { syncedVersion: 2 });
  await SyncQueue.updateStatus(flightId, "SYNCED", undefined, { syncedVersion: 1 });
  flight = await SyncQueue.getById(flightId);
  assert.equal(flight?.status, "SYNCED");
  assert.equal(flight?.metadata.lastRemoteVersion, 2);
  const duplicate = await SyncQueue.reconcile(flightId, version(flightId, 2, Date.now()));
  assert.deepEqual(duplicate, { action: "ignored", reason: "duplicate" });
  const stale = await SyncQueue.reconcile(flightId, version(flightId, 1, Date.now()));
  assert.deepEqual(stale, { action: "ignored", reason: "stale" });

  // Reconciliación contra una versión remota simulada.
  const remoteId = "w5-remote";
  await SyncQueue.enqueue(remoteId, inspection({ score: 5 }));
  const accepted = await SyncQueue.reconcile(remoteId, version(remoteId, 5, 1, { score: 7 }));
  assert.equal(accepted.action, "accept-remote");
  const acceptedRecord = await SyncQueue.getById(remoteId);
  assert.equal(acceptedRecord?.status, "SYNCED");
  assert.equal(acceptedRecord?.data.score, 7);
  assert.equal(acceptedRecord?.metadata.version, 5);

  const keepId = "w5-keep";
  await SyncQueue.enqueue(keepId, inspection({ score: 9 }));
  await SyncQueue.enqueue(keepId, inspection({ score: 10 }));
  const kept = await SyncQueue.reconcile(keepId, version(keepId, 1, 1, { score: 3 }));
  assert.equal(kept.action, "keep-local");
  assert.equal((await SyncQueue.getById(keepId))?.status, "PENDING", "la versión local aún debe enviarse");
  assert.equal((await SyncQueue.getById(keepId))?.data.score, 10);

  const mergeId = "w5-merge";
  await SyncQueue.enqueue(mergeId, inspection({ notes: "nota local" }));
  await SyncQueue.enqueue(mergeId, inspection({ notes: "nota local 2" }));
  const merged = await SyncQueue.reconcile(mergeId, version(mergeId, 3, 1, { notes: "nota remota" }));
  assert.equal(merged.action, "merge");
  const mergedRecord = await SyncQueue.getById(mergeId);
  assert.equal(mergedRecord?.status, "PENDING");
  assert.equal(mergedRecord?.metadata.version, 4);
  assert.match(String(mergedRecord?.data.notes), /nota remota/);
  assert.match(String(mergedRecord?.data.notes), /nota local 2/);
}

async function main() {
  await runTests();
  try {
    runConflictPolicyTests();
    runRetryPolicyTests();
    await runQueuePolicyTests();
    console.log("sync.spec.ts (conflicto, reintento, idempotencia): PASS");
  } catch (err) {
    console.error("sync.spec.ts (política Semana 5): FAIL", err);
    process.exit(1);
  }
}

main();

import assert from "node:assert/strict";
import { createInspectionRecord } from "../src/lib/storage/schema";
import {
  DEFAULT_RETRY_POLICY,
  classifyFailure,
  decideRetry,
  nextBackoffMs,
  operationKey,
  resolveConflict,
  resolveInspectionConflict,
  shouldApplyResponse,
  type VersionedInspection
} from "../src/lib/sync/conflict-policy";
import { InspectionSyncQueue, MemoryQueueStorage } from "../src/lib/sync/queue";

const inspection = (id: string, updatedAt: number, notes = "dato sintetico") =>
  createInspectionRecord(id, { result: "aprobada", notes }, updatedAt);

const version = (
  id: string,
  versionNumber: number,
  updatedAt: number,
  payload: Record<string, unknown> = {}
): VersionedInspection => ({
  id,
  version: versionNumber,
  updatedAt,
  payload: { result: "aprobada", notes: "dato sintetico", ...payload }
});

{
  const storage = new MemoryQueueStorage();
  const queue = new InspectionSyncQueue(storage);
  queue.enqueue(inspection("inspection-001", 100));
  let calls = 0;
  const result = await queue.synchronize(false, async () => {
    calls += 1;
  });
  assert.equal(calls, 0);
  assert.deepEqual(result, { synchronized: [], failed: ["inspection-001"] });
  assert.equal(queue.pending().length, 1);
}

{
  const queue = new InspectionSyncQueue();
  queue.enqueue(inspection("inspection-002", 200));
  const sent: string[] = [];
  const result = await queue.synchronize(true, async (item) => {
    sent.push(item.id);
  });
  assert.deepEqual(sent, ["inspection-002"]);
  assert.deepEqual(result, { synchronized: ["inspection-002"], failed: [] });
  assert.deepEqual(queue.pending(), []);
}

{
  const queue = new InspectionSyncQueue(new MemoryQueueStorage(), 3);
  queue.enqueue(inspection("inspection-003", 300));
  let attempts = 0;
  const result = await queue.synchronize(true, async () => {
    attempts += 1;
    if (attempts < 3) throw new Error("fallo temporal sintetico");
  });
  assert.equal(attempts, 3);
  assert.deepEqual(result, { synchronized: ["inspection-003"], failed: [] });
}

{
  const queue = new InspectionSyncQueue();
  queue.enqueue(inspection("inspection-004", 400));
  queue.enqueue(inspection("inspection-004", 400));
  assert.equal(queue.pending().length, 1);
  let calls = 0;
  await queue.synchronize(true, async () => {
    calls += 1;
  });
  assert.equal(calls, 1);
}

{
  const local = inspection("inspection-005", 500);
  const older = inspection("inspection-005", 499);
  const newer = inspection("inspection-005", 501);
  assert.equal(resolveInspectionConflict(local, older).updatedAt, 500);
  assert.equal(resolveInspectionConflict(local, newer).updatedAt, 501);
  assert.throws(
    () => resolveInspectionConflict(local, inspection("other-id", 501)),
    /misma inspeccion/
  );
}

{
  assert.equal(resolveConflict(version("a", 1, 100), version("a", 2, 50)).action, "accept-remote");
  assert.equal(resolveConflict(version("a", 3, 100), version("a", 2, 500)).action, "keep-local");
  assert.equal(resolveConflict(version("a", 2, 100), version("a", 2, 100)).action, "noop");
  const merged = resolveConflict(
    version("a", 2, 100, { notes: "local", extra: "solo-local" }),
    version("a", 3, 90, { notes: "remota" })
  );
  assert.equal(merged.action, "merge");
  assert.equal(merged.result.version, 4);
  assert.equal(merged.result.payload.extra, "solo-local");
  assert.match(String(merged.result.payload.notes), /local/);
  assert.match(String(merged.result.payload.notes), /remota/);
}

{
  assert.equal(classifyFailure(undefined), "temporary");
  assert.equal(classifyFailure(503), "temporary");
  assert.equal(classifyFailure(409), "conflict");
  assert.equal(classifyFailure(400), "permanent");
  assert.deepEqual([1, 2, 3, 4].map((n) => nextBackoffMs(n)), [1000, 2000, 4000, 8000]);
  assert.equal(nextBackoffMs(20), DEFAULT_RETRY_POLICY.maxDelayMs);
  assert.deepEqual(decideRetry({ attempts: 2, status: 503, now: 10_000 }), {
    retry: true,
    reason: "retry-scheduled",
    nextAttemptAt: 12_000
  });
  assert.equal(decideRetry({ attempts: DEFAULT_RETRY_POLICY.maxAttempts, status: 503, now: 0 }).reason, "max-attempts");
  assert.equal(decideRetry({ attempts: 1, status: 409, now: 0 }).reason, "needs-reconcile");
  assert.equal(operationKey("inspection-1", 3), "inspection-1@v3");
  assert.equal(shouldApplyResponse(undefined, 1), "apply");
  assert.equal(shouldApplyResponse(3, 3), "duplicate");
  assert.equal(shouldApplyResponse(3, 2), "stale");
}

{
  const queue = new InspectionSyncQueue(new MemoryQueueStorage(), 2);
  queue.enqueue(inspection("inspection-006", 600));
  let attempts = 0;
  const result = await queue.synchronize(true, async () => {
    attempts += 1;
    throw new Error("fallo temporal persistente");
  });
  assert.equal(attempts, 2);
  assert.deepEqual(result, { synchronized: [], failed: ["inspection-006"] });
  assert.equal(queue.pending()[0].attempts, 2);
  const resumed = await queue.synchronize(true, async () => undefined);
  assert.deepEqual(resumed, { synchronized: ["inspection-006"], failed: [] });
  assert.deepEqual(queue.pending(), []);
}

{
  const queue = new InspectionSyncQueue();
  queue.enqueue(inspection("inspection-007", 700, "primera"));
  const edited = queue.enqueue(inspection("inspection-007", 701, "segunda"));
  assert.equal(queue.pending().length, 1);
  assert.equal(edited.version, 2);
  queue.markFailed("inspection-007", 503, 1000, "red sintetica");
  const failed = queue.getById("inspection-007");
  assert.equal(failed?.retryable, true);
  assert.equal(failed?.nextAttemptAt, 2000);
  assert.equal(queue.readyToSync(1999).length, 0);
  assert.equal(queue.readyToSync(2000).length, 1);
}

{
  const queue = new InspectionSyncQueue();
  queue.enqueue(inspection("inspection-008", 800, "local"));
  const decision = queue.reconcile("inspection-008", version("inspection-008", 3, 801, { notes: "remota" }));
  assert.equal(decision.action, "merge");
  assert.equal(queue.getById("inspection-008")?.version, 4);
  assert.deepEqual(queue.reconcile("inspection-008", version("inspection-008", 3, 801)), {
    action: "ignored",
    reason: "duplicate"
  });
}

console.log("sync.spec.ts: PASS");

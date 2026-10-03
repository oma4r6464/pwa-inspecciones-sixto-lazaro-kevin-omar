import assert from "node:assert/strict";
import { createInspectionRecord } from "../src/lib/storage/schema";
import { resolveInspectionConflict } from "../src/lib/sync/conflict-policy";
import { InspectionSyncQueue, MemoryQueueStorage } from "../src/lib/sync/queue";

const inspection = (id: string, updatedAt: number) =>
  createInspectionRecord(id, { result: "aprobada", notes: "dato sintetico" }, updatedAt);

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
  assert.deepEqual(resolveInspectionConflict(local, older), local);
  assert.deepEqual(resolveInspectionConflict(local, newer), newer);
  assert.deepEqual(resolveInspectionConflict(local, local), local);
  assert.throws(
    () => resolveInspectionConflict(local, inspection("other-id", 501)),
    /ids distintos/
  );
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

console.log("sync.spec.ts: PASS");

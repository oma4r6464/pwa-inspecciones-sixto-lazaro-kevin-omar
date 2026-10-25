import assert from "node:assert/strict";
import test from "node:test";
import { createInspectionRecord } from "../../src/lib/storage/schema";
import { InspectionSyncQueue, MemoryQueueStorage } from "../../src/lib/sync/queue";

test("enqueuing the same inspection twice keeps one item and sends it once", async () => {
  const queue = new InspectionSyncQueue(new MemoryQueueStorage());
  const record = createInspectionRecord(
    "inspection-synthetic-08",
    { result: "aprobada", notes: "captura sintética" },
    1_000
  );

  queue.enqueue(record);
  queue.enqueue(record);

  assert.equal(queue.pending().length, 1);
  let sendCount = 0;
  const result = await queue.synchronize(true, async (item) => {
    sendCount += 1;
    assert.equal(item.id, "inspection-synthetic-08");
  });

  assert.equal(sendCount, 1);
  assert.deepEqual(result, {
    synchronized: ["inspection-synthetic-08"],
    failed: []
  });
  assert.deepEqual(queue.pending(), []);
});

test("a changed payload for the same ID updates one queued item as a new version", () => {
  const queue = new InspectionSyncQueue(new MemoryQueueStorage());
  queue.enqueue(
    createInspectionRecord(
      "inspection-synthetic-08",
      { result: "aprobada", notes: "primera captura sintética" },
      1_000
    )
  );

  const updated = queue.enqueue(
    createInspectionRecord(
      "inspection-synthetic-08",
      { result: "aprobada", notes: "edición sintética" },
      1_001
    )
  );

  assert.equal(queue.pending().length, 1);
  assert.equal(updated.version, 2);
  assert.equal(queue.getById("inspection-synthetic-08")?.payload.notes, "edición sintética");
});

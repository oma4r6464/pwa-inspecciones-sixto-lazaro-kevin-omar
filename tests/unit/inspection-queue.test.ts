import assert from "node:assert/strict";
import test from "node:test";
import { createInspectionRecord } from "../../src/lib/storage/schema";
import { InspectionSyncQueue, MemoryQueueStorage } from "../../src/lib/sync/queue";

test("enqueuing the same inspection twice keeps one item and sends it once", async () => {
  const queue = new InspectionSyncQueue(new MemoryQueueStorage());
  const record = createInspectionRecord(
    "inspection-synthetic-08",
    {
      result: "ok",
      notes: "captura sintética",
      location: "Laboratorio Demo 08",
      inspector: "Técnica Demo",
      date: "2026-10-24",
      findings: 0
    },
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
      {
        result: "ok",
        notes: "primera captura sintética",
        location: "Laboratorio Demo 08",
        inspector: "Técnica Demo",
        date: "2026-10-24",
        findings: 0
      },
      1_000
    )
  );

  const updated = queue.enqueue(
    createInspectionRecord(
      "inspection-synthetic-08",
      {
        result: "ok",
        notes: "edición sintética",
        location: "Laboratorio Demo 08",
        inspector: "Técnica Demo",
        date: "2026-10-24",
        findings: 0
      },
      1_001
    )
  );

  assert.equal(queue.pending().length, 1);
  assert.equal(updated.version, 2);
  assert.equal(queue.getById("inspection-synthetic-08")?.payload.notes, "edición sintética");
});

test("synchronization does not send invalid data already present in storage", async () => {
  const storage = new MemoryQueueStorage();
  storage.save([
    {
      id: "inspection-synthetic-invalid",
      updatedAt: 1_000,
      payload: {
        result: "invalid",
        notes: "resumen sintético",
        location: "Laboratorio Demo 08",
        inspector: "Técnica Demo",
        date: "2026-10-24",
        findings: 0
      },
      attempts: 0,
      queuedAt: 1_000
    }
  ]);
  const queue = new InspectionSyncQueue(storage);
  let sendCount = 0;

  const result = await queue.synchronize(true, async () => {
    sendCount += 1;
  });

  assert.equal(sendCount, 0);
  assert.deepEqual(result, {
    synchronized: [],
    failed: ["inspection-synthetic-invalid"]
  });
  assert.equal(queue.pending().length, 1);
});

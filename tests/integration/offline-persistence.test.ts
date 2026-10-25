import assert from "node:assert/strict";
import test from "node:test";
import { InspectionSyncQueue } from "../../src/lib/sync/queue";
import { FakeRemote } from "./helpers/fake-remote";
import { SYNTHETIC_ID, newIsolatedDatabase, openQueueStorage, syntheticInspection } from "./fixtures";

test("guardado offline sobrevive al recrear el consumidor", async () => {
  const db = newIsolatedDatabase();
  const remote = new FakeRemote();
  remote.online = false;

  const first = await openQueueStorage(db);
  new InspectionSyncQueue(first).enqueue(syntheticInspection());
  await first.flush();
  first.close();

  const second = await openQueueStorage(db);
  const recovered = new InspectionSyncQueue(second).getById(SYNTHETIC_ID);
  second.close();

  assert.ok(recovered, "la inspeccion debe leerse desde almacenamiento");
  assert.equal(recovered.payload.notes, "captura sintetica sin conexion");
  assert.equal(remote.count(), 0);
});

test("reconectar drena la operacion pendiente y la persiste vacia", async () => {
  const db = newIsolatedDatabase();
  const remote = new FakeRemote();

  const first = await openQueueStorage(db);
  new InspectionSyncQueue(first).enqueue(syntheticInspection());
  await first.flush();
  first.close();

  const second = await openQueueStorage(db);
  const queue = new InspectionSyncQueue(second);
  const result = await queue.synchronize(true, remote.send);
  await second.flush();
  second.close();

  assert.deepEqual(result, { synchronized: [SYNTHETIC_ID], failed: [] });
  assert.equal(remote.count(), 1);

  const third = await openQueueStorage(db);
  assert.deepEqual(new InspectionSyncQueue(third).pending(), []);
  third.close();
});

test("reintentar tras respuesta perdida deja exactamente un registro remoto", async () => {
  const db = newIsolatedDatabase();
  const remote = new FakeRemote();
  remote.loseNextResponses(1);

  const first = await openQueueStorage(db);
  const queue1 = new InspectionSyncQueue(first, 1);
  queue1.enqueue(syntheticInspection());
  const firstRun = await queue1.synchronize(true, remote.send);
  await first.flush();
  first.close();

  assert.deepEqual(firstRun, { synchronized: [], failed: [SYNTHETIC_ID] });
  assert.equal(remote.count(), 1, "el remoto acepto aunque la respuesta se perdio");

  const second = await openQueueStorage(db);
  const queue2 = new InspectionSyncQueue(second, 1);
  assert.equal(queue2.pending().length, 1, "la operacion sigue pendiente tras recrear");
  const secondRun = await queue2.synchronize(true, remote.send);
  await second.flush();
  second.close();

  assert.deepEqual(secondRun, { synchronized: [SYNTHETIC_ID], failed: [] });
  assert.equal(remote.receivedCalls, 2);
  assert.equal(remote.count(), 1, "la misma clave no duplica el registro remoto");
});

test("reencolar la misma inspeccion tras recrear no duplica la entrada", async () => {
  const db = newIsolatedDatabase();

  const first = await openQueueStorage(db);
  new InspectionSyncQueue(first).enqueue(syntheticInspection());
  await first.flush();
  first.close();

  const second = await openQueueStorage(db);
  const queue = new InspectionSyncQueue(second);
  queue.enqueue(syntheticInspection());
  await second.flush();
  assert.equal(queue.pending().length, 1);
  second.close();
});

test("los casos estan aislados: una base nueva no ve datos de otra", async () => {
  const dbA = newIsolatedDatabase();
  const dbB = newIsolatedDatabase();

  const a = await openQueueStorage(dbA);
  new InspectionSyncQueue(a).enqueue(syntheticInspection());
  await a.flush();
  a.close();

  const b = await openQueueStorage(dbB);
  assert.deepEqual(new InspectionSyncQueue(b).pending(), []);
  b.close();
});
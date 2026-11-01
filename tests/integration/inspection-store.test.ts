import assert from "node:assert/strict";
import test from "node:test";
import { openInspectionStore, toViewInspection } from "../../src/lib/sync/inspection-store";
import { FakeRemote } from "./helpers/fake-remote";
import { newIsolatedDatabase } from "./fixtures";

const payload = (notes: string) => ({
  result: "attention",
  notes,
  location: "Laboratorio Demo 08",
  inspector: "Tecnica Demo",
  date: "2026-10-24",
  findings: 1
});

test("el store de la interfaz recupera la captura offline tras reabrir", async () => {
  const db = newIsolatedDatabase();

  const first = await openInspectionStore(db);
  await first.save("inspection-store-01", payload("sin conexion"), 1_000);
  first.close();

  const second = await openInspectionStore(db);
  const [item] = second.pending();
  second.close();

  const view = toViewInspection(item);
  assert.equal(view.id, "inspection-store-01");
  assert.equal(view.location, "Laboratorio Demo 08");
  assert.equal(view.status, "attention");
  assert.equal(view.summary, "sin conexion");
});

test("el store rechaza una captura invalida antes de persistirla", async () => {
  const store = await openInspectionStore(newIsolatedDatabase());

  await assert.rejects(
    store.save(
      "inspection-store-invalid",
      {
        result: "attention",
        notes: " ",
        location: "Laboratorio Demo 08",
        inspector: "Técnica Demo",
        date: "2026-10-24",
        findings: 1
      },
      1_000
    ),
    { name: "InspectionInputValidationError" }
  );
  assert.deepEqual(store.pending(), []);
  store.close();
});

test("reintento del store con la misma clave deja un solo registro remoto", async () => {
  const db = newIsolatedDatabase();
  const remote = new FakeRemote();
  remote.loseNextResponses(1);

  const store = await openInspectionStore(db);
  await store.save("inspection-store-02", payload("respuesta perdida"), 1_000);
  await store.synchronize(true, remote.send);
  await store.synchronize(true, remote.send);
  store.close();

  assert.equal(remote.count(), 1);
  const reopened = await openInspectionStore(db);
  assert.deepEqual(reopened.pending(), []);
  reopened.close();
});

test("guardar mientras se sincroniza no pierde la inspeccion nueva", async () => {
  const db = newIsolatedDatabase();
  const remote = new FakeRemote();
  const slowSend = async (item: Parameters<typeof remote.send>[0]) => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    await remote.send(item);
  };

  const store = await openInspectionStore(db);
  await store.save("inspection-a", payload("primera"), 1_000);

  const syncing = store.synchronize(true, slowSend);
  const saving = store.save("inspection-b", payload("durante la sincronizacion"), 1_001);
  await Promise.all([syncing, saving]);

  assert.deepEqual(store.pending().map((item) => item.id), ["inspection-b"]);
  assert.equal(remote.count(), 1);
  store.close();

  const reopened = await openInspectionStore(db);
  assert.deepEqual(reopened.pending().map((item) => item.id), ["inspection-b"]);
  reopened.close();
});
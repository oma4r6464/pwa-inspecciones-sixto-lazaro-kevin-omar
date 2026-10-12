import assert from "node:assert/strict";
import {
  attachEvidenceWithFallback,
  checkCameraSupport,
  createSyntheticEvidence,
  requestCameraAccess,
  stopCameraStream,
  type MockableNavigator
} from "../src/lib/device/camera";
import {
  MIN_ACCURACY_METERS,
  SYNTHETIC_COORDINATES,
  createFallbackLocation,
  isGeolocationSupported,
  requestLocation,
  type GeolocationProvider
} from "../src/lib/device/geolocation";
import {
  notifyInspectionChange,
  requestNotificationPermission
} from "../src/lib/notifications/client";

console.log("capabilities.spec.ts: running tests...");

{
  const result = await requestCameraAccess({ mediaDevices: { getUserMedia: async () => {
    throw new Error("sensitive-device-detail");
  } } });
  assert.equal(result.status, "recoverable_error");
  assert.equal(JSON.stringify(result).includes("sensitive-device-detail"), false);
  const fallback = await attachEvidenceWithFallback(Promise.reject(new Error("private-detail")), {
    inspectionId: "synthetic-001", timestamp: 1
  });
  assert.equal(fallback.blocked, false);
  assert.equal(fallback.status, "recoverable_error");
  let stopped = 0;
  await attachEvidenceWithFallback(Promise.resolve({ status: "available", canFallback: true,
    stream: { getTracks: () => [{ stop: () => { stopped += 1; } }] } as unknown as MediaStream
  }), { inspectionId: "synthetic-001", timestamp: 1 });
  assert.equal(stopped, 1);
  assert.equal(createSyntheticEvidence({ inspectionId: "x".repeat(1000), timestamp: 1 }).inspectionId.length, 80);
}

{
  const result = await requestCameraAccess({} as MockableNavigator);
  assert.equal(checkCameraSupport({}), false);
  assert.equal(result.status, "unsupported");
  assert.equal(result.canFallback, true);
}

{
  let stopped = 0;
  const stream = { getTracks: () => [{ stop: () => { stopped += 1; } }] } as unknown as MediaStream;
  const nav: MockableNavigator = { mediaDevices: { getUserMedia: async () => stream } };
  const result = await requestCameraAccess(nav);
  assert.equal(result.status, "available");
  stopCameraStream(result.stream);
  assert.equal(stopped, 1);
}

{
  const nav: MockableNavigator = { mediaDevices: { getUserMedia: async () => {
    const error = new Error("denegado");
    error.name = "NotAllowedError";
    throw error;
  } } };
  const result = await attachEvidenceWithFallback(requestCameraAccess(nav), { inspectionId: "insp-001", timestamp: 1 });
  assert.equal(result.status, "permission_denied");
  assert.equal(result.blocked, false);
  assert.equal(result.evidence.source, "manual_fallback");
  assert.equal(createSyntheticEvidence({ inspectionId: "id?real", timestamp: 1 }).metadata.hasPII, false);
}

const provider = (latitude: number, longitude: number, accuracy: number): GeolocationProvider => ({
  getCurrentPosition: (success) => success({ coords: { latitude, longitude, accuracy } })
});

{
  let calls = 0;
  const noCallProvider: GeolocationProvider = { getCurrentPosition: () => { calls += 1; } };
  assert.equal(isGeolocationSupported(noCallProvider), true);
  assert.equal(calls, 0);
}

{
  const result = await requestLocation({ provider: provider(12.345678, -45.678901, 25) });
  assert.equal(result.status, "granted");
  assert.equal(result.location.latitude, 12.3);
  assert.equal(result.location.longitude, -45.7);
  assert.equal(result.location.accuracyMeters, MIN_ACCURACY_METERS);
}

{
  const unsupported = await requestLocation();
  assert.equal(unsupported.status, "unsupported");
  assert.equal(unsupported.location.latitude, SYNTHETIC_COORDINATES.latitude);
  const denied = await requestLocation({ provider: { getCurrentPosition: (_ok, fail) => fail({ code: 1 }) } });
  assert.equal(denied.status, "denied");
  const timeout = await requestLocation({ provider: { getCurrentPosition: () => {} }, timeoutMs: 10 });
  assert.equal(timeout.status, "timeout");
  assert.equal(timeout.location.source, "synthetic");
  assert.equal(createFallbackLocation("   ").source, "synthetic");
}

// Notificaciones: no hay solicitud ni fallo cuando la API no esta disponible.
{
  const originalNotification = globalThis.Notification;
  const originalNavigator = globalThis.navigator;
  try {
    Object.defineProperty(globalThis, "Notification", { configurable: true, value: undefined });
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: {} });
    assert.deepEqual(await requestNotificationPermission(), {
      ok: false,
      permission: "unsupported",
      reason: "unsupported"
    });
    assert.deepEqual(await notifyInspectionChange(), {
      ok: false,
      permission: "unsupported",
      reason: "unsupported"
    });
  } finally {
    Object.defineProperty(globalThis, "Notification", { configurable: true, value: originalNotification });
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: originalNavigator });
  }
}

// Notificaciones: la entrega depende de permiso concedido y un service worker disponible.
{
  const originalNotification = globalThis.Notification;
  const originalNavigator = globalThis.navigator;
  try {
    class SyntheticNotification {
      static permission: NotificationPermission = "granted";
      static requestPermission = async (): Promise<NotificationPermission> => "granted";
    }
    Object.defineProperty(globalThis, "Notification", { configurable: true, value: SyntheticNotification });
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: {} });
    assert.deepEqual(await notifyInspectionChange(), {
      ok: false,
      permission: "granted",
      reason: "service-worker-unavailable"
    });
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
      serviceWorker: { ready: new Promise(() => {}) }
    } });
    assert.deepEqual(await notifyInspectionChange(10), {
      ok: false, permission: "granted", reason: "service-worker-unavailable"
    });
    let delivered = 0;
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
      serviceWorker: { ready: Promise.resolve({ showNotification: async () => { delivered += 1; } }) }
    } });
    assert.equal((await notifyInspectionChange()).ok, true);
    assert.equal(delivered, 1);
  } finally {
    Object.defineProperty(globalThis, "Notification", { configurable: true, value: originalNotification });
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: originalNavigator });
  }
}

console.log("capabilities.spec.ts: PASS");


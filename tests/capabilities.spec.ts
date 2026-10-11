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

console.log("capabilities.spec.ts: running tests...");

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

console.log("capabilities.spec.ts: PASS");


import assert from "node:assert/strict";
import {
  checkCameraSupport,
  requestCameraAccess,
  stopCameraStream,
  createSyntheticEvidence,
  attachEvidenceWithFallback,
  type MockableNavigator
} from "../src/lib/device/camera";

console.log("capabilities.spec.ts: running tests...");

// CASO 1: API no soportada (navegador sin navigator.mediaDevices)
{
  const mockNav: MockableNavigator = {};
  assert.equal(checkCameraSupport(mockNav), false, "Debe detectar falta de mediaDevices");

  const result = await requestCameraAccess(mockNav);
  assert.equal(result.status, "unsupported");
  assert.equal(result.canFallback, true);
  assert.match(String(result.error), /no está disponible/);
}

// CASO 2: API disponible y adquisición exitosa
{
  let tracksStopped = 0;
  const fakeStream = {
    getTracks: () => [
      { stop: () => { tracksStopped += 1; } },
      { stop: () => { tracksStopped += 1; } }
    ]
  } as unknown as MediaStream;

  const mockNav: MockableNavigator = {
    mediaDevices: {
      getUserMedia: async () => fakeStream
    }
  };

  assert.equal(checkCameraSupport(mockNav), true, "Debe detectar mediaDevices disponible");

  const result = await requestCameraAccess(mockNav);
  assert.equal(result.status, "available");
  assert.equal(result.stream, fakeStream);
  assert.equal(result.canFallback, true);

  // Verificación de liberación de recursos
  stopCameraStream(result.stream);
  assert.equal(tracksStopped, 2, "Debe detener todas las pistas al invocar stopCameraStream");
}

// CASO 3: Permiso denegado (NotAllowedError / PermissionDeniedError)
{
  const mockNav: MockableNavigator = {
    mediaDevices: {
      getUserMedia: async () => {
        const error = new Error("El usuario rechazó el permiso");
        error.name = "NotAllowedError";
        throw error;
      }
    }
  };

  const result = await requestCameraAccess(mockNav);
  assert.equal(result.status, "permission_denied");
  assert.equal(result.canFallback, true);
  assert.match(String(result.error), /Permiso denegado/);
}

// CASO 4: Error recuperable (hardware en uso: NotReadableError)
{
  const mockNav: MockableNavigator = {
    mediaDevices: {
      getUserMedia: async () => {
        const error = new Error("Cámara ocupada por otro proceso");
        error.name = "NotReadableError";
        throw error;
      }
    }
  };

  const result = await requestCameraAccess(mockNav);
  assert.equal(result.status, "recoverable_error");
  assert.equal(result.canFallback, true);
  assert.match(String(result.error), /Error temporal o de hardware/);
}

// CASO 5: Fallback sintético sin datos reales ni PII
{
  const fallback = createSyntheticEvidence({
    inspectionId: "insp-lab-001?usuario=real",
    label: "foto sintetica de prueba",
    timestamp: 1700000000000
  });

  assert.equal(fallback.source, "manual_fallback");
  assert.equal(fallback.metadata.hasPII, false);
  assert.equal(fallback.inspectionId, "insp-lab-001usuarioreal", "Debe sanitizar caracteres ajenos al identificador");
  assert.equal("fotoReal" in fallback, false);
  assert.equal("gps" in fallback, false);
  assert.equal("token" in fallback, false);
}

// CASO 6: Orquestación completa con fallback que nunca bloquea el flujo
{
  // Simular flujo donde no hay cámara
  const unsupportedNav: MockableNavigator = {};
  const attachment = await attachEvidenceWithFallback(
    requestCameraAccess(unsupportedNav),
    { inspectionId: "insp-002", timestamp: 1700000001000 }
  );

  assert.equal(attachment.success, true);
  assert.equal(attachment.blocked, false, "El flujo no debe bloquearse ante falta de cámara");
  assert.equal(attachment.status, "unsupported");
  assert.equal(attachment.evidence.source, "manual_fallback");
}

console.log("capabilities.spec.ts: PASS");

import assert from "node:assert/strict";
import {
  DEFAULT_FALLBACK_LABEL,
  MIN_ACCURACY_METERS,
  SYNTHETIC_COORDINATES,
  createFallbackLocation,
  isGeolocationSupported,
  normalizePosition,
  requestLocation,
  roundCoordinate,
  type GeolocationProvider
} from "../src/lib/device/geolocation";

// Todos los valores de estas pruebas son ficticios y deterministas.
const FAKE_LAT = 12.345678;
const FAKE_LON = -45.678901;

const okProvider = (latitude: number, longitude: number, accuracy: number): GeolocationProvider => ({
  getCurrentPosition: (success) => success({ coords: { latitude, longitude, accuracy } })
});

const errorProvider = (code: number): GeolocationProvider => ({
  getCurrentPosition: (_success, error) => error({ code, message: "detalle interno del navegador" })
});

// 1. No se pide permiso por importar el modulo ni por consultar soporte.
{
  let calls = 0;
  const provider: GeolocationProvider = {
    getCurrentPosition: () => {
      calls += 1;
    }
  };
  assert.equal(calls, 0);
  assert.equal(isGeolocationSupported(provider), true);
  assert.equal(calls, 0);
}

// 2. API disponible con respuesta simulada: coordenadas redondeadas y precision limitada.
{
  const result = await requestLocation({ provider: okProvider(FAKE_LAT, FAKE_LON, 25) });
  assert.equal(result.status, "granted");
  assert.equal(result.recoverable, false);
  assert.equal(result.location.source, "device-coarse");
  assert.equal(result.location.latitude, 12.3);
  assert.equal(result.location.longitude, -45.7);
  assert.equal(result.location.accuracyMeters, MIN_ACCURACY_METERS);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("345678"), false);
  assert.equal(serialized.includes("678901"), false);
}

// 3. API no soportada: fallback sintetico y flujo continua.
{
  const result = await requestLocation();
  assert.equal(result.status, "unsupported");
  assert.equal(result.location.source, "synthetic");
  assert.equal(result.location.latitude, SYNTHETIC_COORDINATES.latitude);
  assert.equal(result.location.longitude, SYNTHETIC_COORDINATES.longitude);
  assert.equal(result.recoverable, false);
  assert.equal(isGeolocationSupported(), false);
}

// 4. Permiso denegado: resultado controlado y explicable, sin filtrar el mensaje original.
{
  const result = await requestLocation({ provider: errorProvider(1) });
  assert.equal(result.status, "denied");
  assert.equal(result.location.source, "synthetic");
  assert.equal(result.recoverable, false);
  assert.match(result.message, /denegado/i);
  assert.equal(result.message.includes("detalle interno"), false);
}

// 5. Error recuperable (posicion no disponible o excepcion del proveedor).
{
  const unavailable = await requestLocation({ provider: errorProvider(2) });
  assert.equal(unavailable.status, "error");
  assert.equal(unavailable.recoverable, true);

  const throwing = await requestLocation({
    provider: {
      getCurrentPosition: () => {
        throw new Error("fallo inesperado");
      }
    }
  });
  assert.equal(throwing.status, "error");
  assert.equal(throwing.location.source, "synthetic");

  const invalid = await requestLocation({ provider: okProvider(Number.NaN, 0, 5) });
  assert.equal(invalid.status, "error");
  assert.equal(invalid.location.source, "synthetic");
}

// 6. Timeout: el proveedor nunca responde, o responde con codigo de timeout.
{
  const silent: GeolocationProvider = { getCurrentPosition: () => {} };
  const result = await requestLocation({ provider: silent, timeoutMs: 20 });
  assert.equal(result.status, "timeout");
  assert.equal(result.recoverable, true);
  assert.equal(result.location.source, "synthetic");

  const byCode = await requestLocation({ provider: errorProvider(3) });
  assert.equal(byCode.status, "timeout");
}

// 7. Una respuesta tardia no pisa el resultado ya entregado.
{
  let late: (() => void) | undefined;
  const provider: GeolocationProvider = {
    getCurrentPosition: (success) => {
      late = () => success({ coords: { latitude: FAKE_LAT, longitude: FAKE_LON, accuracy: 5 } });
    }
  };
  const result = await requestLocation({ provider, timeoutMs: 20 });
  late?.();
  assert.equal(result.status, "timeout");
}

// 8. Fallback manual/sintetico y normalizacion.
{
  assert.equal(createFallbackLocation("Laboratorio ficticio A").label, "Laboratorio ficticio A");
  assert.equal(createFallbackLocation("   ").label, DEFAULT_FALLBACK_LABEL);
  assert.equal(createFallbackLocation().source, "synthetic");
  assert.equal(roundCoordinate(-0.04), 0);
  assert.equal(normalizePosition({ coords: { latitude: 91, longitude: 0, accuracy: 1 } }), null);
  assert.equal(normalizePosition({ coords: { latitude: 0, longitude: 181, accuracy: 1 } }), null);
}

console.log("capabilities.spec.ts: PASS");
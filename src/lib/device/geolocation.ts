export type GeolocationResult =
  | { ok: true; position: GeolocationPosition }
  | { ok: false; reason: "unsupported" | "denied" | "unavailable" | "timeout" | "error" };

export function getCurrentPosition(
  options: PositionOptions = { enableHighAccuracy: false, timeout: 5_000, maximumAge: 0 }
): Promise<GeolocationResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ok: false, reason: "unsupported" });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ ok: true, position }),
      (error) => {
        if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
          resolve({ ok: false, reason: "denied" });
        } else if (error.code === GeolocationPositionError.TIMEOUT) {
          resolve({ ok: false, reason: "timeout" });
        } else if (error.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
          resolve({ ok: false, reason: "unavailable" });
        } else {
          resolve({ ok: false, reason: "error" });
        }
      },
      options
    );
  });
}

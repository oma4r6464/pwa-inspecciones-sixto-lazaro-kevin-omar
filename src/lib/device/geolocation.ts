export type GeolocationStatus =
  | "granted"
  | "unsupported"
  | "denied"
  | "timeout"
  | "error";

export type LocationSource = "device-coarse" | "synthetic";

export type LocationContext = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  label: string;
  source: LocationSource;
};

export type LocationResult = {
  status: GeolocationStatus;
  location: LocationContext;
  message: string;
  /** true si tiene sentido volver a intentarlo mas tarde. */
  recoverable: boolean;
};

export type GeoPositionLike = {
  coords: { latitude: number; longitude: number; accuracy: number };
};

export type GeoErrorLike = { code: number; message?: string };

export type GeolocationProvider = {
  getCurrentPosition(
    success: (position: GeoPositionLike) => void,
    error: (error: GeoErrorLike) => void,
    options?: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number }
  ): void;
};

export type RequestLocationOptions = {
  provider?: GeolocationProvider;
  timeoutMs?: number;
  fallbackLabel?: string;
};


export const COARSE_DECIMALS = 1;
export const MIN_ACCURACY_METERS = 10000;
export const DEFAULT_TIMEOUT_MS = 8000;
export const DEFAULT_FALLBACK_LABEL = "Ubicacion sintetica de laboratorio (dato ficticio)";


export const SYNTHETIC_COORDINATES = { latitude: 0, longitude: 0 } as const;

const PERMISSION_DENIED = 1;
const TIMEOUT = 3;

export function roundCoordinate(value: number, decimals = COARSE_DECIMALS): number {
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function createFallbackLocation(label = DEFAULT_FALLBACK_LABEL): LocationContext {
  return {
    ...SYNTHETIC_COORDINATES,
    accuracyMeters: 0,
    label: label.trim() || DEFAULT_FALLBACK_LABEL,
    source: "synthetic"
  };
}

export function normalizePosition(position: GeoPositionLike): LocationContext | null {
  const { latitude, longitude, accuracy } = position?.coords ?? {};
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }
  return {
    latitude: roundCoordinate(latitude),
    longitude: roundCoordinate(longitude),
    accuracyMeters: Math.max(Number.isFinite(accuracy) ? Math.ceil(accuracy) : 0, MIN_ACCURACY_METERS),
    label: "Ubicacion aproximada del dispositivo",
    source: "device-coarse"
  };
}

export function isGeolocationSupported(provider?: GeolocationProvider): boolean {
  return Boolean(provider ?? getBrowserProvider());
}

function getBrowserProvider(): GeolocationProvider | undefined {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return undefined;
  }
  return navigator.geolocation ?? undefined;
}

function fallbackResult(
  status: Exclude<GeolocationStatus, "granted">,
  label: string,
  message: string,
  recoverable: boolean
): LocationResult {
  return { status, location: createFallbackLocation(label), message, recoverable };
}

function failureFromError(error: GeoErrorLike, label: string): LocationResult {
  if (error?.code === PERMISSION_DENIED) {
    return fallbackResult(
      "denied",
      label,
      "Permiso de ubicacion denegado. Se usa una ubicacion sintetica y la inspeccion continua.",
      false
    );
  }
  if (error?.code === TIMEOUT) {
    return fallbackResult(
      "timeout",
      label,
      "La ubicacion tardo demasiado. Se usa una ubicacion sintetica; puedes reintentar.",
      true
    );
  }
  return fallbackResult(
    "error",
    label,
    "No se pudo obtener la ubicacion. Se usa una ubicacion sintetica; puedes reintentar.",
    true
  );
}

/**
 * Solicita la ubicacion bajo accion explicita del usuario.
 * Nunca rechaza la promesa: siempre resuelve con un LocationResult utilizable.
 */
export function requestLocation(options: RequestLocationOptions = {}): Promise<LocationResult> {
  const label = options.fallbackLabel ?? DEFAULT_FALLBACK_LABEL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const provider = options.provider ?? getBrowserProvider();

  if (!provider) {
    return Promise.resolve(
      fallbackResult(
        "unsupported",
        label,
        "Este dispositivo o navegador no soporta geolocalizacion. Se usa una ubicacion sintetica.",
        false
      )
    );
  }

  return new Promise<LocationResult>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (result: LocationResult) => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) clearTimeout(timer);
      resolve(result);
    };

    timer = setTimeout(() => finish(failureFromError({ code: TIMEOUT }, label)), timeoutMs);

    try {
      provider.getCurrentPosition(
        (position) => {
          const location = normalizePosition(position);
          if (!location) {
            finish(failureFromError({ code: 2 }, label));
            return;
          }
          finish({
            status: "granted",
            location,
            message: "Ubicacion aproximada obtenida (redondeada y sin guardarse).",
            recoverable: false
          });
        },
        (error) => finish(failureFromError(error, label)),
        { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60000 }
      );
    } catch {
      finish(failureFromError({ code: 2 }, label));
    }
  });
}
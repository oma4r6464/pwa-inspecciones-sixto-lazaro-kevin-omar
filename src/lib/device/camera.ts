/**
 * Módulo de capacidad de cámara y fallback de evidencia para inspecciones.
 * Cumple con privacidad estricta: sin PII, sin fotos reales y solicitud bajo acción explícita.
 */

export type CameraStatus =
  | "available"
  | "unsupported"
  | "permission_denied"
  | "recoverable_error";

export interface MockableMediaDevices {
  getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
}

export interface MockableNavigator {
  mediaDevices?: MockableMediaDevices;
}

export interface CameraAccessResult {
  status: CameraStatus;
  stream?: MediaStream;
  error?: string;
  canFallback: boolean;
}

export interface SyntheticEvidence {
  evidenceId: string;
  inspectionId: string;
  source: "camera_capture" | "manual_fallback";
  capturedAt: number;
  label: string;
  checksum: string;
  metadata: {
    format: "synthetic/vector" | "synthetic/mock";
    dimensions: string;
    hasPII: false;
  };
}

export interface SyntheticFallbackInput {
  inspectionId: string;
  label?: string;
  timestamp?: number;
}

/**
 * 1. Detección no invasiva de soporte de API de cámara.
 * No solicita permisos ni interactúa con hardware.
 */
export function checkCameraSupport(customNavigator?: MockableNavigator): boolean {
  const nav =
    customNavigator !== undefined
      ? customNavigator
      : typeof navigator !== "undefined"
      ? navigator
      : undefined;

  return Boolean(nav && nav.mediaDevices && typeof nav.mediaDevices.getUserMedia === "function");
}

/**
 * 2. Solicitud controlada de cámara bajo acción explícita del usuario.
 * Clasifica los estados sin arrojar excepciones no controladas.
 */
export async function requestCameraAccess(
  customNavigator?: MockableNavigator,
  constraints: MediaStreamConstraints = { video: { facingMode: "environment" }, audio: false }
): Promise<CameraAccessResult> {
  const isSupported = checkCameraSupport(customNavigator);

  if (!isSupported) {
    return {
      status: "unsupported",
      error: "La API navigator.mediaDevices.getUserMedia no está disponible en este entorno.",
      canFallback: true
    };
  }

  const nav =
    customNavigator !== undefined
      ? customNavigator
      : (navigator as unknown as MockableNavigator);

  try {
    const stream = await nav.mediaDevices!.getUserMedia(constraints);
    return {
      status: "available",
      stream,
      canFallback: true
    };
  } catch (err: unknown) {
    const errorName = (err as { name?: string })?.name || "";
    const errorMessage = (err as { message?: string })?.message || String(err);

    // Permiso denegado por el usuario o directiva de permisos
    if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
      return {
        status: "permission_denied",
        error: `Permiso denegado por el usuario: ${errorMessage}`,
        canFallback: true
      };
    }

    // Errores recuperables: hardware ocupado, restricción imposible o no encontrado
    return {
      status: "recoverable_error",
      error: `Error temporal o de hardware (${errorName}): ${errorMessage}`,
      canFallback: true
    };
  }
}

/**
 * 3. Detiene limpiamente las pistas de un MediaStream para liberar el hardware.
 */
export function stopCameraStream(stream?: { getTracks?: () => Array<{ stop: () => void }> }): void {
  if (stream && typeof stream.getTracks === "function") {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // Ignorar fallos de liberación en mocks
      }
    });
  }
}

/**
 * 4. Generador de evidencia sintética/manual garantizada sin datos reales ni PII.
 */
export function createSyntheticEvidence(input: SyntheticFallbackInput, isCamera = false): SyntheticEvidence {
  const sanitizedId = String(input.inspectionId).replace(/[^a-zA-Z0-9_-]/g, "");
  const now = input.timestamp ?? Date.now();
  const label = input.label ?? (isCamera ? "evidencia-captura-sintetica" : "evidencia-manual-sintetica");

  return {
    evidenceId: `evi-${sanitizedId}-${now}`,
    inspectionId: sanitizedId,
    source: isCamera ? "camera_capture" : "manual_fallback",
    capturedAt: now,
    label,
    checksum: `sha256-mock-${sanitizedId}-${now}`,
    metadata: {
      format: isCamera ? "synthetic/mock" : "synthetic/vector",
      dimensions: "1280x720",
      hasPII: false
    }
  };
}

/**
 * 5. Orquestador de adjunción con fallback garantizado.
 * Si la cámara falla o no existe, nunca bloquea el flujo de inspección.
 */
export async function attachEvidenceWithFallback(
  cameraPromise: Promise<CameraAccessResult>,
  fallbackInput: SyntheticFallbackInput
): Promise<{
  success: boolean;
  status: CameraStatus;
  evidence: SyntheticEvidence;
  blocked: boolean;
}> {
  const result = await cameraPromise;

  if (result.status === "available") {
    return {
      success: true,
      status: "available",
      evidence: createSyntheticEvidence(fallbackInput, true),
      blocked: false
    };
  }

  // Fallback transparente ante cualquier escenario no exitoso
  return {
    success: true,
    status: result.status,
    evidence: createSyntheticEvidence(fallbackInput, false),
    blocked: false
  };
}

export type CameraResult =
  | { ok: true; stream: MediaStream }
  | { ok: false; reason: "unsupported" | "denied" | "unavailable" | "error" };

export async function requestCameraStream(
  constraints: MediaStreamConstraints = { video: true, audio: false }
): Promise<CameraResult> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    return { ok: true, stream: await navigator.mediaDevices.getUserMedia(constraints) };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") {
      return { ok: false, reason: "denied" };
    }
    if (name === "NotFoundError") {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: false, reason: "error" };
  }
}

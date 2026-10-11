export type NotificationResult =
  | { ok: true; permission: "granted"; delivered: boolean }
  | {
      ok: false;
      permission: NotificationPermission | "unsupported";
      reason: "unsupported" | "denied" | "default" | "service-worker-unavailable" | "error";
    };

const notificationText = {
  title: "Cambio de inspección",
  body: "Hay un cambio sintético disponible para revisar."
} as const;

function getNotificationApi(): typeof Notification | undefined {
  return typeof Notification === "undefined" ? undefined : Notification;
}

export async function requestNotificationPermission(): Promise<
  | { ok: true; permission: "granted" }
  | {
      ok: false;
      permission: "unsupported" | "denied" | "default";
      reason: "unsupported" | "denied" | "default" | "error";
    }
> {
  const api = getNotificationApi();
  if (!api) return { ok: false, permission: "unsupported", reason: "unsupported" };
  if (api.permission === "granted") return { ok: true, permission: "granted" };
  if (api.permission === "denied") return { ok: false, permission: "denied", reason: "denied" };
  try {
    const permission = await api.requestPermission();
    return permission === "granted"
      ? { ok: true, permission }
      : { ok: false, permission, reason: permission };
  } catch {
    return { ok: false, permission: "default", reason: "error" };
  }
}

export async function notifyInspectionChange(): Promise<NotificationResult> {
  const api = getNotificationApi();
  if (!api) return { ok: false, permission: "unsupported", reason: "unsupported" };
  if (api.permission !== "granted") {
    return { ok: false, permission: api.permission, reason: api.permission };
  }
  if (typeof navigator === "undefined" || !navigator.serviceWorker) {
    return { ok: false, permission: "granted", reason: "service-worker-unavailable" };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.showNotification) {
      return { ok: false, permission: "granted", reason: "service-worker-unavailable" };
    }
    await registration.showNotification(notificationText.title, {
      body: notificationText.body,
      tag: "synthetic-inspection-change"
    });
    return { ok: true, permission: "granted", delivered: true };
  } catch {
    return { ok: false, permission: "granted", reason: "error" };
  }
}

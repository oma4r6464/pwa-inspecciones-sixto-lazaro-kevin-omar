import assert from "node:assert/strict";
import { requestCameraStream } from "../src/lib/device/camera";
import { getCurrentPosition } from "../src/lib/device/geolocation";
import { notifyInspectionChange, requestNotificationPermission } from "../src/lib/notifications/client";

const globals = globalThis as typeof globalThis & {
  Notification?: typeof Notification;
  navigator?: Navigator;
};
const originalNotification = globals.Notification;
const originalNavigator = globals.navigator;

function setNavigator(value: Partial<Navigator>): void {
  Object.defineProperty(globalThis, "navigator", { configurable: true, value });
}

try {
  Object.defineProperty(globalThis, "Notification", { configurable: true, value: undefined });
  setNavigator({});
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

  class SyntheticNotification {
    static permission: NotificationPermission = "default";
    static requestPermission = async (): Promise<NotificationPermission> => "default";
  }
  Object.defineProperty(globalThis, "Notification", { configurable: true, value: SyntheticNotification });
  assert.deepEqual(await requestNotificationPermission(), {
    ok: false,
    permission: "default",
    reason: "default"
  });

  SyntheticNotification.permission = "denied";
  assert.deepEqual(await requestNotificationPermission(), {
    ok: false,
    permission: "denied",
    reason: "denied"
  });

  SyntheticNotification.permission = "granted";
  setNavigator({});
  assert.deepEqual(await notifyInspectionChange(), {
    ok: false,
    permission: "granted",
    reason: "service-worker-unavailable"
  });

  const shown: string[] = [];
  setNavigator({
    serviceWorker: {
      ready: Promise.resolve({
        showNotification: async (title: string, options: NotificationOptions) => {
          shown.push(`${title}:${options.body}`);
        }
      })
    } as ServiceWorkerContainer
  });
  assert.deepEqual(await notifyInspectionChange(), { ok: true, permission: "granted", delivered: true });
  assert.deepEqual(shown, ["Cambio de inspección:Hay un cambio sintético disponible para revisar."]);

  setNavigator({
    mediaDevices: {
      getUserMedia: async () => ({ id: "synthetic-camera-stream" } as MediaStream)
    }
  });
  assert.equal((await requestCameraStream()).ok, true);
  setNavigator({
    geolocation: {
      getCurrentPosition: (success) =>
        success({ coords: { latitude: 0, longitude: 0, accuracy: 1 } } as GeolocationPosition)
    }
  });
  assert.equal((await getCurrentPosition()).ok, true);
  setNavigator({});
  assert.deepEqual(await requestCameraStream(), { ok: false, reason: "unsupported" });
  assert.deepEqual(await getCurrentPosition(), { ok: false, reason: "unsupported" });
} finally {
  Object.defineProperty(globalThis, "Notification", { configurable: true, value: originalNotification });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: originalNavigator });
}

console.log("capabilities.spec.ts: PASS");

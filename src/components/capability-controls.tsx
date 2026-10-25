"use client";

import { useState } from "react";
import { attachEvidenceWithFallback, requestCameraAccess } from "../lib/device/camera";
import { requestLocation } from "../lib/device/geolocation";
import { notifyInspectionChange, requestNotificationPermission } from "../lib/notifications/client";

export function CapabilityControls() {
  const [message, setMessage] = useState("Estas opciones no son obligatorias para guardar la inspeccion.");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<string>) {
    setBusy(true);
    setMessage("Procesando la opcion seleccionada...");
    try {
      setMessage(await action());
    } catch {
      setMessage("La opcion no esta disponible. Puedes continuar con los datos sinteticos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <fieldset disabled={busy}>
      <legend>Opciones de la inspeccion</legend>
      <p>La camara se libera sin capturar fotos. La ubicacion es simulada.</p>
      <button type="button" onClick={() => run(async () => {
        const result = await attachEvidenceWithFallback(requestCameraAccess(), {
          inspectionId: "inspection-demo"
        });
        return result.status === "available"
          ? "Camara comprobada y liberada. Evidencia sintetica preparada."
          : "Camara no disponible. Evidencia sintetica preparada como alternativa.";
      })}>Comprobar camara</button>
      <button type="button" onClick={() => run(async () => {
        const result = await requestLocation({ provider: {
          getCurrentPosition: (success) => success({ coords: { latitude: 0, longitude: 0, accuracy: 10000 } })
        } });
        return result.status === "granted"
          ? "Ubicacion sintetica comprobada. No se solicito la ubicacion real."
          : "Se conserva la ubicacion sintetica como alternativa.";
      })}>Probar ubicacion sintetica</button>
      <button type="button" onClick={() => run(async () => {
        const permission = await requestNotificationPermission();
        if (!permission.ok) return "Aviso local: hay un cambio sintetico disponible para revisar.";
        const result = await notifyInspectionChange();
        return result.ok ? "Notificacion enviada." : "Aviso local: hay un cambio sintetico disponible para revisar.";
      })}>Probar notificacion</button>
      <p role="status" aria-live="polite">{message}</p>
    </fieldset>
  );
}

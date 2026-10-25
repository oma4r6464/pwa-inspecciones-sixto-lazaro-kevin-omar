export type ServiceWorkerUpdateHandler = (registration: ServiceWorkerRegistration) => void;

const SERVICE_WORKER_URL = "/sw.js";

function performRegistration(onUpdateAvailable?: ServiceWorkerUpdateHandler): void {
  navigator.serviceWorker
    .register(SERVICE_WORKER_URL)
    .then((registration) => {
    
      if (registration.waiting && navigator.serviceWorker.controller) {
        onUpdateAvailable?.(registration);
      }

      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          const isNewVersionReady =
            installingWorker.state === "installed" && navigator.serviceWorker.controller;

          if (isNewVersionReady) {
            onUpdateAvailable?.(registration);
          }
        });
      });
    })
    .catch((error) => {
      console.error("[pwa] No se pudo registrar el service worker", error);
    });
}

export function registerServiceWorker(onUpdateAvailable?: ServiceWorkerUpdateHandler): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") return;
  if (!("serviceWorker" in navigator)) return;


  if (document.readyState === "complete") {
    performRegistration(onUpdateAvailable);
  } else {
    window.addEventListener("load", () => performRegistration(onUpdateAvailable));
  }

  let hasReloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hasReloaded) return;
    hasReloaded = true;
    window.location.reload();
  });
}


export function applyServiceWorkerUpdate(registration: ServiceWorkerRegistration): void {
  registration.waiting?.postMessage({ type: "SKIP_WAITING" });
}
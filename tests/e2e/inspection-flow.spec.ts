import { expect, test } from "@playwright/test";

const location = "Laboratorio E2E Sintetico";
const summary = "Captura E2E sin datos reales";

async function clearScenarioState(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("pwa-inspecciones-queue");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Inspecciones de laboratorio" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await clearScenarioState(page);
});

test("crea, conserva offline al recargar y sincroniza una sola vez al reconectar", async ({ page, context }) => {
  await page.getByRole("button", { name: "+ Agregar inspección" }).click();
  await expect(page.getByLabel("Ubicación sintética *")).toBeVisible();
  await page.getByLabel("Ubicación sintética *").fill(location);
  await page.getByLabel("Resumen *").fill(summary);

  await context.setOffline(true);
  await page.getByRole("button", { name: "Guardar inspección" }).click();
  await expect(page.getByText(`Inspección "${location}" agregada correctamente.`)).toBeVisible();
  await expect(page.getByText("Pendiente de sincronizar")).toBeVisible();

  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  await page.close();
  const reloadedPage = await context.newPage();
  await reloadedPage.goto("/");
  await expect(reloadedPage.getByRole("heading", { name: location })).toBeVisible();
  await expect(reloadedPage.getByText(summary)).toBeVisible();

  await context.setOffline(false);
  await reloadedPage.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(reloadedPage.getByText("Sincronizada")).toBeVisible();
  await expect(reloadedPage.getByText("Pendiente de sincronizar")).toHaveCount(0);
  await expect(reloadedPage.getByRole("heading", { name: location })).toHaveCount(1);
});

test("permiso de cámara denegado usa fallback y permite completar la captura", async ({ page, context }) => {
  await context.grantPermissions([], { origin: "http://127.0.0.1:3000" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => Promise.reject(new DOMException("denied", "NotAllowedError")) }
    });
  });
  await page.reload();
  await page.getByRole("button", { name: "+ Agregar inspección" }).click();
  await page.getByRole("button", { name: "Comprobar camara" }).click();
  await expect(page.getByText("Camara no disponible. Evidencia sintetica preparada como alternativa.")).toBeVisible();

  await page.getByLabel("Ubicación sintética *").fill("Laboratorio E2E Sin Camara");
  await page.getByLabel("Resumen *").fill("Captura completada con fallback");
  await page.getByRole("button", { name: "Guardar inspección" }).click();
  await expect(page.getByText('Inspección "Laboratorio E2E Sin Camara" agregada correctamente.')).toBeVisible();
});

test("fallo de almacenamiento muestra errores controlados sin detalles internos", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(indexedDB, "open", {
      configurable: true,
      value: () => {
        throw new Error("synthetic-storage-detail-must-not-be-shown");
      }
    });
  });
  await page.reload();

  await expect(
    page.getByText("El almacenamiento local no está disponible. No se pueden guardar capturas ahora.")
  ).toBeVisible();
  await page.getByRole("button", { name: "+ Agregar inspección" }).click();
  await page.getByLabel("Ubicación sintética *").fill("Laboratorio E2E Error Controlado");
  await page.getByLabel("Resumen *").fill("Prueba sintética de error local");
  await page.getByRole("button", { name: "Guardar inspección" }).click();

  await expect(page.getByRole("heading", { name: "No se pudo guardar la inspección" })).toBeVisible();
  await expect(page.getByText(/Referencia: inspection-save/)).toBeVisible();
  await expect(page.getByText(/synthetic-storage-detail-must-not-be-shown/)).toHaveCount(0);
});

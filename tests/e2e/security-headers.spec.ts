import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/inspecciones", "/inspecciones/inspection-001", "/manifest.webmanifest", "/sw.js"];

test("las respuestas reales incluyen CSP, Permissions-Policy y cabeceras de seguridad", async ({ request }) => {
  for (const route of ROUTES) {
    const response = await request.get(route);
    expect(response.ok(), route).toBe(true);
    const headers = response.headers();
    expect(headers["content-security-policy"], route).toContain("default-src 'self'");
    expect(headers["content-security-policy"], route).toContain("object-src 'none'");
    expect(headers["content-security-policy"], route).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"], route).not.toContain("unsafe-eval");
    expect(headers["permissions-policy"], route).toContain("camera=(self)");
    expect(headers["permissions-policy"], route).toContain("geolocation=(self)");
    expect(headers["x-content-type-options"], route).toBe("nosniff");
    expect(headers["x-powered-by"], route).toBeUndefined();
  }
});

test("la CSP no bloquea la navegación, el service worker ni las opciones de la inspección", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy")) violations.push(message.text());
  });
  page.on("pageerror", (error) => violations.push(error.message));

  await page.goto("/");
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Inspecciones de laboratorio" })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));

  await page.getByRole("button", { name: "+ Agregar inspección" }).click();
  await page.getByRole("button", { name: "Probar ubicacion sintetica" }).click();
  await expect(page.getByText("Ubicacion sintetica comprobada. No se solicito la ubicacion real.")).toBeVisible();

  await page.goto("/inspecciones");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.goto("/inspecciones/inspection-001");
  await expect(page.locator("h1").first()).toBeVisible();

  expect(violations).toEqual([]);
});

test("connect-src impide conexiones ajenas sin enviar datos a terceros", async ({ page }) => {
  let externalRequests = 0;
  await page.route("https://security-test.invalid/**", async (route) => {
    externalRequests += 1;
    await route.abort();
  });
  await page.goto("/");
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  await page.waitForLoadState("networkidle");
  const blockedDirective = await page.evaluate(async () => {
    const violation = new Promise<string>((resolve) => {
      document.addEventListener("securitypolicyviolation", (event) => resolve(event.effectiveDirective), { once: true });
    });
    await fetch("https://security-test.invalid/synthetic").catch(() => undefined);
    return violation;
  });
  expect(blockedDirective).toBe("connect-src");
  expect(externalRequests).toBe(0);
});

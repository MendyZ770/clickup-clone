import { test, expect, Page } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "demo@clickup.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "password123";

// L'override doit survivre aux navigations : addInitScript l'applique à chaque document.
function installOnlineSwitch(page: Page) {
  return page.addInitScript(() => {
    const w = window as unknown as { __setOnline?: (v: boolean) => void };
    Object.defineProperty(Navigator.prototype, "onLine", {
      configurable: true,
      get: () => (w as unknown as { __online?: boolean }).__online ?? true,
    });
    w.__setOnline = (value: boolean) => {
      (w as unknown as { __online?: boolean }).__online = value;
      window.dispatchEvent(new Event(value ? "online" : "offline"));
    };
  });
}

function setOnline(page: Page, online: boolean) {
  return page.evaluate((value) => {
    const w = window as unknown as { __setOnline?: (v: boolean) => void };
    w.__setOnline?.(value);
  }, online);
}

function outboxCount(page: Page): Promise<number | string> {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        const req = indexedDB.open("done-offline", 1);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("outbox")) return resolve("no-store");
          const count = db.transaction("outbox").objectStore("outbox").count();
          count.onsuccess = () => resolve(count.result);
          count.onerror = () => resolve("count-error");
        };
        req.onerror = () => resolve("open-error");
        setTimeout(() => resolve("timeout"), 3000);
      })
  );
}

test("une écriture tentée hors-ligne est mise en file puis rejouée à la reconnexion", async ({
  page,
}) => {
  const goalName = `Objectif hors-ligne ${Date.now()}`;

  await installOnlineSwitch(page);
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|workspace)/, { timeout: 25_000 });

  await page.goto("/goals");
  await setOnline(page, false);
  await page.getByRole("button", { name: /nouvel objectif/i }).click();
  await page.getByPlaceholder("Nom de l'objectif").fill(goalName);
  await page.locator('[role="dialog"]').getByRole("button", { name: /^Créer$/ }).click();

  await expect.poll(() => outboxCount(page), { timeout: 15_000 }).toBe(1);
  await expect(
    page.getByRole("status", { name: /attente de synchronisation/i })
  ).toBeVisible();

  await setOnline(page, true);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));

  await expect.poll(() => outboxCount(page), { timeout: 20_000 }).toBe(0);

  const found = await page.evaluate(
    async (name) => {
      const workspaces = await (await fetch("/api/workspaces")).json();
      const goals = await (
        await fetch(`/api/goals?workspaceId=${workspaces[0].id}`)
      ).json();
      const list = Array.isArray(goals) ? goals : goals.goals ?? [];
      return list.some((goal: { name: string }) => goal.name === name);
    },
    goalName
  );
  expect(found, "l’objectif créé hors-ligne doit exister après reconnexion").toBe(true);
});

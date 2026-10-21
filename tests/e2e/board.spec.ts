import { test, expect, Page } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "demo@clickup.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "password123";

const CARD = "[data-rfd-draggable-id]";
const COLUMN = "[data-rfd-droppable-id]";

async function login(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|workspace)/, { timeout: 25_000 });
}

async function firstBoardPath(page: Page): Promise<string> {
  const ids = await page.evaluate(async () => {
    const workspaces = await (await fetch("/api/workspaces")).json();
    const workspaceId = workspaces[0].id;
    const spaces = await (await fetch(`/api/spaces?workspaceId=${workspaceId}`)).json();
    const spaceId = (Array.isArray(spaces) ? spaces : spaces.spaces)[0].id;

    // Les listes peuvent être rangées dans des dossiers : on teste les deux cas.
    let lists = await (await fetch(`/api/lists?spaceId=${spaceId}`)).json();
    let resolved = Array.isArray(lists) ? lists : lists.lists;
    if (resolved.length === 0) {
      const folders = await (await fetch(`/api/folders?spaceId=${spaceId}`)).json();
      for (const folder of Array.isArray(folders) ? folders : folders.folders ?? []) {
        lists = await (await fetch(`/api/lists?folderId=${folder.id}`)).json();
        resolved = Array.isArray(lists) ? lists : lists.lists;
        if (resolved.length > 0) break;
      }
    }
    return { workspaceId, spaceId, listId: resolved[0]?.id as string | undefined };
  });
  test.skip(!ids.listId, "aucune liste disponible dans la base de test");
  return `/workspace/${ids.workspaceId}/space/${ids.spaceId}/list/${ids.listId}/board`;
}

test("la connexion aboutit au tableau de bord", async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/dashboard|workspace/);
});

test("les cartes des tâches s’affichent dans les colonnes", async ({ page }) => {
  await login(page);
  await page.goto(await firstBoardPath(page));
  const cards = page.locator(CARD);
  await expect(cards.first()).toBeVisible({ timeout: 25_000 });
  expect(await cards.count()).toBeGreaterThan(0);
});

test("une carte déplacée reste dans sa colonne après rechargement", async ({ page }) => {
  await login(page);
  await page.goto(await firstBoardPath(page));

  const columns = page.locator(COLUMN);
  await expect(columns.first()).toBeVisible({ timeout: 25_000 });
  const columnCount = await columns.count();
  test.skip(columnCount < 2, "au moins deux colonnes sont requises");

  // Le tableau défile horizontalement : on amène la colonne cible dans le
  // viewport avant de mesurer ses coordonnées, sinon la souris tombe à vide.
  let sourceIndex = -1;
  for (let i = 0; i < columnCount - 1; i++) {
    if ((await columns.nth(i).locator(CARD).count()) > 0) {
      sourceIndex = i;
      break;
    }
  }
  test.skip(sourceIndex === -1, "aucune carte à déplacer dans la base de test");
  const targetIndex = sourceIndex + 1;

  const card = columns.nth(sourceIndex).locator(CARD).first();
  const cardId = await card.getAttribute("data-rfd-draggable-id");
  const targetColumnId = await columns.nth(targetIndex).getAttribute("data-rfd-droppable-id");
  const landed = page.locator(
    `[data-rfd-droppable-id="${targetColumnId}"] [data-rfd-draggable-id="${cardId}"]`
  );

  await columns.nth(targetIndex).scrollIntoViewIfNeeded();
  await card.scrollIntoViewIfNeeded();

  for (let attempt = 0; attempt < 2 && !(await landed.isVisible().catch(() => false)); attempt++) {
    const from = await card.boundingBox();
    const to = await columns.nth(targetIndex).boundingBox();
    test.skip(!from || !to, "colonnes non mesurables");

    // @hello-pangea/dnd n'amorce un glisser que si le premier mouvement dépasse
    // quelques pixels : on saisi la carte près de son bord supérieur.
    await page.mouse.move(from!.x + from!.width / 2, from!.y + 12);
    await page.mouse.down();
    await page.mouse.move(from!.x + from!.width / 2 + 8, from!.y + 24);
    await page.waitForTimeout(200);
    for (let i = 1; i <= 25; i++) {
      await page.mouse.move(
        from!.x + ((to!.x + to!.width / 2 - from!.x) * i) / 25,
        from!.y + 24 + ((to!.y + to!.height / 2 - from!.y - 24) * i) / 25
      );
      await page.waitForTimeout(25);
    }
    await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2);
    await page.waitForTimeout(150);
    await page.mouse.up();
    await page.waitForTimeout(1000);
  }

  await expect(landed).toBeVisible({ timeout: 15_000 });

  await page.reload();
  await expect(columns.first()).toBeVisible({ timeout: 25_000 });
  await expect(landed).toBeVisible({ timeout: 25_000 });
});

test("les boîtes de dialogue exposent un titre accessible", async ({ page }) => {
  const messages: string[] = [];
  page.on("console", (m) => messages.push(`${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => messages.push(`pageerror: ${e.message}`));

  await login(page);
  await page.goto(await firstBoardPath(page));
  await page.locator(CARD).first().click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press("Escape");

  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("Escape");

  const a11y = messages.filter((m) => m.includes("requires a DialogTitle"));
  expect(a11y, "Radix exige un DialogTitle dans chaque DialogContent").toHaveLength(0);
});

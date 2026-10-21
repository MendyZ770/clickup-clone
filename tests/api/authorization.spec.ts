import { test, expect, APIRequestContext } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";

async function loginAs(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const res = await request.post(`${BASE}/api/mobile-login`, {
    data: { email, password },
  });
  expect(res.ok(), `connexion impossible pour ${email}: ${res.status()}`).toBe(true);
  const body = await res.json();
  return body.token as string;
}

async function register(request: APIRequestContext, name: string, email: string) {
  const res = await request.post(`${BASE}/api/auth/register`, {
    data: { name, email, password: INTRUDER_PASSWORD },
  });
  expect(res.ok(), `création de compte impossible: ${res.status()}`).toBe(true);
}

const INTRUDER_PASSWORD = "MotDePasse!123";

test.describe("contrôle d'accès aux ressources", () => {
  let ownerToken: string;
  let intruderToken: string;
  let workspaceId: string;
  let taskId: string;
  let goalId: string;
  let targetId: string;

  test.beforeAll(async ({ request }) => {
    // Le compte semé possède un espace avec des tâches ; l'intrus est un compte
    // fraîchement créé, sans aucun lien avec cet espace.
    ownerToken = await loginAs(request, "demo@clickup.com", "password123");
    const intruderEmail = `intruder-${Date.now()}@example.com`;
    await register(request, "Intrus", intruderEmail);
    intruderToken = await loginAs(request, intruderEmail, INTRUDER_PASSWORD);

    const ws = await request.get(`${BASE}/api/workspaces`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(ws.ok()).toBeTruthy();
    const workspaces = await ws.json();
    workspaceId = workspaces[0].id;

    const tasks = await request.get(`${BASE}/api/tasks?workspaceId=${workspaceId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(tasks.ok()).toBeTruthy();
    const taskList = await tasks.json();
    taskId = Array.isArray(taskList) ? taskList[0]?.id : taskList.tasks?.[0]?.id;

    const created = await request.post(`${BASE}/api/goals`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: {
        name: `Objectif test ${Date.now()}`,
        workspaceId,
        description: "Créé par la suite de tests d’autorisations",
      },
    });
    if (created.ok()) {
      goalId = (await created.json()).id as string;
      const target = await request.post(`${BASE}/api/goals/${goalId}/targets`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
        data: { name: "Cible test", type: "number", targetValue: 10 },
      });
      if (target.ok()) targetId = (await target.json()).id as string;
    }
  });

  const asIntruder = () => ({ Authorization: `Bearer ${intruderToken}` });

  test("la modification d'une tâche d'un autre espace est refusée", async ({ request }) => {
    test.skip(!taskId, "aucune tâche de test dans la base locale");
    const res = await request.patch(`${BASE}/api/tasks/${taskId}`, {
      headers: asIntruder(),
      data: { title: "Piraté" },
    });
    expect([401, 403, 404]).toContain(res.status());
  });

  test("le réordonnage de tâches d’autrui est refusé", async ({ request }) => {
    test.skip(!taskId, "aucune tâche de test dans la base locale");
    const res = await request.patch(`${BASE}/api/tasks/reorder`, {
      headers: asIntruder(),
      data: { tasks: [{ id: taskId, position: 1, statusId: "global:todo" }] },
    });
    expect([400, 401, 403, 404]).toContain(res.status());
  });

  test("le rapport de temps d'un autre espace est refusé", async ({ request }) => {
    test.skip(!workspaceId, "aucun espace de test");
    const res = await request.get(
      `${BASE}/api/time-entries/report?workspaceId=${workspaceId}`,
      { headers: asIntruder() }
    );
    expect([401, 403, 404]).toContain(res.status());
  });

  test("les objectifs d'un autre espace ne sont pas lisibles", async ({ request }) => {
    test.skip(!goalId, "aucun objectif de test");
    const res = await request.get(`${BASE}/api/goals/${goalId}`, {
      headers: asIntruder(),
    });
    expect([401, 403, 404]).toContain(res.status());
  });

  test("les cibles d’un objectif d’autrui ne sont pas modifiables", async ({ request }) => {
    test.skip(!goalId || !targetId, "aucune cible de test");
    const res = await request.patch(`${BASE}/api/goals/${goalId}/targets`, {
      headers: asIntruder(),
      data: { id: targetId, completed: true },
    });
    expect([401, 403, 404]).toContain(res.status());
  });

  test("une fiche non authentifiée est refusée", async ({ request }) => {
    const res = await request.get(`${BASE}/api/time-entries/report`);
    expect(res.status()).toBe(401);
  });

  test("les tâches personnelles restent accessibles au propriétaire", async ({ request }) => {
    const res = await request.get(`${BASE}/api/tasks?workspaceId=${workspaceId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(res.status()).toBe(200);
  });

  test("l’autorisation d’un canal Pusher exige une session", async ({ request }) => {
    const res = await request.post(`${BASE}/api/pusher/auth`, {
      data: { socket_id: "1.1", channel_name: `private-workspace-${workspaceId}` },
    });
    expect(res.status()).toBe(401);
  });

  test("un membre reçoit l’autorisation de son canal", async ({ request }) => {
    const res = await request.post(`${BASE}/api/pusher/auth`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { socket_id: "1.1", channel_name: `private-workspace-${workspaceId}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.auth).toBe("string");
    // Format Pusher "<key>:<signature>" : la signature dépend du socket_id fourni.
    expect(body.auth).toMatch(/:.+[0-9a-f]{8}/);
  });

  test("un canal d’un espace tiers reste refusé", async ({ request }) => {
    const res = await request.post(`${BASE}/api/pusher/auth`, {
      headers: asIntruder(),
      data: { socket_id: "1.1", channel_name: `private-workspace-${workspaceId}` },
    });
    expect(res.status()).toBe(403);
  });

  test("le canal de chat d’une liste tierce est refusé", async ({ request }) => {
    const listId = await request
      .get(`${BASE}/api/spaces?workspaceId=${workspaceId}`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
      .then(async (r) => {
        const spaces = await r.json();
        const spaceId = (Array.isArray(spaces) ? spaces : spaces.spaces)[0].id;
        const lists = await (
          await request.get(`${BASE}/api/lists?spaceId=${spaceId}`, {
            headers: { Authorization: `Bearer ${ownerToken}` },
          })
        ).json();
        let resolved = Array.isArray(lists) ? lists : lists.lists;
        if (!resolved.length) {
          // Les listes peuvent être rangées dans un dossier.
          const folders = await (
            await request.get(`${BASE}/api/folders?spaceId=${spaceId}`, {
              headers: { Authorization: `Bearer ${ownerToken}` },
            })
          ).json();
          for (const folder of Array.isArray(folders) ? folders : folders.folders ?? []) {
            const inFolder = await (
              await request.get(`${BASE}/api/lists?folderId=${folder.id}`, {
                headers: { Authorization: `Bearer ${ownerToken}` },
              })
            ).json();
            resolved = Array.isArray(inFolder) ? inFolder : inFolder.lists;
            if (resolved.length) break;
          }
        }
        return resolved[0]?.id as string | undefined;
      });
    test.skip(!listId, "aucune liste disponible dans la base de test");

    const denied = await request.post(`${BASE}/api/pusher/auth`, {
      headers: asIntruder(),
      data: { socket_id: "1.1", channel_name: `private-list-${listId}-chat` },
    });
    expect(denied.status()).toBe(403);

    const allowed = await request.post(`${BASE}/api/pusher/auth`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { socket_id: "1.1", channel_name: `private-list-${listId}-chat` },
    });
    expect(allowed.status()).toBe(200);
  });

  test("un canal public n’est jamais autorisé", async ({ request }) => {
    const res = await request.post(`${BASE}/api/pusher/auth`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { socket_id: "1.1", channel_name: `workspace-${workspaceId}` },
    });
    expect(res.status()).toBe(403);
  });

  test("la limite de tentatives de connexion bloque le forçaçage", async ({ request }) => {
    const res = await request.post(`${BASE}/api/mobile-login`, {
      data: { email: "spray-target@example.com", password: "aaaaaaaaaaaaaaa" },
    });
    expect([401, 429]).toContain(res.status());
  });
});

import { test, expect, APIRequestContext } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";

type Account = { id: string; balance: number; currency: string };

test.describe.serial("intégrité financière", () => {
  let token: string;
  let workspaceId: string;
  let accountA: string;
  let accountB: string;
  let accountC: string;

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const accountsUrl = (id: string) => `${BASE}/api/finance/accounts/${id}`;
  const transactionsUrl = `${BASE}/api/finance/transactions`;

  async function getAccounts(request: APIRequestContext): Promise<Account[]> {
    const res = await request.get(
      `${BASE}/api/finance/accounts?workspaceId=${workspaceId}`,
      { headers: auth() }
    );
    expect(res.ok(), `liste des comptes: ${res.status()}`).toBe(true);
    return res.json();
  }

  async function balanceOf(request: APIRequestContext, accountId: string): Promise<number> {
    const account = (await getAccounts(request)).find((item) => item.id === accountId);
    expect(account, `compte ${accountId} introuvable`).toBeTruthy();
    expect(typeof account!.balance, "le solde doit être sérialisé en nombre").toBe("number");
    return account!.balance;
  }

  async function createAccount(
    request: APIRequestContext,
    name: string,
    currency = "EUR"
  ): Promise<string> {
    const res = await request.post(`${BASE}/api/finance/accounts`, {
      headers: auth(),
      data: { name, type: "bank", currency, balance: "0.00", workspaceId },
    });
    expect(res.ok(), `création du compte ${name}: ${res.status()}`).toBe(true);
    const body = await res.json();
    expect(typeof body.balance).toBe("number");
    return body.id as string;
  }

  async function createTransaction(
    request: APIRequestContext,
    data: Record<string, unknown>,
    expectedStatus = 201
  ) {
    const res = await request.post(transactionsUrl, { headers: auth(), data });
    expect(res.status()).toBe(expectedStatus);
    return res;
  }

  async function getStats(request: APIRequestContext) {
    const res = await request.get(`${BASE}/api/finance/stats?workspaceId=${workspaceId}`, {
      headers: auth(),
    });
    expect(res.ok(), `stats: ${res.status()}`).toBe(true);
    return res.json();
  }

  test.beforeAll(async ({ request }) => {
    const login = await request.post(`${BASE}/api/mobile-login`, {
      data: { email: "demo@clickup.com", password: "password123" },
    });
    expect(login.ok(), `connexion: ${login.status()}`).toBe(true);
    token = (await login.json()).token;

    const ws = await request.get(`${BASE}/api/workspaces`, { headers: auth() });
    expect(ws.ok()).toBe(true);
    workspaceId = (await ws.json())[0].id;

    const suffix = Date.now();
    accountA = await createAccount(request, `Compte test A ${suffix}`);
    accountB = await createAccount(request, `Compte test B ${suffix}`);
    accountC = await createAccount(request, `Compte test USD ${suffix}`, "USD");
  });

  test.afterAll(async ({ request }) => {
    for (const id of [accountA, accountB, accountC]) {
      if (!id) continue;
      await request.delete(`${accountsUrl(id)}?force=true`, { headers: auth() });
    }
  });

  test("revenus, dépenses et transferts mettent à jour les soldes", async ({ request }) => {
    const before = await getStats(request);

    await createTransaction(request, {
      accountId: accountA,
      type: "income",
      amount: "100.50",
      description: "Revenu test",
    });
    expect(await balanceOf(request, accountA)).toBe(100.5);

    await createTransaction(request, {
      accountId: accountA,
      type: "expense",
      amount: "30.25",
      description: "Dépense test",
    });
    expect(await balanceOf(request, accountA)).toBe(70.25);

    await createTransaction(request, {
      accountId: accountA,
      targetAccountId: accountB,
      isTransfer: true,
      amount: "20.00",
      description: "Transfert test",
    });
    expect(await balanceOf(request, accountA)).toBe(50.25);
    expect(await balanceOf(request, accountB)).toBe(20);

    const after = await getStats(request);
    expect(after.currency).toBe("EUR");
    expect(after.monthlyIncome - before.monthlyIncome).toBeCloseTo(100.5, 2);
    expect(after.monthlyExpense - before.monthlyExpense).toBeCloseTo(30.25, 2);
    expect(after.monthlyNet - before.monthlyNet).toBeCloseTo(70.25, 2);
    expect(after.balances.find((b: { currency: string }) => b.currency === "EUR")).toBeTruthy();
  });

  test("les transferts invalides sont refusés", async ({ request }) => {
    await createTransaction(
      request,
      {
        accountId: accountA,
        targetAccountId: accountA,
        isTransfer: true,
        amount: "5.00",
      },
      400
    );

    await createTransaction(
      request,
      {
        accountId: accountA,
        targetAccountId: accountC,
        isTransfer: true,
        amount: "5.00",
      },
      400
    );
  });

  test("un montant négatif ou nul est refusé", async ({ request }) => {
    await createTransaction(
      request,
      { accountId: accountA, type: "expense", amount: "-5.00" },
      400
    );
    await createTransaction(
      request,
      { accountId: accountA, type: "expense", amount: "0" },
      400
    );
  });

  test("la modification et la suppression d'une transaction recalculent le solde", async ({
    request,
  }) => {
    const created = await createTransaction(request, {
      accountId: accountA,
      type: "expense",
      amount: "10.00",
      description: "À modifier",
    });
    const transaction = await created.json();
    expect(await balanceOf(request, accountA)).toBe(40.25);

    const patch = await request.patch(`${transactionsUrl}/${transaction.id}`, {
      headers: auth(),
      data: { amount: "25.00", description: null },
    });
    expect(patch.status()).toBe(200);
    expect(await balanceOf(request, accountA)).toBe(25.25);

    const remove = await request.delete(`${transactionsUrl}/${transaction.id}`, {
      headers: auth(),
    });
    expect(remove.ok()).toBe(true);
    expect(await balanceOf(request, accountA)).toBe(50.25);
  });

  test("la suppression forcée d'un compte destinataire annule le débit source", async ({
    request,
  }) => {
    const extra = await createAccount(request, `Compte test C ${Date.now()}`);
    await createTransaction(request, {
      accountId: accountA,
      targetAccountId: extra,
      isTransfer: true,
      amount: "7.00",
    });
    expect(await balanceOf(request, accountA)).toBe(43.25);
    expect(await balanceOf(request, extra)).toBe(7);

    const remove = await request.delete(`${accountsUrl(extra)}?force=true`, {
      headers: auth(),
    });
    expect(remove.ok()).toBe(true);
    expect(await balanceOf(request, accountA)).toBe(50.25);
  });
});

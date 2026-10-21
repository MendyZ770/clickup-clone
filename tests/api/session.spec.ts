import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";

test("la déconnexion mobile révoque le JWT émis", async ({ request }) => {
  const login = await request.post(`${BASE}/api/mobile-login`, {
    data: { email: "demo@clickup.com", password: "password123" },
  });
  expect(login.ok(), `connexion mobile: ${login.status()}`).toBe(true);
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };

  const before = await request.get(`${BASE}/api/mobile-me`, { headers });
  expect(before.status()).toBe(200);

  const logout = await request.post(`${BASE}/api/mobile-logout`, { headers });
  expect(logout.status()).toBe(200);

  const after = await request.get(`${BASE}/api/mobile-me`, { headers });
  expect(after.status(), "un token révoqué ne doit plus authentifier").toBe(401);
});

import jwt from "jsonwebtoken";

export function getEnableBankingToken() {
  const appId = process.env.EB_APP_ID;
  const privateKey = process.env.EB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error("Missing Enable Banking credentials in environment variables.");
  }

  // Handle newlines if they were escaped as '\n' in the .env file
  const formattedKey = privateKey.replace(/\\n/g, '\n');

  const payload = {
    iss: appId,
    aud: "api.enablebanking.com",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // Valid for 1 hour
  };

  const token = jwt.sign(payload, formattedKey, {
    algorithm: "RS256",
    header: {
      typ: "JWT",
      alg: "RS256",
      kid: appId
    }
  });

  return token;
}

export async function fetchEnableBanking(endpoint: string, options: RequestInit = {}) {
  const token = getEnableBankingToken();
  
  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  const response = await fetch(`https://api.enablebanking.com${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Enable Banking API Error: ${response.status} ${errText}`);
  }

  return response.json();
}

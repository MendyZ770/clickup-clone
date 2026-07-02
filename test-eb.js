const jwt = require("jsonwebtoken");

function getEnableBankingToken() {
  const appId = process.env.EB_APP_ID;
  const privateKey = process.env.EB_PRIVATE_KEY.replace(/\\n/g, '\n');

  const payload = {
    iss: appId,
    aud: "api.enablebanking.com",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    header: { typ: "JWT", alg: "RS256", kid: appId }
  });
}

async function test() {
  require("dotenv").config({ path: ".env.local" });
  
  const token = getEnableBankingToken();
  const sessionId = "2e21c546-60e4-48c5-9f5f-206b08a71117";
  const accId = "f37c5c0a-8eb9-4e42-a543-399dccdc5739";

  const res1 = await fetch(`https://api.enablebanking.com/sessions/${sessionId}/accounts/${accId}/balances`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("/sessions/../balances:", res1.status, await res1.text());

  const res2 = await fetch(`https://api.enablebanking.com/accounts/${accId}/balances`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("/accounts/../balances:", res2.status, await res2.text());
}
test();

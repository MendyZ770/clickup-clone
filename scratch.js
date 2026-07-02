const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const appId = env.match(/EB_APP_ID=([^\n]+)/)[1].trim();
let privateKey = env.match(/EB_PRIVATE_KEY="([^"]+)"/)[1];
const jwt = require('jsonwebtoken');

async function test() {
  try {
    const payload = {
      iss: appId,
      aud: "api.enablebanking.com",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    
    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      header: { typ: "JWT", alg: "RS256", kid: appId }
    });
    
    console.log("Token OK.");
    
    const res = await fetch("https://api.enablebanking.com/aspsps?country=FR", {
      headers: { "Authorization": "Bearer " + token }
    });
    
    if(!res.ok) {
      console.log("HTTP Error:", res.status, await res.text());
    } else {
      const data = await res.json();
      console.log("Success! Banks found:", data.aspsps.length);
    }
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();

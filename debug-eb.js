const fs = require('fs');
const jwt = require('jsonwebtoken');
const https = require('https');

// Parse .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[match[1]] = val;
  }
});

function getEnableBankingToken() {
  const appId = process.env.EB_APP_ID;
  const privateKey = process.env.EB_PRIVATE_KEY.replace(/\\n/g, '\n');

  const payload = {
    iss: appId,
    aud: 'api.enablebanking.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    header: { typ: 'JWT', alg: 'RS256', kid: appId }
  });
}

function fetchApi(path) {
  return new Promise((resolve, reject) => {
    const token = getEnableBankingToken();
    const req = https.request({
      hostname: 'api.enablebanking.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  try {
    const accId = 'f37c5c0a-8eb9-4e42-a543-399dccdc5739'; // Compte joint
    console.log("Fetching balances...");
    const bal = await fetchApi(`/accounts/${accId}/balances`);
    console.log("Balances:", bal.status, bal.body);

    console.log("Fetching transactions...");
    const tx = await fetchApi(`/accounts/${accId}/transactions`);
    console.log("Transactions:", tx.status, tx.body.substring(0, 500) + '...');
  } catch(e) {
    console.error(e);
  }
}

test();

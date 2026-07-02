import NordigenClient from "nordigen-node";

let _client: any = null;

export async function getGoCardlessClient() {
  if (_client) return _client;

  const client = new NordigenClient({
    secretId: process.env.GC_SECRET_ID || "dummy",
    secretKey: process.env.GC_SECRET_KEY || "dummy",
  });

  if (process.env.GC_SECRET_ID && process.env.GC_SECRET_KEY) {
    try {
      await client.generateToken();
    } catch (e) {
      console.error("GoCardless Token Error:", e);
    }
  }
  
  _client = client;
  return client;
}

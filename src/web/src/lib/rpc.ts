import { Connection } from "@solana/web3.js";
import { getRpcUrl, getWsUrl } from "./config";

// Reuse a single Connection per RPC url; rebuild when the user changes the endpoint.
let cached: { url: string; conn: Connection } | null = null;

export function getConnection(): Connection {
  const url = getRpcUrl();
  if (!cached || cached.url !== url) {
    const ws = getWsUrl();
    cached = {
      url,
      // Pass an explicit wsEndpoint when configured, so PubSub (8900) resolves to the right
      // host instead of web3.js guessing wss://<rpc-host> (which the tunnel can't serve).
      conn: new Connection(url, ws ? { commitment: "confirmed", wsEndpoint: ws } : "confirmed"),
    };
  }
  return cached.conn;
}

export async function pingNode(): Promise<{ ok: boolean; version?: string; error?: string }> {
  try {
    const v = await getConnection().getVersion();
    return { ok: true, version: v["solana-core"] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

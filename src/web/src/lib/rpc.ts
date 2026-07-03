import { Connection } from "@solana/web3.js";
import { getRpcUrl } from "./config";

// Reuse a single Connection per RPC url; rebuild when the user changes the endpoint.
let cached: { url: string; conn: Connection } | null = null;

export function getConnection(): Connection {
  const url = getRpcUrl();
  if (!cached || cached.url !== url) {
    cached = { url, conn: new Connection(url, "confirmed") };
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

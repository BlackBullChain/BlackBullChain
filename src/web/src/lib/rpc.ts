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

export interface RawBlock {
  blockhash: string;
  previousBlockhash: string;
  parentSlot: number;
  blockHeight: number | null;
  blockTime: number | null;
  signatures: string[];
}

// Raw JSON-RPC getBlock. web3.js's typed getBlock runs a strict struct validator that throws
// ("At path: transactions -- Expected an array value") on signature-only blocks from this
// node, so we bypass it and parse the response ourselves.
export async function getBlockRaw(slot: number): Promise<RawBlock | null> {
  const res = await fetch(getRpcUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBlock",
      // "confirmed" is available ~1 slot after production; the default "finalized" lags many
      // slots, which left freshly-streamed blocks permanently blank.
      params: [
        slot,
        { transactionDetails: "signatures", rewards: false, maxSupportedTransactionVersion: 0, commitment: "confirmed" },
      ],
    }),
  });
  const json = await res.json();
  if (json.error) {
    // block not available / skipped / cleaned up -> treat as "no block", not an error
    if ([-32004, -32007, -32009].includes(json.error.code)) return null;
    throw new Error(json.error.message || "getBlock failed");
  }
  const r = json.result;
  if (!r) return null;
  return {
    blockhash: r.blockhash,
    previousBlockhash: r.previousBlockhash,
    parentSlot: r.parentSlot,
    blockHeight: r.blockHeight ?? null,
    blockTime: r.blockTime ?? null,
    signatures: r.signatures ?? [],
  };
}

export interface Transfer {
  signature: string;
  slot: number;
  blockTime: number | null;
  source: string;
  destination: string;
  lamports: number;
}

// Raw getBlock with parsed instructions, so we can read SystemProgram transfers directly
// (source / destination / lamports) without decoding base58 instruction data ourselves.
async function getParsedBlockRaw(slot: number): Promise<any | null> {
  const res = await fetch(getRpcUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBlock",
      params: [
        slot,
        { encoding: "jsonParsed", transactionDetails: "full", rewards: false, maxSupportedTransactionVersion: 0, commitment: "confirmed" },
      ],
    }),
  });
  const json = await res.json();
  if (json.error) return null;
  return json.result ?? null;
}

// Scan recent blocks for real wallet-to-wallet BBC transfers (System Program transfers).
// Vote transactions are a different program, so they're naturally excluded.
export async function getRecentTransfers(scanBlocks = 60, limit = 40): Promise<Transfer[]> {
  const conn = getConnection();
  const tip = await conn.getSlot("confirmed");
  const slots = await conn.getBlocks(Math.max(0, tip - scanBlocks), tip);
  const newestFirst = slots.slice().reverse();
  const blocks = await Promise.all(newestFirst.map((s) => getParsedBlockRaw(s).catch(() => null)));

  const out: Transfer[] = [];
  for (let i = 0; i < blocks.length && out.length < limit; i++) {
    const block = blocks[i];
    if (!block) continue;
    const slot = newestFirst[i];
    for (const tx of block.transactions ?? []) {
      const sig: string | undefined = tx?.transaction?.signatures?.[0];
      const instrs: any[] = tx?.transaction?.message?.instructions ?? [];
      for (const ix of instrs) {
        if (ix?.program === "system" && ix?.parsed?.type === "transfer" && sig) {
          const info = ix.parsed.info || {};
          out.push({
            signature: sig,
            slot,
            blockTime: block.blockTime ?? null,
            source: info.source,
            destination: info.destination,
            lamports: Number(info.lamports ?? 0),
          });
        }
      }
      if (out.length >= limit) break;
    }
  }
  return out;
}

export async function pingNode(): Promise<{ ok: boolean; version?: string; error?: string }> {
  try {
    const v = await getConnection().getVersion();
    return { ok: true, version: v["solana-core"] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// BlackBullChain peg relayer — pump.fun $BBC (Solana) -> native BBC, 1:1.
//
// It watches the bridge treasury's $BBC token account on Solana. For each new deposit it
// reads the transfer amount + the memo (the depositor's BlackBullChain address) and sends
// the same amount of native BBC from the bridge reserve on BlackBullChain.
//
// v1 is operator-trusted (holds the reserve key). See docs/adr/0002-peg-bridge.md.
//
//   cd scripts/peg-relayer && npm install && npm start
//
// Required env:
//   SOLANA_RPC          Solana RPC (mainnet) — reads deposits
//   BBC_RPC             BlackBullChain RPC — sends native BBC
//   PEG_TOKEN_MINT      SPL mint of $BBC on Solana
//   BRIDGE_TREASURY     Solana owner address holding the locked $BBC
//   RESERVE_KEYPAIR     path to bridge-reserve.json (native BBC payer)
// Optional: TOKEN_DECIMALS (default 6), POLL_MS (default 8000), STATE_FILE

import fs from "node:fs";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

const env = (k, d) => process.env[k] ?? d;
const SOLANA_RPC = env("SOLANA_RPC", "https://api.mainnet-beta.solana.com");
const BBC_RPC = env("BBC_RPC", "http://localhost:8899");
const MINT = new PublicKey(mustEnv("PEG_TOKEN_MINT"));
const TREASURY = new PublicKey(mustEnv("BRIDGE_TREASURY"));
const RESERVE = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(mustEnv("RESERVE_KEYPAIR")))));
const TOKEN_DECIMALS = Number(env("TOKEN_DECIMALS", "6"));
const POLL_MS = Number(env("POLL_MS", "8000"));
const STATE_FILE = env("STATE_FILE", "./relayer-state.json");

// native BBC has 9 decimals; whole-token amounts map 1:1
const SCALE = 10n ** BigInt(9 - TOKEN_DECIMALS);

const sol = new Connection(SOLANA_RPC, "confirmed");
const bbc = new Connection(BBC_RPC, "confirmed");

function mustEnv(k) {
  const v = process.env[k];
  if (!v) throw new Error(`Missing required env ${k}`);
  return v;
}
function loadState() {
  try {
    return new Set(JSON.parse(fs.readFileSync(STATE_FILE, "utf8")).processed);
  } catch {
    return new Set();
  }
}
function saveState(set) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({ processed: [...set] }, null, 2));
}

// Pull the $BBC amount received by the treasury + the memo (destination) from one tx.
function parseDeposit(tx, treasuryAta) {
  if (!tx || tx.meta?.err) return null;
  const ataStr = treasuryAta.toBase58();
  const keys = tx.transaction.message.accountKeys.map((k) => (k.pubkey ?? k).toString());
  const idx = keys.indexOf(ataStr);
  if (idx < 0) return null;
  const pre = tx.meta.preTokenBalances?.find((b) => b.accountIndex === idx);
  const post = tx.meta.postTokenBalances?.find((b) => b.accountIndex === idx);
  if (!post || post.mint !== MINT.toBase58()) return null;
  const delta = BigInt(post.uiTokenAmount.amount) - BigInt(pre?.uiTokenAmount.amount ?? "0");
  if (delta <= 0n) return null;

  // memo instruction carries the destination BlackBullChain address
  const ix = tx.transaction.message.instructions.find((i) => i.program === "spl-memo");
  const memo = typeof ix?.parsed === "string" ? ix.parsed : ix?.parsed?.memo;
  if (!memo) return null;
  let dest;
  try {
    dest = new PublicKey(memo.trim());
  } catch {
    return null;
  }
  return { lamports: delta * SCALE, dest };
}

async function releaseNative(dest, lamports) {
  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: RESERVE.publicKey, toPubkey: dest, lamports: Number(lamports) }),
  );
  const { blockhash, lastValidBlockHeight } = await bbc.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = RESERVE.publicKey;
  const sig = await bbc.sendTransaction(tx, [RESERVE]);
  await bbc.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

async function main() {
  const treasuryAta = await getAssociatedTokenAddress(MINT, TREASURY, true);
  const processed = loadState();
  console.log(`[peg-relayer] watching treasury ATA ${treasuryAta.toBase58()}`);
  console.log(`[peg-relayer] releasing native BBC from ${RESERVE.publicKey.toBase58()}`);

  for (;;) {
    try {
      const sigs = await sol.getSignaturesForAddress(treasuryAta, { limit: 25 });
      // oldest first so credits happen in order
      for (const { signature } of sigs.reverse()) {
        if (processed.has(signature)) continue;
        const tx = await sol.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });
        const dep = parseDeposit(tx, treasuryAta);
        if (dep) {
          const outSig = await releaseNative(dep.dest, dep.lamports);
          console.log(`[peg] ${signature} -> released ${dep.lamports} lamports to ${dep.dest.toBase58()} (${outSig})`);
        }
        processed.add(signature);
        saveState(processed);
      }
    } catch (e) {
      console.error("[peg-relayer] loop error:", e.message);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

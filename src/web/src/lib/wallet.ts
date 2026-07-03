import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { LAMPORTS_PER_BBC } from "./config";

// Browser-only dev wallet: the secret key lives in localStorage. Fine for a dev/test
// network; for real value use a hardware wallet or the blackbull CLI keypair files.
const STORE_KEY = "bbc.wallet.secret";

export function loadWallet(): Keypair | null {
  try {
    const s = localStorage.getItem(STORE_KEY);
    if (!s) return null;
    return Keypair.fromSecretKey(bs58.decode(s));
  } catch {
    return null;
  }
}

export function saveWallet(kp: Keypair): void {
  localStorage.setItem(STORE_KEY, bs58.encode(kp.secretKey));
}

export function createWallet(): Keypair {
  const kp = Keypair.generate();
  saveWallet(kp);
  return kp;
}

// Accepts either a JSON byte array (blackbull-keygen format) or a base58 secret key.
export function importSecret(input: string): Keypair {
  const t = input.trim();
  const secret = t.startsWith("[")
    ? Uint8Array.from(JSON.parse(t) as number[])
    : bs58.decode(t);
  const kp = Keypair.fromSecretKey(secret);
  saveWallet(kp);
  return kp;
}

export function exportSecretBase58(kp: Keypair): string {
  return bs58.encode(kp.secretKey);
}

export function exportSecretJson(kp: Keypair): string {
  return JSON.stringify(Array.from(kp.secretKey));
}

export function forgetWallet(): void {
  localStorage.removeItem(STORE_KEY);
}

export async function sendBbc(
  conn: Connection,
  from: Keypair,
  toAddress: string,
  bbcAmount: number,
): Promise<string> {
  const lamports = Math.round(bbcAmount * LAMPORTS_PER_BBC);
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: new PublicKey(toAddress),
      lamports,
    }),
  );
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = from.publicKey;
  const sig = await conn.sendTransaction(tx, [from]);
  await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

export async function requestAirdrop(
  conn: Connection,
  to: PublicKey,
  bbcAmount: number,
): Promise<string> {
  const sig = await conn.requestAirdrop(to, Math.round(bbcAmount * LAMPORTS_PER_BBC));
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
  await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

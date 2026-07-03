// Central config. The RPC endpoint is overridable at runtime (localStorage) so users can
// point the site at their own BlackBullChain node without a rebuild.

export const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME || "BlackBullChain";
export const TICKER = import.meta.env.VITE_TICKER || "BBC";

// 1 BBC = 1e9 lamports (same base unit as the underlying Agave/Solana runtime).
export const LAMPORTS_PER_BBC = 1_000_000_000;

export const DEFAULT_RPC_URL = import.meta.env.VITE_RPC_URL || "http://localhost:8899";
export const FAUCET_URL = import.meta.env.VITE_FAUCET_URL || "";

const RPC_KEY = "bbc.rpcUrl";

export function getRpcUrl(): string {
  try {
    return localStorage.getItem(RPC_KEY) || DEFAULT_RPC_URL;
  } catch {
    return DEFAULT_RPC_URL;
  }
}

export function setRpcUrl(url: string): void {
  localStorage.setItem(RPC_KEY, url.trim());
}

export function resetRpcUrl(): void {
  localStorage.removeItem(RPC_KEY);
}

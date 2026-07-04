// Central config. The RPC endpoint is fixed at build time (VITE_RPC_URL) — point it at the
// public BlackBullChain node (e.g. the Mac Mini validator exposed over Tailscale) so anyone
// can watch blocks. No in-app endpoint editing.

export const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME || "BlackBullChain";
export const TICKER = import.meta.env.VITE_TICKER || "BBC";

// 1 BBC = 1e9 lamports. Fixed total supply: 1,000,000,000 BBC (matches the pump.fun token).
export const LAMPORTS_PER_BBC = 1_000_000_000;
export const TOTAL_SUPPLY_BBC = 1_000_000_000;

export const DEFAULT_RPC_URL = import.meta.env.VITE_RPC_URL || "http://localhost:8899";
export const FAUCET_URL = import.meta.env.VITE_FAUCET_URL || "";

// pump.fun page for the $BBC token. Set VITE_PUMPFUN_URL to https://pump.fun/coin/<mint>.
export const PUMPFUN_URL = import.meta.env.VITE_PUMPFUN_URL || "https://pump.fun";

// ---- 1:1 peg (pump.fun $BBC SPL on Solana  ->  native BBC on BlackBullChain) ----
// SPL mint of the $BBC token on Solana (the pump.fun token).
export const PEG_TOKEN_MINT = import.meta.env.VITE_PEG_TOKEN_MINT || "";
// Solana address users deposit their $BBC into to peg (the bridge treasury).
export const BRIDGE_TREASURY = import.meta.env.VITE_BRIDGE_TREASURY || "";
// Solana RPC used by the Peg page to read the token/treasury.
export const SOLANA_RPC = import.meta.env.VITE_SOLANA_RPC || "https://api.mainnet-beta.solana.com";

export function getRpcUrl(): string {
  return DEFAULT_RPC_URL;
}

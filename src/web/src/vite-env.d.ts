/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL?: string;
  readonly VITE_FAUCET_URL?: string;
  readonly VITE_CHAIN_NAME?: string;
  readonly VITE_TICKER?: string;
  readonly VITE_PUMPFUN_URL?: string;
  readonly VITE_PEG_TOKEN_MINT?: string;
  readonly VITE_BRIDGE_TREASURY?: string;
  readonly VITE_SOLANA_RPC?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

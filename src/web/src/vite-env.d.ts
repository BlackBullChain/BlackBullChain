/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL?: string;
  readonly VITE_FAUCET_URL?: string;
  readonly VITE_CHAIN_NAME?: string;
  readonly VITE_TICKER?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

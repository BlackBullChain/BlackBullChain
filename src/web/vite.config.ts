import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// @solana/web3.js expects Node globals (Buffer, process) in the browser.
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({ globals: { Buffer: true, process: true }, protocolImports: true }),
  ],
  server: { port: 5173 },
});

# BlackBullChain

A 1:1 fork of the [Agave](https://github.com/anza-xyz/agave) validator client (Solana's
canonical Rust node), rebranded to **BlackBullChain** and run as its own independent
network. Native token: **BlackBullChain (BBC)**.

This is not a Solana testnet/mainnet participant — it uses its own genesis, so it is a
distinct chain that happens to run Solana's proven runtime.

## What this is (and isn't)

- **Is:** the Agave codebase (v4.1.1) with a *user-facing rebrand* — CLI binaries, token
  display, network/genesis identity, and branding all say BlackBullChain / BBC.
- **Isn't:** a deep rename of internal `solana-*` crate names. That would break the build
  across a 200+ crate monorepo for zero user-visible benefit. See
  [ADR 0001](docs/adr/0001-fork-strategy.md).

## Layout

```
blackbullchain/
├── README.md
├── docs/
│   ├── SPEC.md                     # full rebrand spec + naming map + roadmap
│   └── adr/0001-fork-strategy.md   # why user-facing rebrand, not deep rename
├── scripts/
│   ├── rebrand.sh                  # applies the surgical rebrand to src/node
│   └── bootstrap-validator.sh      # genesis + launches the first BBC validator
├── tests/                          # our own smoke tests (not upstream's)
└── src/
    ├── node/                       # the Agave fork (upstream tree, rebranded)
    └── web/                        # website + block explorer + browser wallet (Vite/React)
```

## Website, explorer & wallet

`src/web/` is a Vite + React + TypeScript app: a landing page explaining the project, a
live **block explorer**, a **browser wallet** (create/import, send/receive BBC, faucet),
and **docs** (host a validator, connect, create a wallet). It speaks the Solana-compatible
JSON-RPC that a BlackBullChain node exposes, and the RPC endpoint is editable at runtime.

```bash
cd src/web
npm install
cp .env.example .env         # set VITE_RPC_URL to your node (default http://localhost:8899)
npm run dev                  # http://localhost:5173
npm run build                # static site in dist/ (deploy to Vercel/Netlify)
```

With no node reachable, the explorer/wallet degrade gracefully ("no node") — start one with
`scripts/bootstrap-validator.sh`, or point the endpoint at your Mac Mini over Tailscale.

## Quick start

```bash
# 1. Apply the rebrand to the vendored Agave tree
./scripts/rebrand.sh

# 2. Build (long; do this on the Mac Mini for the live node)
cd src/node && cargo build --release   # produces target/release/blackbull-*

# 3. Genesis + launch the first validator (the birth of the chain)
./scripts/bootstrap-validator.sh
```

## Rebrand at a glance

| Upstream | BlackBullChain |
|---|---|
| `agave-validator` | `blackbull-validator` |
| `solana` (CLI) | `blackbull` |
| `solana-keygen` | `blackbull-keygen` |
| `solana-genesis` | `blackbull-genesis` |
| `solana-gossip` / `-faucet` / `-test-validator` | `blackbull-gossip` / `-faucet` / `-test-validator` |
| `agave-ledger-tool` / `-install` / `-watchtower` | `blackbull-ledger-tool` / `-install` / `-watchtower` |
| Token unit `SOL` | `BBC` |

See [docs/SPEC.md](docs/SPEC.md) for the complete map and the path to a live node on the
Mac Mini.

Forked from Agave **v4.1.1**. Upstream is licensed Apache-2.0.

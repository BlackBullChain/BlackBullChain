# BlackBullChain

A 1:1 fork of the [Agave](https://github.com/anza-xyz/agave) validator client (Solana's
canonical Rust node), rebranded to **BlackBullChain** and run as its own independent
network. Native token: **BlackBullChain (BBC)**.

This is not a Solana testnet/mainnet participant — it has its own **genesis**, which at the
protocol level makes it a separate network: Solana nodes only gossip and replicate with
peers that share the same *genesis hash* and *shred version*, so a chain with a different
genesis can never join Solana.

## Live network

The chain is live, produced by a bootstrap validator, with a public HTTPS RPC.

| | |
|---|---|
| **Website / explorer / wallet** | https://blackbullchain.com |
| **Live blocks** | https://blackbullchain.com/blocks |
| **Public RPC (HTTP)** | https://rpc.blackbullchain.com |
| **Public RPC (WebSocket)** | wss://ws.blackbullchain.com |
| **Genesis hash** | `5cTSG1RJjRa1RQ9ZqgiQ6gWGzA72Mdf8nQ1LNp82pQoQ` |
| **Total supply** | 1,000,000,000 BBC (fixed, `--inflation none`) |

Point any Solana-compatible tool at the RPC and it just works:

```bash
# health check — anyone can verify the node is up
curl -s https://rpc.blackbullchain.com -X POST -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'      # -> {"result":"ok"}

# with the CLI
blackbull config set --url https://rpc.blackbullchain.com
blackbull block-height
```

That genesis hash is unrelated to Solana mainnet's
`5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d`, and the supply is a **fixed
1,000,000,000 BBC** (matching the pump.fun $BBC supply).

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
│   └── adr/                        # architecture decision records
├── scripts/
│   ├── rebrand.sh                  # applies the surgical rebrand to src/node
│   ├── bootstrap-validator.sh      # genesis + launches the first BBC validator
│   ├── run-validator-service.sh    # launchd entrypoint: always-on validator
│   └── run-tunnel-service.sh       # launchd entrypoint: Cloudflare named tunnel (public RPC)
└── src/
    ├── node/                       # the Agave fork (upstream tree, rebranded)
    └── web/                        # website + block explorer + browser wallet (Vite/React)
```

## Website, explorer & wallet

`src/web/` is a Vite + React + TypeScript app: a landing page, a live **block explorer**,
a real-time **Blocks** stream (subscribes to the node over WebSocket), a **browser wallet**
(create/import, send/receive BBC, faucet), and **docs**. It speaks the Solana-compatible
JSON-RPC a BlackBullChain node exposes. The RPC endpoint is fixed at build time via env vars
(no in-app editing) so the deployed site always points at the canonical node.

```bash
cd src/web
npm install
cp .env.example .env          # then edit .env (see below)
npm run dev                   # http://localhost:5173
npm run build                 # static site in dist/ (deploy to Vercel/Netlify)
```

Environment variables (`src/web/.env`, all optional — sensible fallbacks built in):

| Var | Purpose | Example |
|---|---|---|
| `VITE_RPC_URL` | HTTP JSON-RPC endpoint | `https://rpc.blackbullchain.com` |
| `VITE_WS_URL` | WebSocket (PubSub) endpoint — served on rpc-port + 1 | `wss://ws.blackbullchain.com` |
| `VITE_X_URL` | Official X account | `https://x.com/blackbullchain` |
| `VITE_PUMPFUN_URL` | pump.fun page for the $BBC token | `https://pump.fun/coin/<mint>` |
| `VITE_CHAIN_NAME` / `VITE_TICKER` | Display name / ticker | `BlackBullChain` / `BBC` |

## Quick start (build & run a node)

```bash
# 1. Apply the rebrand to the vendored Agave tree (first time only)
./scripts/rebrand.sh

# 2. Build (long — ~30-60 min; needs Rust 1.95, pinned via rust-toolchain.toml)
cd src/node && cargo build --release        # produces target/release/blackbull-*

# 3. Genesis + launch the first validator (the birth of the chain)
./scripts/bootstrap-validator.sh            # reuses ledger/genesis on re-run
```

`bootstrap-validator.sh` creates the keypairs + genesis (fixed 1B BBC), starts the faucet,
and launches the validator with transaction history enabled (`getBlock` / block explorer
work). Set `RPC_BIND_ADDRESS=0.0.0.0` to expose the RPC beyond localhost.

### Always-on (macOS)

The node and its public tunnel run as **launchd** services so they survive crashes and
reboots:

- `com.blackbull.validator` → `scripts/run-validator-service.sh` (keeps the validator up,
  `caffeinate` prevents sleep, high file-descriptor limit).
- `com.blackbull.tunnel` → `scripts/run-tunnel-service.sh` (a Cloudflare **named tunnel**
  giving the stable public URLs `rpc.` / `ws.blackbullchain.com`).

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

See [docs/SPEC.md](docs/SPEC.md) for the complete naming map.

Forked from Agave **v4.1.1**. Upstream is licensed Apache-2.0.

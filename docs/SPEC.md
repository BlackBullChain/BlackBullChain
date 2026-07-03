# BlackBullChain — Specification

## 1. Goal

Fork Agave (the canonical Solana validator client) and run it as an independent,
BlackBullChain-branded network with its own genesis. End state: a live validator on the
owner's Mac Mini producing blocks on a chain whose native token is **BBC**.

Upstream baseline: **anza-xyz/agave v4.1.1** (vendored at `src/node/`).

## 2. Strategy: user-facing rebrand, not deep rename

Agave is a Cargo workspace of **203 crates**. Crate names (`solana-core`,
`solana-runtime`, …), module paths, macros, and feature gates all reference `solana`
internally, and much of the SDK (`solana-sdk`, `solana-native-token`, …) is pulled from
crates.io as external dependencies — it is not even in this tree to edit.

A blind global `solana → blackbull` rename would rewrite the entire internal dependency
graph and never compile. It is high-risk churn with zero user-visible payoff. Instead we
rebrand only what a user or operator actually sees. See
[ADR 0001](adr/0001-fork-strategy.md).

## 3. Naming map

### 3.1 Native token
| Concept | Solana | BlackBullChain |
|---|---|---|
| Token name | Solana | BlackBullChain |
| Ticker / unit label | `SOL` | `BBC` |
| Smallest unit | lamport | lamport *(kept — named after L. Lamport, not Solana; renaming breaks the external SDK)* |
| Display glyph | `◎` | `◎` in phase 1; optional swap in phase 3 |

Display unit lives locally at `src/node/cli-output/src/display.rs:70` (`" SOL"`) plus
`"SOL"` literals in `cli-output/src/cli_output.rs`. These are rebranded by `rebrand.sh`.
The glyph `◎` appears inline in ~dozens of column-formatted strings; swapping it is
cosmetic and deferred to phase 3 to avoid column-width regressions.

### 3.2 Operator / user binaries
The only *safe* renames are the produced executable names — never the `[package] name`.
Three mechanisms exist in the tree; the script handles each:

| Upstream executable | New name | Defined by | How rebrand.sh renames it |
|---|---|---|---|
| `solana` | `blackbull` | explicit `[[bin]]` in `cli/Cargo.toml` | edit `[[bin]] name` |
| `solana-keygen` | `blackbull-keygen` | explicit `[[bin]]` in `keygen/Cargo.toml` | edit `[[bin]] name` |
| `solana-genesis` | `blackbull-genesis` | explicit `[[bin]]` in `genesis/Cargo.toml` | edit `[[bin]] name` |
| `solana-gossip` | `blackbull-gossip` | explicit `[[bin]]` in `gossip*/Cargo.toml` | edit `[[bin]] name` |
| `solana-faucet` | `blackbull-faucet` | explicit `[[bin]]` in `faucet*/Cargo.toml` | edit `[[bin]] name` |
| `solana-test-validator` | `blackbull-test-validator` | autobin `validator/src/bin/solana-test-validator.rs` | rename file |
| `agave-install-init` | `blackbull-install-init` | autobin `install/src/bin/agave-install-init.rs` | rename file |
| `agave-validator` | `blackbull-validator` | package-default (`validator/src/main.rs`) | inject `[[bin]]` override |
| `agave-ledger-tool` | `blackbull-ledger-tool` | package-default (`ledger-tool/src/main.rs`) | inject `[[bin]]` override |
| `agave-install` | `blackbull-install` | package-default (`install/src/main.rs`) | inject `[[bin]]` override |
| `agave-watchtower` | `blackbull-watchtower` | package-default (`watchtower/src/main.rs`) | inject `[[bin]]` override |
| `solana-stake-accounts` | `blackbull-stake-accounts` | package-default (`stake-accounts/src/main.rs`) | inject `[[bin]]` override |
| `solana-tokens` | `blackbull-tokens` | package-default (`tokens/src/main.rs`) | inject `[[bin]]` override |
| `default-run` | `blackbull-validator` | `validator/Cargo.toml` | edit value |

Notes:
- Injecting an explicit `[[bin]]` disables autobin discovery for that crate, so for
  crates that *also* ship a `src/bin/*` autobin (`validator`, `install`) the script adds
  **both** `[[bin]]` entries so nothing is dropped.
- Left as-is on purpose (internal diagnostics / benchmarks / eBPF, not operator-facing):
  `agave-store-histogram`, `agave-xdp-prog`, `solana-accounts-cluster-bench`,
  `solana-poh-bench`, `test_exec_instr`.
- SBF build tooling (`cargo-build-sbf`, etc.) is left as-is so on-chain program tooling
  stays compatible.

Verified with `cargo metadata --no-deps`: the workspace resolves cleanly and produces
exactly these 12 `blackbull-*` executables — `blackbull`, `blackbull-keygen`,
`blackbull-genesis`, `blackbull-gossip`, `blackbull-faucet`, `blackbull-validator`,
`blackbull-test-validator`, `blackbull-ledger-tool`, `blackbull-install`,
`blackbull-install-init`, `blackbull-watchtower`, `blackbull-stake-accounts`,
`blackbull-tokens`.

### 3.3 Branding strings (phase 3, incremental)
`clap` app names / `about` / version banners that print "Solana" in help output. Rebranded
incrementally; not required for a functioning node.

## 4. Network identity

BlackBullChain is a *separate* chain, established by its own genesis — not by code changes:
- Own bootstrap-validator identity/vote/stake keypairs + mint + faucet keypairs.
- `blackbull-genesis` builds the genesis ledger (native token = BBC supply, cluster type,
  hashes-per-tick, fee/rent params).
- Nodes only peer with entrypoints we designate, so it never touches Solana clusters.

Defaults for the launch cluster are in `scripts/bootstrap-validator.sh`.

## 5. Roadmap

- **Phase 0 — Foundation** ✅ scaffold, fork vendored (v4.1.1), spec + ADR, scripts.
- **Phase 1 — Rebrand** run `rebrand.sh`; `cargo metadata` parses; binary + token rebrand.
- **Phase 2 — Build & genesis** `cargo build --release`; genesis via `bootstrap-validator.sh`;
  single-node cluster produces blocks locally.
- **Phase 3 — Branding polish** clap/help strings, optional glyph swap, version banner.
- **Phase 4 — Live on Mac Mini** run the bootstrap validator on the Mac Mini with a stable
  gossip entrypoint; open RPC; fund via faucet; (optional) add a second validator.
- **Phase 5 — Ecosystem** ✅ website + block explorer + browser wallet + docs shipped in
  `src/web/` (Vite/React, Solana-compatible RPC, runtime-editable endpoint). Point it at a
  live node to go from static site to live explorer.

## 6. Build & run targets

- **Dev/rebrand work:** this Linux/WSL box (build validates, but node runs elsewhere).
- **Live node:** Mac Mini (macOS/arm64). Rust stable, `cargo build --release`, run
  `bootstrap-validator.sh`. Keep the ledger on fast local SSD; open gossip (8001) + RPC
  (8899) as desired.

## 7. Constraints

- Never rename `[package] name` or internal `solana-*` crate identifiers.
- Keep upstream Apache-2.0 license and attribution intact.
- Rebrand must be idempotent and re-runnable (script guards against double-apply).
- Track upstream tag we forked (v4.1.1) so we can rebase future upstream releases.

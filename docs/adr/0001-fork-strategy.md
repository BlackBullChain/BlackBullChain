# ADR 0001 — Fork strategy: user-facing rebrand, not deep rename

- Status: accepted
- Date: 2026-07-03

## Context

BlackBullChain forks Agave (anza-xyz/agave v4.1.1), Solana's canonical validator client,
to run as an independent, rebranded network. The open question was *how deeply* to rename
"Solana/SOL" to "BlackBullChain/BBC".

Agave is a Cargo workspace of 203 crates. The name `solana` is load-bearing across:
- crate names (`solana-core`, `solana-runtime`, `solana-ledger`, …) and every
  `use`/dependency edge between them,
- macro paths, feature-gate names, and generated code,
- external crates.io dependencies (`solana-sdk`, `solana-native-token`, `solana-pubkey`,
  …) that are **not in this tree** and cannot be edited without also forking + patching
  each one via `[patch.crates-io]`.

## Decision

Do a **user-facing rebrand** only:
1. Rename produced executables (`solana-*` / `agave-*` → `blackbull-*`) via `[[bin]]`
   targets — never `[package] name`.
2. Rebrand the token display unit `SOL → BBC` at the local display layer.
3. Establish a distinct chain through a **fresh genesis** (own keypairs, cluster), not
   through code identity.
4. Defer clap/help/banner branding strings to an incremental phase.

Explicitly **rejected**: a blanket `solana → blackbull` rename of crate names, module
paths, and identifiers.

## Consequences

**Positive**
- The tree keeps compiling; we inherit upstream's tested runtime unchanged.
- We can rebase onto future Agave releases with minimal conflict (changes are localized to
  `[[bin]]` names, a few display strings, and scripts).
- The chain is genuinely independent via its genesis, which is what actually matters.

**Negative / accepted**
- Internal crate names still read `solana-*`. Invisible to users; visible to anyone
  reading source. Acceptable.
- `lamport` (smallest unit) is retained — it is named after Leslie Lamport, not Solana,
  and lives in the external SDK. Renaming it would fork the SDK for no real benefit.
- The `◎` glyph stays in phase 1 (swapping it risks column-alignment regressions across
  dozens of format strings); revisit in phase 3.

## Alternatives considered

- **Deep rename everything:** rewrites the whole dependency graph + requires forking every
  external `solana-*` SDK crate. Enormous, high-risk, near-impossible to keep building, and
  cosmetic. Rejected.
- **Zero rename (pure private cluster):** just run stock Agave with a private genesis.
  Simplest, but fails the branding requirement. Rejected in favor of the middle path above.

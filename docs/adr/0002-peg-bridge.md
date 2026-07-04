# ADR 0002 — 1:1 peg between pump.fun $BBC and native BBC

- Status: accepted (bridge not yet live)
- Date: 2026-07-04

## Context

$BBC launches as a pump.fun SPL token on Solana (fixed 1,000,000,000 supply). BlackBullChain
has its own native token, also **BBC**, with a **fixed 1,000,000,000 supply** and no inflation
(`blackbull-genesis --inflation none`). We want holders to move value between the two at a
strict **1:1** rate.

## Decision

A **lock-and-release bridge**:

1. **Solana side (lock):** users send pump.fun $BBC to a **bridge treasury** address, tagging
   the transfer with a memo containing their BlackBullChain address. The $BBC stays locked in
   the treasury — it is never sold. Locked $BBC == native BBC in circulation.
2. **BlackBullChain side (release):** genesis pre-funds a **bridge reserve** account with the
   native BBC supply (see `bootstrap-validator.sh`, primordial account). An off-chain
   **relayer** (`scripts/peg-relayer`) watches the treasury; for each confirmed deposit it
   sends the same amount of native BBC from the reserve to the address in the memo.
3. **Peg-out (reverse):** later — burn/return native BBC to the reserve, relayer releases the
   locked $BBC. Same mechanism in reverse.

**Decimals:** pump.fun SPL tokens use 6 decimals; native BBC (lamports) uses 9. The relayer
converts `native_lamports = spl_raw_amount * 10^(9-6)` so whole-token amounts map 1:1.

Both supplies are 1,000,000,000, so every native BBC can be fully backed by a locked $BBC.

## Consequences

- **v1 is operator-trusted:** the relayer holds the reserve key and the treasury. This is a
  custodial bridge — acceptable to launch, documented as such. Do not over-claim
  "trustless."
- Native supply is fixed at genesis in the reserve; nothing is minted on the fly, so the peg
  can never exceed 1B.
- Future hardening: multisig treasury, threshold-signed releases, and eventually a
  light-client / SPL-based proof instead of a single relayer.

## Status of implementation

- ✅ Genesis: fixed 1B supply + bridge-reserve primordial account (`bootstrap-validator.sh`).
- ✅ Relayer skeleton: `scripts/peg-relayer` (watch treasury → release native BBC).
- ✅ Site: `/peg` page (currently **Coming soon** — opens when the token + treasury are set).
- ⏳ Live: needs the $BBC mint, a funded treasury, and the running chain.

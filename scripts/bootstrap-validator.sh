#!/usr/bin/env bash
# bootstrap-validator.sh — create the BlackBullChain genesis (fixed 1,000,000,000 BBC
# supply) and launch the first (bootstrap) validator. Running this is the genesis of the
# chain. A "bridge reserve" account holds the native BBC that backs the 1:1 peg with the
# pump.fun $BBC token (see scripts/peg-relayer + docs/adr/0002-peg-bridge.md).
#
# Prereqs: scripts/rebrand.sh already applied, and `cargo build --release` in src/node.
# Works on macOS (Mac Mini) and Linux.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_DIR="${NODE_DIR:-$SCRIPT_DIR/../src/node}"
NODE_DIR="$(cd "$NODE_DIR" && pwd)"

# --- config (override via env) --------------------------------------------------------
LEDGER_DIR="${LEDGER_DIR:-$SCRIPT_DIR/../.blackbull/ledger}"
KEYS_DIR="${KEYS_DIR:-$SCRIPT_DIR/../.blackbull/keys}"
RPC_PORT="${RPC_PORT:-8899}"
GOSSIP_PORT="${GOSSIP_PORT:-8001}"
GOSSIP_HOST="${GOSSIP_HOST:-127.0.0.1}"          # set to the Mac Mini LAN/Tailscale IP to peer
CLUSTER_TYPE="${CLUSTER_TYPE:-development}"        # development | devnet | testnet | mainnet-beta

# Fixed total supply: 1,000,000,000 BBC (matches the pump.fun $BBC token). 1 BBC = 1e9 lamports.
TOTAL_BBC="${TOTAL_BBC:-1000000000}"
FAUCET_BBC="${FAUCET_BBC:-1000000}"               # dev faucet allocation (from the 1B)
IDENTITY_BBC="${IDENTITY_BBC:-500}"               # bootstrap validator identity account
STAKE_BBC="${STAKE_BBC:-500000}"                  # bootstrap validator stake
# The protocol seeds ~160 BBC into built-in accounts (sysvars, native programs, rewards
# pools, vote/stake rent-exempt minimums) on top of our allocations. Subtract it so total
# capitalization is EXACTLY 1,000,000,000. Measured for cluster-type=development; if you
# change cluster type/version, re-measure (blackbull-genesis prints "Capitalization").
GENESIS_OVERHEAD_LAMPORTS="${GENESIS_OVERHEAD_LAMPORTS:-160295521600}"
# Bridge reserve = everything else, so the total is EXACTLY 1B (backs the 1:1 peg).

LAMPORTS_PER_BBC=1000000000
lamports() { echo $(( $1 * LAMPORTS_PER_BBC )); }

# --- resolve binaries (prefer freshly built target/release, else PATH) ---------------
BIN_DIR="$NODE_DIR/target/release"
bin() { if [ -x "$BIN_DIR/$1" ]; then echo "$BIN_DIR/$1"; else echo "$1"; fi; }
KEYGEN="$(bin blackbull-keygen)"
GENESIS="$(bin blackbull-genesis)"
VALIDATOR="$(bin blackbull-validator)"

command -v "$KEYGEN" >/dev/null 2>&1 || { echo "ERROR: blackbull-keygen not found. Build src/node first."; exit 1; }

TOTAL_LAMPORTS=$(lamports "$TOTAL_BBC")
FAUCET_LAMPORTS=$(lamports "$FAUCET_BBC")
IDENTITY_LAMPORTS=$(lamports "$IDENTITY_BBC")
STAKE_LAMPORTS=$(lamports "$STAKE_BBC")
RESERVE_LAMPORTS=$(( TOTAL_LAMPORTS - FAUCET_LAMPORTS - IDENTITY_LAMPORTS - STAKE_LAMPORTS - GENESIS_OVERHEAD_LAMPORTS ))

echo "BlackBullChain bootstrap"
echo "  total supply: $TOTAL_BBC BBC (fixed, no inflation)"
echo "  bridge reserve: $(( RESERVE_LAMPORTS / LAMPORTS_PER_BBC )) BBC | faucet: $FAUCET_BBC | stake: $STAKE_BBC"
echo "  ledger: $LEDGER_DIR"
echo

# --- 1. keypairs ---------------------------------------------------------------------
mkdir -p "$KEYS_DIR"
new_key() {
  local p="$KEYS_DIR/$1.json"
  if [ -f "$p" ]; then echo "  keep $1"; else "$KEYGEN" new --no-bip39-passphrase --silent -o "$p"; echo "  new  $1"; fi
}
echo "==> [1/3] Keypairs"
new_key faucet
new_key bootstrap-identity
new_key bootstrap-vote
new_key bootstrap-stake
new_key bridge-reserve          # holds native BBC backing the 1:1 peg (used by the relayer)
RESERVE_PUBKEY="$("$KEYGEN" pubkey "$KEYS_DIR/bridge-reserve.json")"
echo "  bridge reserve address: $RESERVE_PUBKEY"

# --- 2. genesis ----------------------------------------------------------------------
echo "==> [2/3] Genesis"
if [ -f "$LEDGER_DIR/genesis.bin" ]; then
  echo "  genesis already exists at $LEDGER_DIR (delete it to re-genesis)"
else
  mkdir -p "$LEDGER_DIR"
  # primordial-accounts file: pre-fund the bridge reserve so total == 1B
  PRIMORDIAL="$KEYS_DIR/primordial.yml"
  {
    echo "$RESERVE_PUBKEY:"
    echo "  balance: $RESERVE_LAMPORTS"
    echo "  owner: '11111111111111111111111111111111'"   # system program
    echo "  data: ''"
    echo "  executable: false"
  } > "$PRIMORDIAL"

  "$GENESIS" \
    --ledger "$LEDGER_DIR" \
    --cluster-type "$CLUSTER_TYPE" \
    --inflation none \
    --bootstrap-validator \
        "$KEYS_DIR/bootstrap-identity.json" \
        "$KEYS_DIR/bootstrap-vote.json" \
        "$KEYS_DIR/bootstrap-stake.json" \
    --bootstrap-validator-lamports "$IDENTITY_LAMPORTS" \
    --bootstrap-validator-stake-lamports "$STAKE_LAMPORTS" \
    --faucet-pubkey "$KEYS_DIR/faucet.json" \
    --faucet-lamports "$FAUCET_LAMPORTS" \
    --primordial-accounts-file "$PRIMORDIAL" \
    --hashes-per-tick auto
  echo "  genesis created. total supply = $TOTAL_BBC BBC."
fi

# --- 3. launch the bootstrap validator ----------------------------------------------
echo "==> [3/3] Launching bootstrap validator (Ctrl-C to stop)"
exec "$VALIDATOR" \
  --identity "$KEYS_DIR/bootstrap-identity.json" \
  --vote-account "$KEYS_DIR/bootstrap-vote.json" \
  --ledger "$LEDGER_DIR" \
  --rpc-port "$RPC_PORT" \
  --gossip-host "$GOSSIP_HOST" \
  --gossip-port "$GOSSIP_PORT" \
  --no-genesis-fetch \
  --no-snapshot-fetch \
  --no-poh-speed-test \
  --full-rpc-api \
  --rpc-faucet-address "127.0.0.1:9900" \
  --allow-private-addr \
  --log -

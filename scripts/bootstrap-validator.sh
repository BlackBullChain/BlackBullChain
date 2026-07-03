#!/usr/bin/env bash
# bootstrap-validator.sh — create the BlackBullChain genesis and launch the first
# (bootstrap) validator. Running this is the genesis event of the chain.
#
# Prereqs: run scripts/rebrand.sh and `cargo build --release` in src/node first.
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
GOSSIP_HOST="${GOSSIP_HOST:-127.0.0.1}"          # set to the Mac Mini's LAN/Tailscale IP to peer
CLUSTER_TYPE="${CLUSTER_TYPE:-development}"        # development | devnet | testnet | mainnet-beta
FAUCET_BBC="${FAUCET_BBC:-500000000}"             # faucet balance, whole BBC
BOOTSTRAP_STAKE_BBC="${BOOTSTRAP_STAKE_BBC:-1000000}"

# BBC <-> lamports: 1 BBC = 1e9 lamports (same base as SOL's lamport)
bbc() { echo "$(( $1 * 1000000000 ))"; }

# --- resolve binaries (prefer freshly built target/release, else PATH) ---------------
BIN_DIR="$NODE_DIR/target/release"
bin() { if [ -x "$BIN_DIR/$1" ]; then echo "$BIN_DIR/$1"; else echo "$1"; fi; }
KEYGEN="$(bin blackbull-keygen)"
GENESIS="$(bin blackbull-genesis)"
VALIDATOR="$(bin blackbull-validator)"

command -v "$KEYGEN" >/dev/null 2>&1 || { echo "ERROR: blackbull-keygen not found. Build src/node first."; exit 1; }

echo "BlackBullChain bootstrap"
echo "  node:     $NODE_DIR"
echo "  ledger:   $LEDGER_DIR"
echo "  keys:     $KEYS_DIR"
echo "  cluster:  $CLUSTER_TYPE"
echo

# --- 1. keypairs ---------------------------------------------------------------------
mkdir -p "$KEYS_DIR"
new_key() { # $1 name
  local p="$KEYS_DIR/$1.json"
  if [ -f "$p" ]; then echo "  keep $1"; else "$KEYGEN" new --no-bip39-passphrase --silent -o "$p"; echo "  new  $1"; fi
}
echo "==> [1/3] Keypairs"
new_key mint            # holds initial supply
new_key faucet          # dispenses BBC on the dev cluster
new_key bootstrap-identity
new_key bootstrap-vote
new_key bootstrap-stake

# --- 2. genesis ----------------------------------------------------------------------
echo "==> [2/3] Genesis"
if [ -f "$LEDGER_DIR/genesis.bin" ]; then
  echo "  genesis already exists at $LEDGER_DIR (delete it to re-genesis)"
else
  mkdir -p "$LEDGER_DIR"
  "$GENESIS" \
    --ledger "$LEDGER_DIR" \
    --cluster-type "$CLUSTER_TYPE" \
    --bootstrap-validator \
        "$KEYS_DIR/bootstrap-identity.json" \
        "$KEYS_DIR/bootstrap-vote.json" \
        "$KEYS_DIR/bootstrap-stake.json" \
    --bootstrap-validator-lamports "$(bbc "$BOOTSTRAP_STAKE_BBC")" \
    --bootstrap-validator-stake-lamports "$(bbc "$BOOTSTRAP_STAKE_BBC")" \
    --mint "$KEYS_DIR/mint.json" \
    --faucet-pubkey "$KEYS_DIR/faucet.json" \
    --faucet-lamports "$(bbc "$FAUCET_BBC")" \
    --hashes-per-tick auto
  echo "  genesis created."
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

#!/usr/bin/env bash
# rebrand.sh — apply the BlackBullChain user-facing rebrand to the vendored Agave tree.
#
# Safe + idempotent. Renames only *produced executables* ([[bin]] targets) and the token
# display unit. NEVER touches [package] names or internal solana-* crate identifiers.
# See docs/SPEC.md §3 and docs/adr/0001-fork-strategy.md.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_DIR="${1:-$SCRIPT_DIR/../src/node}"
NODE_DIR="$(cd "$NODE_DIR" && pwd)"
cd "$NODE_DIR"
echo "Rebranding Agave tree at: $NODE_DIR"

# --- 1. Rename explicit [[bin]] targets (section-aware: skips [package] name) ----------
# Only bin names in this map are rewritten; internal bins (agave-xdp-prog, test_exec_instr)
# are intentionally left alone.
echo "==> [1/5] Renaming explicit [[bin]] targets"
find . -name Cargo.toml -print0 | while IFS= read -r -d '' f; do
  perl -i -pe '
    BEGIN {
      %map = (
        "solana"         => "blackbull",
        "solana-keygen"  => "blackbull-keygen",
        "solana-genesis" => "blackbull-genesis",
        "solana-gossip"  => "blackbull-gossip",
        "solana-faucet"  => "blackbull-faucet",
      );
    }
    if (/^\s*\[\[bin\]\]/)          { $inbin = 1 }
    elsif (/^\s*\[/)               { $inbin = 0 }
    if ($inbin && /^(\s*name\s*=\s*")([^"]+)(".*)$/) {
      if (exists $map{$2}) { $_ = "$1$map{$2}$3\n"; }
    }
  ' "$f"
done

# --- 2. Rename src/bin autobin files (exe name follows filename) -----------------------
echo "==> [2/5] Renaming src/bin autobins"
rename_file() { # $1 old  $2 new
  if [ -f "$1" ]; then mv "$1" "$2"; echo "    $1 -> $2"; fi
}
rename_file validator/src/bin/solana-test-validator.rs validator/src/bin/blackbull-test-validator.rs
rename_file install/src/bin/agave-install-init.rs       install/src/bin/blackbull-install-init.rs

# --- 3. Inject [[bin]] overrides for package-default-bin crates ------------------------
# These crates name their binary after [package] name (which we must NOT change), so we
# add explicit [[bin]] targets. Adding [[bin]] disables autobins, so crates that also ship
# a src/bin/* get both entries. Guarded by a marker for idempotency.
echo "==> [3/5] Injecting [[bin]] overrides"
inject() { # $1 Cargo.toml ; rest: name=path pairs
  local toml="$1"; shift
  if [ ! -f "$toml" ]; then echo "    skip (missing): $toml"; return; fi
  if grep -q 'blackbull-rebrand' "$toml"; then echo "    skip (already applied): $toml"; return; fi
  {
    echo ""
    echo "# >>> blackbull-rebrand (generated; do not edit inside this block)"
    for pair in "$@"; do
      echo "[[bin]]"
      echo "name = \"${pair%%=*}\""
      echo "path = \"${pair##*=}\""
      echo ""
    done
    echo "# <<< blackbull-rebrand"
  } >> "$toml"
  echo "    injected into $toml"
}
inject validator/Cargo.toml \
  "blackbull-validator=src/main.rs" \
  "blackbull-test-validator=src/bin/blackbull-test-validator.rs"
inject install/Cargo.toml \
  "blackbull-install=src/main.rs" \
  "blackbull-install-init=src/bin/blackbull-install-init.rs"
inject ledger-tool/Cargo.toml    "blackbull-ledger-tool=src/main.rs"
inject watchtower/Cargo.toml     "blackbull-watchtower=src/main.rs"
inject stake-accounts/Cargo.toml "blackbull-stake-accounts=src/main.rs"
inject tokens/Cargo.toml         "blackbull-tokens=src/main.rs"

# --- 4. default-run -> blackbull-validator (wherever it is declared) ------------------
# Must match the injected [[bin]]; the old autobin name no longer exists.
echo "==> [4/5] Updating default-run"
grep -rln 'default-run = "agave-validator"' --include=Cargo.toml . | while IFS= read -r f; do
  sed -i 's/default-run = "agave-validator"/default-run = "blackbull-validator"/' "$f"
  echo "    default-run -> blackbull-validator in $f"
done

# --- 5. Token display unit: SOL -> BBC (local display layer only) ---------------------
echo "==> [5/5] Rebranding token display unit SOL -> BBC"
# central balance-message helper
sed -i 's/" SOL"\.to_string()/" BBC".to_string()/' cli-output/src/display.rs
# label literals in cli_output.rs (producer + matching test expectations stay in sync)
sed -i 's/ SOL"/ BBC"/g; s/"SOL"/"BBC"/g' cli-output/src/cli_output.rs

echo
echo "Rebrand complete. Verify manifests parse with:"
echo "    (cd $NODE_DIR && cargo metadata --no-deps --format-version 1 >/dev/null && echo OK)"

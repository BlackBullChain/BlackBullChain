#!/usr/bin/env bash
# run-tunnel-service.sh — launchd entrypoint for the BlackBullChain NAMED Cloudflare tunnel.
# Exposes the local validator RPC (127.0.0.1:8899) at the STABLE public URL:
#
#     https://rpc.blackbullchain.com
#
# Unlike a quick tunnel, this hostname NEVER changes across restarts/reboots, so the website's
# VITE_RPC_URL stays valid forever. Config + credentials live in ~/.cloudflared/.
set -uo pipefail

CLOUDFLARED="/opt/homebrew/bin/cloudflared"
CONFIG="/Users/user/.cloudflared/config.yml"

# Stable URL — no capture needed, but keep the file for reference/compat with older tooling.
echo "https://rpc.blackbullchain.com" > /tmp/blackbull-tunnel-url.txt 2>/dev/null || true

# exec so launchd tracks cloudflared directly; KeepAlive restarts it if it ever exits.
exec "$CLOUDFLARED" tunnel --config "$CONFIG" run blackbull-rpc

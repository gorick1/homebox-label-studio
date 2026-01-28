#!/usr/bin/env bash
set -euo pipefail

echo "Cloudflare Tunnel Setup Helper for Homebox"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared is not installed. Follow https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/ to install."
  exit 1
fi

read -r -p "Tunnel name to create (default: homebox-tunnel): " TUNNEL_NAME
TUNNEL_NAME=${TUNNEL_NAME:-homebox-tunnel}

echo "1) Logging into Cloudflare (opens browser). Follow browser prompts."
cloudflared tunnel login || { echo "Login failed."; exit 1; }

echo "2) Creating tunnel named: $TUNNEL_NAME"
cloudflared tunnel create "$TUNNEL_NAME"

echo "3) Locating credentials file in ~/.cloudflared"
CREDS_FILE=$(ls -1t ~/.cloudflared/*.json 2>/dev/null | head -n1 || true)
if [ -z "$CREDS_FILE" ]; then
  echo "Could not find credentials file in ~/.cloudflared. Check cloudflared output above for errors.";
  exit 1
fi

TUNNEL_ID=$(basename "$CREDS_FILE" .json)
echo "Detected tunnel credentials file: $CREDS_FILE"
echo "Tunnel ID: $TUNNEL_ID"

CONFIG_DIR="$HOME/.cloudflared"
mkdir -p "$CONFIG_DIR"

CONFIG_PATH="$CONFIG_DIR/config.yml"
cat > "$CONFIG_PATH" <<EOF
tunnel: $TUNNEL_ID
credentials-file: $CREDS_FILE

ingress:
  - hostname: homebox.garrettorick.com
    service: http://caddy:80

  - hostname: companion.garrettorick.com
    service: http://caddy:80

  - hostname: labels.garrettorick.com
    service: http://label-designer:8001

  - service: http_status:404
EOF

echo "Wrote $CONFIG_PATH"

echo
echo "Next steps — DNS and verification"
echo "--------------------------------"
echo "Option A: Let cloudflared create the DNS records (requires Cloudflare account with API access)."
echo "  Run these commands to route DNS for each hostname to the tunnel (you can run them now):"
echo
echo "  cloudflared tunnel route dns $TUNNEL_NAME homebox.garrettorick.com"
echo "  cloudflared tunnel route dns $TUNNEL_NAME companion.garrettorick.com"
echo "  cloudflared tunnel route dns $TUNNEL_NAME labels.garrettorick.com"
echo
echo "Option B: Create the DNS CNAMEs manually in Cloudflare:
  - For each hostname, create a CNAME pointing to: <tunnel-id>.cfargotunnel.com
    (the actual tunnel domain is shown in the output of 'cloudflared tunnel list' or in the Cloudflare dashboard).
"

echo "To check the tunnel status locally, run:"
echo "  cloudflared tunnel list"
echo "  cloudflared tunnel run $TUNNEL_NAME"

echo
echo "Finally, in your project root, ensure the `docker-compose.yml` has the `cloudflared` service on the same Docker network as Caddy (homebox-net)."
echo
echo "Done. If you want, run the DNS commands above now or create the CNAMEs in the Cloudflare dashboard."

# Port Configuration Cleanup Summary

## Changes Made

### 1. Removed Direct Port Mappings
Previously exposed ports (for local development only):
- ❌ 3100:7745 (Homebox)
- ❌ 3101:8000 (Companion)
- ❌ 8001:80 (Label Designer)  
- ❌ 8002:8001 (Print Addon)

All internal service-to-service communication now uses Docker network `homebox-net`.

### 2. Production Access - Only Caddy Ports
✅ **80:80** - HTTP (Cloudflare tunnel redirect)
✅ **443:443** - HTTPS (TLS for local access)

All external access routes through Caddy reverse proxy:
- `https://homebox.garrettorick.com` → Caddy:443 → homebox:7745
- `https://labels.garrettorick.com` → Caddy:443 → label-designer:80
- `https://companion.garrettorick.com` → Caddy:443 → homebox-companion:8000
- `https://print.garrettorick.com` → Caddy:443 → homebox-print-addon:8001

### 3. Local Development Access (Optional)
If you need to access services directly on localhost, uncomment these in `docker-compose.yml`:

```yaml
# Uncomment in docker-compose.yml to expose for local dev
# homebox: ports: ["3100:7745"]
# companion: ports: ["3101:8000"]
# label-designer: ports: ["8001:80"]
# print-addon: ports: ["8002:8001"]
```

## Benefits
✅ Cleaner, more secure port configuration
✅ No unnecessary ports exposed to the network
✅ All traffic goes through Caddy reverse proxy with TLS
✅ Services communicate securely via internal Docker network
✅ Production-ready configuration

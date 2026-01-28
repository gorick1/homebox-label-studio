#!/bin/bash

echo "📋 Service logs (last 50 lines):"
echo ""

if docker ps --format '{{.Names}}' | grep -q '^homebox$'; then
    echo "=== Homebox ==="
    docker logs --tail 50 homebox
    echo ""
fi

if docker ps --format '{{.Names}}' | grep -q '^homebox-companion$'; then
    echo "=== Companion ==="
    docker logs --tail 50 homebox-companion
    echo ""
fi

if docker ps --format '{{.Names}}' | grep -q '^homebox-print-addon$'; then
    echo "=== Print Addon ==="
    docker logs --tail 50 homebox-print-addon
    echo ""
fi

if docker ps --format '{{.Names}}' | grep -q '^label-designer$'; then
    echo "=== Label Designer ==="
    docker logs --tail 50 label-designer
    echo ""
fi

if docker ps --format '{{.Names}}' | grep -q '^caddy$'; then
    echo "=== Caddy ==="
    docker logs --tail 50 caddy
    echo ""
fi

if docker ps --format '{{.Names}}' | grep -q '^cloudflared$'; then
    echo "=== Cloudflared ==="
    docker logs --tail 50 cloudflared
    echo ""
fi

echo "For continuous logs, run: docker-compose logs -f [service-name]"

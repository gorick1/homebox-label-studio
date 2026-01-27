#!/bin/bash

# Determine docker compose command
if docker compose version &>/dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

$DOCKER_COMPOSE down
echo "✓ All services stopped"

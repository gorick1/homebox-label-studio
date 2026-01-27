#!/bin/bash
# Homebox Label Studio Setup Script
# This script helps you configure and start the label studio

set -e

echo "======================================"
echo "Homebox Label Studio Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed.${NC}"
    echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker and Docker Compose are installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${GREEN}✓${NC} .env file created"
else
    echo -e "${YELLOW}!${NC} .env file already exists, skipping..."
fi

echo ""
echo "======================================"
echo "Configuration"
echo "======================================"
echo ""

# Generate webhook secret if not set
if ! grep -q "WEBHOOK_SECRET=your-webhook-secret" .env 2>/dev/null; then
    echo -e "${YELLOW}!${NC} WEBHOOK_SECRET already configured"
else
    echo "Generating secure webhook secret..."
    SECRET=$(openssl rand -hex 32)
    sed -i.bak "s/WEBHOOK_SECRET=your-webhook-secret/WEBHOOK_SECRET=$SECRET/" .env
    rm -f .env.bak
    echo -e "${GREEN}✓${NC} Webhook secret generated: $SECRET"
fi

echo ""
echo "Please configure the following in your .env file:"
echo "  1. HOMEBOX_API_TOKEN - Get from Homebox User Settings"
echo "  2. VITE_HOMEBOX_URL - Your Homebox instance URL"
echo "  3. AUTO_PRINT_ON_CREATE - Enable/disable auto-printing (true/false)"
echo ""

read -p "Have you configured your .env file? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please edit .env file and run this script again."
    echo "Example:"
    echo "  nano .env"
    echo "  ./setup.sh"
    exit 0
fi

echo ""
echo "======================================"
echo "Building Docker Images"
echo "======================================"
echo ""

docker-compose build

echo ""
echo -e "${GREEN}✓${NC} Docker images built successfully"

echo ""
echo "======================================"
echo "Starting Services"
echo "======================================"
echo ""

docker-compose up -d

echo ""
echo -e "${GREEN}✓${NC} Services started"

echo ""
echo "======================================"
echo "Waiting for services to be ready..."
echo "======================================"
echo ""

# Wait for backend to be healthy
RETRY=0
MAX_RETRY=30
until curl -sf http://localhost:3001/health > /dev/null 2>&1 || [ $RETRY -eq $MAX_RETRY ]; do
    echo "Waiting for backend... ($RETRY/$MAX_RETRY)"
    sleep 2
    RETRY=$((RETRY+1))
done

if [ $RETRY -eq $MAX_RETRY ]; then
    echo -e "${RED}Error: Backend failed to start${NC}"
    echo "Check logs with: docker-compose logs backend"
    exit 1
fi

echo -e "${GREEN}✓${NC} Backend is ready"

# Wait for frontend to be ready
RETRY=0
until curl -sf http://localhost:8080/health > /dev/null 2>&1 || [ $RETRY -eq $MAX_RETRY ]; do
    echo "Waiting for frontend... ($RETRY/$MAX_RETRY)"
    sleep 2
    RETRY=$((RETRY+1))
done

if [ $RETRY -eq $MAX_RETRY ]; then
    echo -e "${YELLOW}Warning: Frontend health check failed (this may be normal)${NC}"
fi

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Your services are now running:"
echo ""
echo "  • Label Studio:      http://localhost:8080"
echo "  • Backend API:       http://localhost:3001"
echo "  • Homebox:          http://localhost:7745"
echo "  • Homebox Companion: http://localhost:5173"
echo "  • Print Proxy:       http://localhost:5000"
echo ""
echo "Next steps:"
echo "  1. Open Label Studio at http://localhost:8080"
echo "  2. Create your first label template"
echo "  3. Set it as the default template"
echo "  4. Configure Homebox webhook (see docs/INTEGRATION.md)"
echo "  5. Test by creating an item in Homebox"
echo ""
echo "Useful commands:"
echo "  • View logs:    docker-compose logs -f"
echo "  • Stop:         docker-compose stop"
echo "  • Restart:      docker-compose restart"
echo "  • Remove all:   docker-compose down -v"
echo ""
echo "For more information, see README.md and docs/"
echo ""

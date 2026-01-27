#!/bin/bash
set -e

echo "🏠 Homebox Complete Setup"
echo "========================"

# Check prerequisites
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed. Install from https://docs.docker.com/engine/install/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not installed."
    exit 1
fi

# Determine docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Create data directories
echo "📁 Creating data directories..."
mkdir -p homebox-data
mkdir -p homebox-companion-data
mkdir -p homebox-print-addon-data
mkdir -p label-studio-data
mkdir -p label-templates
mkdir -p caddy-data caddy-config

# Copy default label templates (if they exist in repo)
if [ -d "label-templates-defaults" ]; then
    cp label-templates-defaults/* label-templates/ || true
fi

# Load environment
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env || cat > .env << 'EOF'
HBC_LLM_API_KEY=sk-your-openai-api-key-here
DYMO_PRINTER_NAME=DYMO LabelWriter 4XL
DEFAULT_LABEL_TEMPLATE=item-default
VITE_API_URL=http://localhost:8002
EOF
    echo "⚠️  Edit .env with your settings before continuing:"
    echo "   - HBC_LLM_API_KEY (OpenAI API key for Companion)"
    echo "   - DYMO_PRINTER_NAME (your actual printer name)"
    echo ""
    read -p "Press Enter to continue after editing .env, or Ctrl+C to exit..."
fi

# Check Cloudflare tunnel config
if [ ! -f ~/.cloudflared/config.yml ]; then
    echo "⚠️  Cloudflare tunnel not configured."
    echo "   This is optional for local-only use."
    echo "   For external access, run:"
    echo "     cloudflared tunnel login"
    echo "     cloudflared tunnel create homebox-tunnel"
    echo "   Then update ~/.cloudflared/config.yml with your tunnel ID"
    echo ""
fi

# Check if required repos are present
if [ ! -d "homebox-companion" ]; then
    echo "⚠️  homebox-companion directory not found."
    echo "   Clone it with: git clone https://github.com/your-username/homebox-companion.git"
    echo ""
fi

if [ ! -d "homebox-print-addon" ]; then
    echo "⚠️  homebox-print-addon directory not found."
    echo "   Clone it with: git clone https://github.com/your-username/homebox-print-addon.git"
    echo ""
fi

# Build images
echo "🔨 Building Docker images..."
echo "Building label-designer..."

# Try building label-designer, fall back to simple Dockerfile if it fails
if ! $DOCKER_COMPOSE build label-designer 2>&1 | tee /tmp/build.log | grep -q "ERROR"; then
    echo "✓ Label designer built successfully"
elif [ ! -d "dist" ]; then
    echo "⚠️  Docker build encountered issues. Building locally first..."
    if command -v npm &> /dev/null; then
        echo "Building with npm..."
        npm install && npm run build
        echo "Now building Docker image with pre-built assets..."
        docker build -f Dockerfile.simple -t label-studio:latest .
    else
        echo "❌ npm not found. Cannot build label designer."
        echo "   Install Node.js and npm, then run: npm install && npm run build"
        echo "   Or pull a pre-built image if available."
        exit 1
    fi
else
    echo "✓ Using existing dist folder for Docker build"
    docker build -f Dockerfile.simple -t label-studio:latest .
fi

# Start services
echo "🚀 Starting services..."
$DOCKER_COMPOSE up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Test connectivity
echo "✅ Testing connectivity..."
curl -s http://localhost:3100 > /dev/null && echo "✓ Homebox running" || echo "✗ Homebox not responding (check if homebox-companion and homebox-print-addon repos are cloned)"
curl -s http://localhost:3101 > /dev/null && echo "✓ Companion running" || echo "✗ Companion not running"
curl -s http://localhost:8002 > /dev/null && echo "✓ Print addon running" || echo "✗ Print addon not running"
curl -s http://localhost:8001 > /dev/null && echo "✓ Label Designer running" || echo "✗ Label Designer not running"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Local URLs:"
echo "  Homebox:          http://localhost:3100"
echo "  Companion:        http://localhost:3101"
echo "  Print Addon:      http://localhost:8002"
echo "  Label Designer:   http://localhost:8001"
echo ""
echo "External URLs (via Cloudflare):"
echo "  Homebox:          https://homebox.garrettorick.com"
echo "  Companion:        https://companion.garrettorick.com"
echo "  Labels:           https://labels.garrettorick.com"
echo ""
echo "Next steps:"
echo "  1. Visit http://localhost:3100 to access Homebox"
echo "  2. Visit http://localhost:8001 to design label templates"
echo "  3. Configure companion at http://localhost:3101"
echo "  4. Check logs with: ./logs.sh"

# Homebox Complete Setup

All-in-one Homebox inventory system with AI companion, label printing, and label designer.

## Overview

This repository provides a complete Docker-based setup for a Homebox ecosystem that includes:

- **Homebox**: Main inventory management system
- **Homebox Companion**: AI-powered assistant for managing inventory
- **Homebox Print Addon**: Automatic label printing for new items
- **Label Designer**: Web UI for designing custom label templates (this repository)
- **Caddy**: Reverse proxy for HTTPS
- **Cloudflared**: Optional tunnel for external access

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ External: https://homebox.garrettorick.com                      │
│ External: https://companion.garrettorick.com                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ Cloudflare Tunnel
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Raspberry Pi (Docker)                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Homebox (port 3100)  ◄──── Homebox Companion (port 3101)       │
│  │                           │                                  │
│  │                           ├─ Uses Homebox API to create      │
│  │                           │  items when user says "add item" │
│  │                                                              │
│  ├─ API serves items                                            │
│  │  POST /items → triggers webhook/listener                    │
│  │                                                              │
│  └──► Listener detects new item                                │
│       │                                                         │
│       └──► Homebox Print Addon (port 8002)                     │
│            │                                                    │
│            ├─ Reads item from Homebox API                      │
│            ├─ Applies default label template                   │
│            ├─ Sends print job to DYMO printer                  │
│            │                                                    │
│            └──► Label Designer (port 8001)                     │
│                 ├─ Web UI for designing label templates        │
│                 └─ Stores templates in DB                      │
│                                                                │
└──────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Raspberry Pi** (4GB+ RAM recommended) running a Linux OS (Ubuntu, Raspberry Pi OS, etc.)
2. **Docker & Docker Compose** installed
3. **Git** installed
4. **Network access** (for initial setup)
5. **Cloudflare account** with domain (optional, for external access)

## Quick Start

### Step 1: Clone Required Repositories

Create a parent directory for all services:

```bash
mkdir -p ~/homebox-setup && cd ~/homebox-setup
```

Clone this repository and the required companion services:

```bash
# Clone this repository (Label Designer)
git clone https://github.com/gorick1/homebox-label-studio.git label-studio
cd label-studio

# Clone companion services (adjust URLs to your forks if needed)
git clone https://github.com/your-username/homebox-companion.git ../homebox-companion
git clone https://github.com/your-username/homebox-print-addon.git ../homebox-print-addon
```

**Note:** The companion services should be cloned as siblings to this directory, or update the `docker-compose.yml` paths accordingly.

### Step 2: Configure Environment

Copy the example environment file and edit it with your settings:

```bash
cp .env.example .env
nano .env
```

Required settings:
- `HBC_LLM_API_KEY`: Your OpenAI API key for the Companion
- `DYMO_PRINTER_NAME`: Your actual DYMO printer name

### Step 3: Run Installation

```bash
./install.sh
```

The install script will:
- Create necessary data directories
- Build Docker images
- Start all services
- Test connectivity

### Step 4: Configure Cloudflare Tunnel (Optional)

For external access, see [docs/SETUP_STEPS.md](docs/SETUP_STEPS.md#3-configure-cloudflare-tunnel-optional)

## Usage

### Starting Services

```bash
./start.sh
```

### Stopping Services

```bash
./stop.sh
```

### Viewing Logs

```bash
./logs.sh
```

For continuous logs:
```bash
docker-compose logs -f [service-name]
```

## Services

| Service | Local URL | External URL (if configured) |
|---------|-----------|------------------------------|
| Homebox | http://localhost:3100 | https://homebox.yourdomain.com |
| Companion | http://localhost:3101 | https://companion.yourdomain.com |
| Print Addon | http://localhost:8002 | - |
| Label Designer | http://localhost:8001 | https://labels.yourdomain.com |

## Workflow

1. **Create item** via Homebox Companion
   - AI analyzes user input and calls Homebox API
2. **Homebox API** stores item
3. **Print Addon** detects new item
   - Applies default label template
   - Sends print job to DYMO printer
4. **Label Designer** lets you customize templates

## Documentation

- [SETUP_STEPS.md](docs/SETUP_STEPS.md) - Detailed installation instructions
- [WORKFLOW.md](docs/WORKFLOW.md) - How the system works together
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Common issues and solutions

## Troubleshooting

### Quick Health Check

```bash
docker-compose ps
./logs.sh
```

### Common Issues

**Services not starting:**
- Check that required repos are cloned: `homebox-companion` and `homebox-print-addon`
- Verify `.env` file exists and has correct settings
- Check Docker logs: `./logs.sh`

For detailed troubleshooting, see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## Development

This label designer is built with:
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

To develop locally:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

### Docker Build Notes

The Dockerfile builds the app in a multi-stage process. If you encounter Docker build issues:

**Option 1: Build locally first**
```bash
npm install && npm run build
docker build -f Dockerfile.simple -t label-designer .
```

**Option 2: Use docker-compose (recommended)**
```bash
./install.sh  # Handles build automatically with fallback
```

## Configuration Files

- `.env` - Environment variables (API keys, printer, etc.)
- `docker-compose.yml` - Service definitions
- `Caddyfile` - Local HTTPS routing
- `~/.cloudflared/config.yml` - Tunnel routing to internet (optional)

## Directory Structure

```
homebox-label-studio/
├── docker-compose.yml          # Service definitions
├── .env.example                # Environment template
├── Dockerfile                  # Label Designer container
├── nginx.conf                  # Label Designer web server config
├── install.sh, start.sh, stop.sh, logs.sh
├── docs/                       # Additional documentation
├── src/                        # Label Designer source code
└── [data directories created by install script]
```

## Support

For issues with individual services:
- **Homebox**: https://github.com/hay-kot/homebox
- **Label Designer (this repo)**: https://github.com/gorick1/homebox-label-studio

## License

This project follows the same license as the underlying components. See individual component repositories for details.

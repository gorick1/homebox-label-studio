# Quick Reference Guide

## Commands

### Setup
```bash
# First time setup
./install.sh

# Start services
./start.sh

# Stop services  
./stop.sh

# View logs
./logs.sh
```

### Docker
```bash
# View running containers
docker-compose ps

# Restart a service
docker-compose restart <service-name>

# View specific service logs
docker logs <container-name>
docker logs -f <container-name>  # follow

# Rebuild a service
docker-compose build <service-name>
docker-compose up -d <service-name>
```

### Local Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Run tests
npm run test
```

## Service URLs

| Service | URL | Notes |
|---------|-----|-------|
| Homebox | http://localhost:3100 | Main inventory system |
| Companion | http://localhost:3101 | AI assistant |
| Print Addon | http://localhost:8002 | Label printing API |
| Label Designer | http://localhost:8001 | This application |

## File Locations

| Type | Path | Purpose |
|------|------|---------|
| Config | `.env` | Environment variables |
| Data | `homebox-data/` | Homebox database |
| Data | `label-templates/` | Custom label templates |
| Logs | `./logs.sh` | View all service logs |
| Docs | `docs/` | Detailed documentation |

## Common Tasks

### Add New Item
1. Visit http://localhost:3101 (Companion)
2. Type natural language: "Add a box of pens"
3. Item created in Homebox
4. Label automatically prints

### Design Label Template
1. Visit http://localhost:8001 (Label Designer)
2. Create new template
3. Add fields (name, barcode, etc.)
4. Save with unique template ID
5. Use in Homebox items

### Check Service Health
```bash
# Quick check
docker-compose ps

# Detailed logs
./logs.sh

# Test connectivity
curl http://localhost:3100
curl http://localhost:3101
curl http://localhost:8001
curl http://localhost:8002
```

### Update Services
```bash
# Pull latest code
git pull

# Pull latest images
docker-compose pull

# Rebuild custom images
docker-compose build

# Restart
./stop.sh && ./start.sh
```

### Backup Data
```bash
# Stop services
./stop.sh

# Create backup
tar -czf backup-$(date +%Y%m%d).tar.gz \
  homebox-data/ \
  homebox-companion-data/ \
  homebox-print-addon-data/ \
  label-studio-data/ \
  label-templates/ \
  .env

# Start services
./start.sh
```

### Restore Backup
```bash
# Stop services
./stop.sh

# Extract backup
tar -xzf backup-YYYYMMDD.tar.gz

# Start services
./start.sh
```

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker logs <service-name>

# Check if port is in use
sudo netstat -tuln | grep <port>

# Restart service
docker-compose restart <service-name>
```

### Can't Connect to Service
```bash
# Check container is running
docker ps | grep <service-name>

# Check if service is healthy
docker inspect <service-name>

# Test from another container
docker exec <container-name> curl http://<service>:<port>
```

### Labels Not Printing
```bash
# Check printer connection
lpstat -p

# Check print addon logs
docker logs homebox-print-addon

# Verify printer name in .env
grep DYMO_PRINTER_NAME .env
```

### Docker Build Fails
```bash
# Build locally first
npm install && npm run build

# Use simple Dockerfile
docker build -f Dockerfile.simple -t label-designer .

# Or let install.sh handle it
./install.sh
```

## Environment Variables

### Required
- `HBC_LLM_API_KEY` - OpenAI API key for Companion
- `DYMO_PRINTER_NAME` - Your DYMO printer name

### Optional
- `HBC_HOMEBOX_URL` - Homebox API URL (default: http://homebox:7745)
- `DEFAULT_LABEL_TEMPLATE` - Default template ID (default: item-default)
- `VITE_API_URL` - Print addon URL (default: http://localhost:8002)

## Docker Compose Services

| Service | Container | Ports | Dependencies |
|---------|-----------|-------|--------------|
| homebox | homebox | 3100:7745 | - |
| homebox-companion | homebox-companion | 3101:8000 | homebox |
| homebox-print-addon | homebox-print-addon | 8002:8001 | homebox |
| label-designer | label-designer | 8001:80 | - |
| caddy | caddy | 80, 443 | all services |
| cloudflared | cloudflared | - | caddy |

## Additional Resources

- [README.md](README.md) - Main documentation
- [docs/SETUP_STEPS.md](docs/SETUP_STEPS.md) - Detailed installation
- [docs/WORKFLOW.md](docs/WORKFLOW.md) - System workflow
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Troubleshooting guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

## Support

- GitHub Issues: https://github.com/gorick1/homebox-label-studio/issues
- Homebox Docs: https://github.com/hay-kot/homebox

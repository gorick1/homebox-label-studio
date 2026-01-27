# Docker Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Raspberry Pi 4/5 (for ARM deployment) or x86_64 system
- DYMO label printer connected via USB
- Homebox instance (or using the included one)

## Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/gorick1/homebox-label-studio.git
cd homebox-label-studio
```

2. **Create environment file:**
```bash
cp .env.example .env
```

3. **Edit `.env` file with your settings:**
```env
# Enable auto-printing
AUTO_PRINT_ON_CREATE=true

# Set webhook secret (must match Homebox configuration)
WEBHOOK_SECRET=your-secure-secret-key

# Homebox API token (get from Homebox user settings)
HOMEBOX_API_TOKEN=your-homebox-api-token

# Optional: AI provider keys for Homebox Companion
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

4. **Start all services:**
```bash
docker-compose up -d
```

5. **Check logs:**
```bash
docker-compose logs -f
```

## Service Configuration

### Label Studio Frontend
- **Port:** 8080
- **URL:** http://localhost:8080
- **Purpose:** Web UI for designing labels

### Backend API
- **Port:** 3001
- **URL:** http://localhost:3001
- **Purpose:** Template storage, webhook handling, label generation
- **Data:** Stored in `label-data` volume

### Homebox
- **Port:** 7745
- **URL:** http://localhost:7745
- **Purpose:** Inventory management system
- **Data:** Stored in `homebox-data` volume

### Homebox Companion
- **Port:** 5173
- **URL:** http://localhost:5173
- **Purpose:** AI-powered item scanner
- **Data:** Stored in `companion-data` volume

### Print Proxy
- **Port:** 5000
- **URL:** http://localhost:5000
- **Purpose:** Handles communication with DYMO printer

## Volumes

All persistent data is stored in Docker volumes:

```bash
# List volumes
docker volume ls

# Inspect a volume
docker volume inspect homebox-label-studio_label-data

# Backup a volume
docker run --rm -v homebox-label-studio_label-data:/data -v $(pwd):/backup alpine tar czf /backup/label-data-backup.tar.gz -C /data .

# Restore a volume
docker run --rm -v homebox-label-studio_label-data:/data -v $(pwd):/backup alpine tar xzf /backup/label-data-backup.tar.gz -C /data
```

## Raspberry Pi Specific Setup

### Enable USB Access for Printer

The print-proxy service needs USB access:

```yaml
print-proxy:
  devices:
    - /dev/usb:/dev/usb
  privileged: true
```

### Performance Optimization

Edit `/boot/config.txt` on Raspberry Pi:
```
# Increase GPU memory
gpu_mem=256

# Enable 64-bit mode
arm_64bit=1
```

### Resource Limits

For Raspberry Pi 4 (4GB RAM), add resource limits:

```yaml
services:
  label-studio:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## Updating Services

### Update all containers:
```bash
docker-compose pull
docker-compose up -d
```

### Update specific service:
```bash
docker-compose pull label-studio
docker-compose up -d label-studio
```

### Rebuild after code changes:
```bash
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### Check service health:
```bash
docker-compose ps
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart services:
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Access container shell:
```bash
docker-compose exec backend sh
```

### Check network connectivity:
```bash
# Test API from frontend
docker-compose exec label-studio wget -O- http://backend:3001/health

# Test Homebox from backend
docker-compose exec backend wget -O- http://homebox:7745/api/v1/status
```

## Print Server Setup

The print-proxy service needs to be configured for your specific printer. Here's a basic implementation:

1. **Create a print-proxy directory:**
```bash
mkdir print-proxy
cd print-proxy
```

2. **Create `Dockerfile`:**
```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    cups \
    libcups2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY server.py .

EXPOSE 5000
CMD ["python", "server.py"]
```

3. **Create `requirements.txt`:**
```
flask==3.0.0
pycups==2.0.1
```

4. **Create `server.py`:**
```python
from flask import Flask, request, jsonify
import cups
import tempfile

app = Flask(__name__)

@app.route('/print', methods=['POST'])
def print_label():
    try:
        lbl_content = request.data
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.lbl') as f:
            f.write(lbl_content)
            temp_path = f.name
        
        # Print using CUPS
        conn = cups.Connection()
        printers = conn.getPrinters()
        
        # Use first DYMO printer found
        dymo_printer = None
        for printer_name in printers:
            if 'DYMO' in printer_name or 'dymo' in printer_name:
                dymo_printer = printer_name
                break
        
        if dymo_printer:
            conn.printFile(dymo_printer, temp_path, "Label", {})
            return jsonify({'ok': True, 'message': 'Label printed'})
        else:
            return jsonify({'ok': False, 'message': 'No DYMO printer found'}), 500
            
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

5. **Update docker-compose.yml:**
```yaml
print-proxy:
  build: ./print-proxy
  container_name: print-proxy
  restart: unless-stopped
  ports:
    - "5000:5000"
  devices:
    - /dev/usb:/dev/usb
  privileged: true
  volumes:
    - /var/run/dbus:/var/run/dbus
  networks:
    - homebox-network
```

## Production Deployment

### Use Traefik or Nginx Reverse Proxy

Example with Traefik:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.label-studio.rule=Host(`labels.yourdomain.com`)"
  - "traefik.http.routers.label-studio.entrypoints=websecure"
  - "traefik.http.routers.label-studio.tls.certresolver=letsencrypt"
```

### Enable SSL with Cloudflare

1. Set up Cloudflare tunnel
2. Configure DNS records
3. Enable SSL/TLS encryption mode: Full (strict)

### Monitoring

Add Prometheus and Grafana:

```yaml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus-data:/prometheus

grafana:
  image: grafana/grafana
  ports:
    - "3000:3000"
  volumes:
    - grafana-data:/var/lib/grafana
```

## Security Best Practices

1. **Change default secrets:**
   - Set strong `WEBHOOK_SECRET`
   - Rotate API tokens regularly

2. **Network isolation:**
   - Use internal Docker networks
   - Only expose necessary ports

3. **Regular updates:**
   - Keep base images updated
   - Monitor security advisories

4. **Backup strategy:**
   - Daily volume backups
   - Off-site backup storage
   - Test restore procedures

5. **Access control:**
   - Use firewall rules
   - Implement rate limiting
   - Enable audit logging

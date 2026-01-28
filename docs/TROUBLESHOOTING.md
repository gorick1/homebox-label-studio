# Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### Docker Not Installed
**Symptom:** `docker: command not found`

**Solution:**
1. Install Docker:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```
2. Log out and back in for group changes to take effect
3. Verify: `docker --version`

#### Docker Compose Not Installed
**Symptom:** `docker-compose: command not found`

**Solution:**
```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin
# Or for older systems:
sudo pip3 install docker-compose
```

#### Permission Denied
**Symptom:** `permission denied while trying to connect to the Docker daemon socket`

**Solution:**
```bash
sudo usermod -aG docker $USER
newgrp docker
# Or restart your session
```

### Service Startup Issues

#### Services Won't Start
**Symptom:** Services fail to start or immediately exit

**Solutions:**
1. Check logs:
   ```bash
   ./logs.sh
   ```

2. Check if ports are already in use:
   ```bash
   sudo netstat -tuln | grep -E '3100|3101|8001|8002|80|443'
   ```

3. Verify .env file exists:
   ```bash
   ls -la .env
   cat .env
   ```

4. Check Docker service is running:
   ```bash
   sudo systemctl status docker
   ```

#### Homebox Container Fails
**Symptom:** Homebox container exits or restarts repeatedly

**Solutions:**
1. Check Homebox logs:
   ```bash
   docker logs homebox
   ```

2. Verify data directory permissions:
   ```bash
   ls -la homebox-data/
   sudo chown -R 1000:1000 homebox-data/
   ```

3. Try pulling latest image:
   ```bash
   docker pull ghcr.io/hay-kot/homebox:latest
   docker-compose up -d homebox
   ```

#### Companion Service Not Building
**Symptom:** Build fails for homebox-companion

**Solutions:**
1. Verify the companion repo is cloned:
   ```bash
   ls -la ../homebox-companion/
   ```

2. If missing, clone it:
   ```bash
   git clone https://github.com/your-username/homebox-companion.git ../homebox-companion
   ```

3. Check Dockerfile exists:
   ```bash
   ls ../homebox-companion/Dockerfile
   ```

#### Print Addon Not Building
**Symptom:** Build fails for homebox-print-addon

**Solutions:**
1. Verify the print addon repo is cloned:
   ```bash
   ls -la ../homebox-print-addon/
   ```

2. If missing, clone it:
   ```bash
   git clone https://github.com/your-username/homebox-print-addon.git ../homebox-print-addon
   ```

3. Check Dockerfile exists:
   ```bash
   ls ../homebox-print-addon/Dockerfile
   ```

### Connectivity Issues

#### Cannot Access Homebox (port 3100)
**Solutions:**
1. Check if container is running:
   ```bash
   docker ps | grep homebox
   ```

2. Check if port is accessible:
   ```bash
   curl http://localhost:3100
   ```

3. Verify firewall isn't blocking:
   ```bash
   sudo ufw status
   sudo ufw allow 3100
   ```

4. Check container logs:
   ```bash
   docker logs homebox
   ```

#### Cannot Access Label Designer (port 8001)
**Solutions:**
1. Verify container is running:
   ```bash
   docker ps | grep label-designer
   ```

2. Rebuild if needed:
   ```bash
   docker-compose build label-designer
   docker-compose up -d label-designer
   ```

3. Check nginx is working inside container:
   ```bash
   docker exec label-designer curl http://localhost:80
   ```

#### Companion API Not Responding
**Solutions:**
1. Check API key is set in .env:
   ```bash
   grep HBC_LLM_API_KEY .env
   ```

2. Verify Homebox URL is correct:
   ```bash
   grep HBC_HOMEBOX_URL .env
   ```

3. Test from companion container:
   ```bash
   docker exec homebox-companion curl http://homebox:7745
   ```

### Printing Issues

#### Labels Not Printing
**Solutions:**
1. Verify DYMO printer is connected:
   ```bash
   # On host system
   lpstat -p
   lsusb | grep DYMO
   ```

2. Check printer name in .env matches:
   ```bash
   grep DYMO_PRINTER_NAME .env
   ```

3. Test print addon can reach Homebox:
   ```bash
   docker exec homebox-print-addon curl http://homebox:7745
   ```

4. Check print addon logs:
   ```bash
   docker logs homebox-print-addon
   ```

#### Wrong Label Template Used
**Solutions:**
1. Check default template setting:
   ```bash
   grep DEFAULT_LABEL_TEMPLATE .env
   ```

2. Verify template exists in Label Designer

3. Check item doesn't have custom template override

### Cloudflare Tunnel Issues

#### Tunnel Not Connecting
**Solutions:**
1. Verify tunnel is configured:
   ```bash
   cat ~/.cloudflared/config.yml
   ```

2. Check credentials file exists:
   ```bash
   ls ~/.cloudflared/*.json
   ```

3. Test tunnel manually:
   ```bash
   cloudflared tunnel run homebox-tunnel
   ```

4. Check cloudflared logs:
   ```bash
   docker logs cloudflared
   ```

#### External URLs Not Working
**Solutions:**
1. Verify DNS records in Cloudflare dashboard
2. Check tunnel is running:
   ```bash
   docker ps | grep cloudflared
   ```

3. Test internal routing:
   ```bash
   curl http://localhost:80
   ```

### Data/Volume Issues

#### Lost Data After Restart
**Solution:**
1. Verify volumes are mounted:
   ```bash
   docker inspect homebox | grep Mounts -A 20
   ```

2. Check data directories exist:
   ```bash
   ls -la homebox-data/
   ```

#### Disk Space Full
**Solution:**
1. Check disk usage:
   ```bash
   df -h
   ```

2. Clean up Docker:
   ```bash
   docker system prune -a
   ```

3. Remove old images:
   ```bash
   docker images
   docker rmi <image-id>
   ```

### Build Issues

#### Build Fails for Label Designer
**Solutions:**
1. Check Node.js version (need 18+):
   ```bash
   node --version
   ```

2. Clear npm cache:
   ```bash
   npm cache clean --force
   ```

3. Remove and rebuild:
   ```bash
   docker-compose build --no-cache label-designer
   ```

#### Out of Memory During Build
**Solutions:**
1. Increase Docker memory limit
2. Build services one at a time:
   ```bash
   docker-compose build label-designer
   docker-compose build homebox-companion
   docker-compose build homebox-print-addon
   ```

### Network Issues

#### Containers Can't Communicate
**Solutions:**
1. Check network exists:
   ```bash
   docker network ls | grep homebox-net
   ```

2. Inspect network:
   ```bash
   docker network inspect homebox-net
   ```

3. Restart networking:
   ```bash
   docker-compose down
   docker network rm homebox-net
   docker-compose up -d
   ```

## Diagnostic Commands

### Quick Health Check
```bash
# Check all containers
docker-compose ps

# Test each service
curl -I http://localhost:3100  # Homebox
curl -I http://localhost:3101  # Companion
curl -I http://localhost:8001  # Label Designer
curl -I http://localhost:8002  # Print Addon

# View recent logs
./logs.sh
```

### Detailed Service Status
```bash
# Container details
docker inspect <container-name>

# Resource usage
docker stats

# Network connectivity
docker exec <container-name> ping homebox
docker exec <container-name> curl http://homebox:7745
```

### Reset Everything
```bash
# Complete reset (WARNING: deletes all data)
./stop.sh
docker-compose down -v
rm -rf homebox-data homebox-companion-data homebox-print-addon-data label-studio-data caddy-data caddy-config
./install.sh
```

## Getting Help

If issues persist:

1. Check service-specific documentation:
   - Homebox: https://github.com/hay-kot/homebox
   - This repo: https://github.com/gorick1/homebox-label-studio

2. Collect diagnostic information:
   ```bash
   ./logs.sh > logs.txt
   docker-compose ps > status.txt
   docker version > version.txt
   ```

3. Create an issue with:
   - Description of problem
   - Steps to reproduce
   - Log files
   - System information (OS, Docker version, etc.)

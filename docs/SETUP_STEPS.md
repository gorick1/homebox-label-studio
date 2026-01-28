# Detailed Setup Steps

This document provides step-by-step instructions for setting up the complete Homebox system.

## Prerequisites Setup

### 1. Install Docker

**Ubuntu/Debian:**
```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
```

**Raspberry Pi OS:**
```bash
# Use convenience script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Enable Docker to start on boot
sudo systemctl enable docker

# Start Docker
sudo systemctl start docker
```

**Verify Installation:**
```bash
docker --version
docker compose version
docker run hello-world
```

### 2. Install Git

```bash
# Ubuntu/Debian/Raspberry Pi OS
sudo apt-get update
sudo apt-get install -y git

# Verify
git --version
```

### 3. Configure System Resources (Raspberry Pi)

**Increase swap space (recommended for Pi with <8GB RAM):**
```bash
# Edit dphys-swapfile
sudo nano /etc/dphys-swapfile

# Change CONF_SWAPSIZE to 2048 or 4096
CONF_SWAPSIZE=2048

# Restart swap
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

**Enable cgroups (required for Docker):**
```bash
# Edit boot config
sudo nano /boot/cmdline.txt

# Add to end of line (don't create new line):
cgroup_enable=cpuset cgroup_memory=1 cgroup_enable=memory

# Reboot
sudo reboot
```

## Repository Setup

### 1. Create Project Directory

```bash
# Create parent directory
mkdir -p ~/homebox-setup
cd ~/homebox-setup
```

### 2. Clone All Required Repositories

```bash
# Clone label designer (this repo)
git clone https://github.com/gorick1/homebox-label-studio.git label-studio

# Enter the directory
cd label-studio

# Clone companion services as siblings
cd ..
git clone https://github.com/your-username/homebox-companion.git homebox-companion
git clone https://github.com/your-username/homebox-print-addon.git homebox-print-addon

# Return to label-studio directory
cd label-studio
```

**Alternative: Clone in subdirectories**

If you prefer to have companion services as subdirectories, update `docker-compose.yml`:

```bash
cd ~/homebox-setup/label-studio

# Clone as subdirectories
git clone https://github.com/your-username/homebox-companion.git homebox-companion
git clone https://github.com/your-username/homebox-print-addon.git homebox-print-addon

# Update docker-compose.yml build contexts:
# - ./homebox-companion instead of ../homebox-companion
# - ./homebox-print-addon instead of ../homebox-print-addon
```

### 3. Verify Repository Structure

```bash
# If using sibling structure
ls -la ~/homebox-setup/
# Should show:
# - label-studio/
# - homebox-companion/
# - homebox-print-addon/

# If using subdirectory structure
cd ~/homebox-setup/label-studio
ls -la
# Should show:
# - homebox-companion/
# - homebox-print-addon/
# - docker-compose.yml
# - install.sh
# etc.
```

## Configuration

### 1. Create Environment File

```bash
cd ~/homebox-setup/label-studio

# Copy example
cp .env.example .env

# Edit with your settings
nano .env
```

**Required Settings:**
```bash
# OpenAI API key (get from https://platform.openai.com/api-keys)
HBC_LLM_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# DYMO printer name (get from system)
DYMO_PRINTER_NAME=DYMO LabelWriter 4XL

# Other settings (usually don't need to change)
HBC_HOMEBOX_URL=http://homebox:7745
DEFAULT_LABEL_TEMPLATE=item-default
HOMEBOX_API_URL=http://homebox:7745
VITE_API_URL=http://localhost:8002
```

**Get DYMO Printer Name:**
```bash
# Linux
lpstat -p

# macOS
lpstat -p | grep DYMO

# Windows (PowerShell)
Get-Printer | Where-Object {$_.Name -like "*DYMO*"}
```

### 2. Create Data Directories (Optional)

The install script creates these automatically, but you can create them manually:

```bash
mkdir -p homebox-data
mkdir -p homebox-companion-data
mkdir -p homebox-print-addon-data
mkdir -p label-studio-data
mkdir -p label-templates
mkdir -p caddy-data
mkdir -p caddy-config
```

### 3. Configure Cloudflare Tunnel (Optional)

Only needed if you want external access.

**Install cloudflared:**
```bash
# Ubuntu/Debian
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Raspberry Pi (ARM)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb

# Verify
cloudflared --version
```

**Login and Create Tunnel:**
```bash
# Login to Cloudflare (opens browser)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create homebox-tunnel

# List tunnels and note the ID
cloudflared tunnel list
```

**Create Configuration:**
```bash
mkdir -p ~/.cloudflared

# Create config file
nano ~/.cloudflared/config.yml
```

**Configuration Template:**
```yaml
tunnel: YOUR_TUNNEL_ID_HERE
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID_HERE.json

ingress:
  - hostname: homebox.yourdomain.com
    service: http://localhost:3100
  - hostname: companion.yourdomain.com
    service: http://localhost:3101
  - hostname: labels.yourdomain.com
    service: http://localhost:8001
  - service: http_status:404
```

**Create DNS Records in Cloudflare:**

1. Go to Cloudflare Dashboard → Your Domain → DNS
2. Add CNAME records:
   - Name: `homebox`, Target: `YOUR_TUNNEL_ID.cfargotunnel.com`
   - Name: `companion`, Target: `YOUR_TUNNEL_ID.cfargotunnel.com`
   - Name: `labels`, Target: `YOUR_TUNNEL_ID.cfargotunnel.com`

**Test Tunnel:**
```bash
# Run manually to test
cloudflared tunnel run homebox-tunnel

# If working, stop with Ctrl+C
# Docker compose will start it automatically
```

## Installation

### 1. Run Install Script

```bash
cd ~/homebox-setup/label-studio

# Make executable if not already
chmod +x install.sh

# Run installation
./install.sh
```

**Install Script Steps:**
1. Checks Docker and Docker Compose are installed
2. Creates data directories
3. Creates .env from template if missing
4. Warns about Cloudflare tunnel if not configured
5. Builds Docker images
6. Starts all services
7. Tests connectivity
8. Reports status

### 2. Verify Installation

```bash
# Check all containers are running
docker-compose ps

# Should show:
# homebox          Up      0.0.0.0:3100->7745/tcp
# homebox-companion Up     0.0.0.0:3101->8000/tcp
# homebox-print-addon Up   0.0.0.0:8002->8001/tcp
# label-designer   Up      0.0.0.0:8001->80/tcp
# caddy           Up      0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
# cloudflared     Up      

# Test each service
curl -I http://localhost:3100  # Homebox - should return 200 or 302
curl -I http://localhost:3101  # Companion - should return 200
curl -I http://localhost:8001  # Label Designer - should return 200
curl -I http://localhost:8002  # Print Addon - should return 200
```

### 3. Access Services

Open in browser:
- **Homebox**: http://localhost:3100
- **Companion**: http://localhost:3101
- **Label Designer**: http://localhost:8001

**First Time Setup - Homebox:**
1. Navigate to http://localhost:3100
2. Create admin account
3. Set up initial location/category structure

## Post-Installation

### 1. Configure Print Addon

1. Access Print Addon at http://localhost:8002
2. Verify Homebox connection
3. Test printer connection
4. Configure default template

### 2. Design Label Template

1. Access Label Designer at http://localhost:8001
2. Create new template:
   - Select label size (match your DYMO labels)
   - Add fields (name, barcode, category, etc.)
   - Format and position elements
   - Save with ID matching `DEFAULT_LABEL_TEMPLATE`

### 3. Test Complete Workflow

1. Access Companion at http://localhost:3101
2. Add test item: "Add a test box"
3. Verify item appears in Homebox
4. Check if label printed to DYMO printer
5. Review logs: `./logs.sh`

### 4. Enable Autostart (Optional)

**Create systemd service:**
```bash
sudo nano /etc/systemd/system/homebox.service
```

**Service Configuration:**
```ini
[Unit]
Description=Homebox Complete Setup
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/YOUR_USERNAME/homebox-setup/label-studio
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=YOUR_USERNAME

[Install]
WantedBy=multi-user.target
```

**Enable and Start:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable homebox.service
sudo systemctl start homebox.service

# Check status
sudo systemctl status homebox.service
```

## Backup and Maintenance

### Create Backup

```bash
cd ~/homebox-setup/label-studio

# Stop services
./stop.sh

# Backup data directories
tar -czf homebox-backup-$(date +%Y%m%d).tar.gz \
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
cd ~/homebox-setup/label-studio

# Stop services
./stop.sh

# Extract backup
tar -xzf homebox-backup-YYYYMMDD.tar.gz

# Start services
./start.sh
```

### Update Services

```bash
cd ~/homebox-setup/label-studio

# Pull latest changes
git pull

# Pull latest images
docker-compose pull

# Rebuild custom images
docker-compose build

# Restart services
./stop.sh
./start.sh
```

## Uninstall

```bash
cd ~/homebox-setup/label-studio

# Stop and remove containers
./stop.sh
docker-compose down -v

# Remove data (optional)
rm -rf homebox-data/
rm -rf homebox-companion-data/
rm -rf homebox-print-addon-data/
rm -rf label-studio-data/
rm -rf label-templates/
rm -rf caddy-data/
rm -rf caddy-config/

# Remove repository (optional)
cd ..
rm -rf label-studio/
```

## Next Steps

See:
- [WORKFLOW.md](WORKFLOW.md) - Understanding the system workflow
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Solving common issues
- Main [README.md](../README.md) - General documentation

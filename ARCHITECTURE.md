# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           User Interactions                          │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                   │
    ┌────▼─────┐      ┌─────▼──────┐    ┌─────▼──────────┐
    │ Homebox  │      │  Homebox   │    │ Label Studio   │
    │  Web UI  │      │ Companion  │    │   Web UI       │
    │  :7745   │      │   :5173    │    │    :8080       │
    └────┬─────┘      └─────┬──────┘    └─────┬──────────┘
         │                  │                   │
         │         ┌────────┴────────┐         │
         │         │                 │         │
    ┌────▼─────────▼──────┐         │    ┌────▼─────────┐
    │    Homebox API      │         │    │   Nginx      │
    │    Backend          │◄────────┘    │   (Frontend) │
    │    :7745            │              │              │
    └────┬────────────────┘              └──────────────┘
         │                                      │
         │ Webhook                              │ API Requests
         │ (Item Created)                       │
         │                                      │
    ┌────▼──────────────────────────────────────▼───┐
    │        Label Studio Backend API               │
    │                :3001                           │
    │                                                │
    │  ┌──────────────┐  ┌────────────────────┐    │
    │  │   Express    │  │   SQLite Database  │    │
    │  │   Server     │  │   (Templates)      │    │
    │  └──────┬───────┘  └────────────────────┘    │
    │         │                                     │
    │  ┌──────▼────────────────────────────┐       │
    │  │  Webhook Handler                  │       │
    │  │  • Validate secret                │       │
    │  │  • Fetch item from Homebox        │       │
    │  │  • Load template                  │       │
    │  │  • Replace placeholders           │       │
    │  │  • Generate .lbl file             │       │
    │  └──────┬────────────────────────────┘       │
    └─────────┼────────────────────────────────────┘
              │ .lbl file
              │
    ┌─────────▼────────────┐
    │   Print Proxy        │
    │      :5000           │
    │                      │
    │  ┌────────────────┐  │
    │  │ Flask Server   │  │
    │  │ + CUPS         │  │
    │  └────────┬───────┘  │
    └───────────┼──────────┘
                │ USB
                ▼
    ┌───────────────────────┐
    │   DYMO Label Printer  │
    │   (Physical Device)   │
    └───────────────────────┘
```

## Component Responsibilities

### Frontend (Nginx + React)
- **Port**: 8080
- **Purpose**: Label designer UI
- **Key Features**:
  - Visual label editor with drag-and-drop
  - Template management
  - Item preview with real Homebox data
  - Export to .lbl format
- **Technology**: React 18, TypeScript, shadcn-ui, Tailwind CSS

### Backend API (Node.js/Express)
- **Port**: 3001
- **Purpose**: Template storage and webhook handling
- **Key Features**:
  - RESTful API for templates (CRUD)
  - Webhook endpoint for Homebox events
  - .lbl XML generation
  - Print history tracking
  - Rate limiting and security
- **Technology**: Express.js, better-sqlite3, xml2js
- **Database**: SQLite with WAL mode

### Print Proxy (Python/Flask)
- **Port**: 5000
- **Purpose**: Interface with DYMO printers
- **Key Features**:
  - Receive .lbl files via HTTP
  - Auto-detect DYMO printers
  - Print via CUPS
  - Job status tracking
- **Technology**: Flask, pycups, waitress
- **Requirements**: USB access to printer

### Homebox
- **Port**: 7745
- **Purpose**: Inventory management system
- **Integration**:
  - Sends webhooks on item creation
  - Provides API for fetching item details
  - Stores inventory data
- **Configuration**: Set `HBOX_WEBHOOK_URL` to backend

### Homebox Companion
- **Port**: 5173
- **Purpose**: AI-powered item scanner
- **Integration**:
  - Creates items in Homebox
  - Triggers webhook automatically
  - Uses AI to identify and categorize items

## Data Flow

### 1. Label Creation Flow
```
User → Label Studio UI → Design Label → Save Template → Backend API → SQLite
```

### 2. Manual Print Flow
```
User → Select Template → Choose Item → Generate Label → Print Proxy → Printer
```

### 3. Automatic Print Flow (Webhook)
```
Homebox/Companion → Create Item
         ↓
Homebox API → Send Webhook
         ↓
Backend → Validate Secret
         ↓
Backend → Fetch Item Details from Homebox API
         ↓
Backend → Get Default Template from SQLite
         ↓
Backend → Replace Placeholders with Item Data
         ↓
Backend → Generate .lbl XML
         ↓
Print Proxy → Receive .lbl File
         ↓
Print Proxy → Send to DYMO Printer via CUPS
         ↓
Backend → Record Print History in SQLite
```

## Network Architecture

### Docker Network: homebox-network
All services communicate via an internal Docker bridge network.

**Internal DNS:**
- `backend:3001` - Backend API
- `homebox:7745` - Homebox instance
- `homebox-companion:5173` - Companion app
- `print-proxy:5000` - Print server

**External Ports:**
- `8080` - Label Studio UI (frontend)
- `3001` - Backend API (optional, for direct access)
- `7745` - Homebox UI
- `5173` - Homebox Companion UI
- `5000` - Print Proxy (optional, for direct access)

## Security Architecture

### Authentication Flow
```
Frontend → API Request with Token → Backend
                                      ↓
                              Validate Token
                                      ↓
                            Check Rate Limit
                                      ↓
                          Process Request
```

### Webhook Security
```
Homebox → Webhook with Secret → Backend
                                   ↓
                         Validate Secret First
                                   ↓
                         Log & Process
```

## Data Storage

### SQLite Database Schema

**templates table:**
```sql
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  label_data TEXT NOT NULL,  -- JSON
  is_default INTEGER DEFAULT 0,
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

**print_history table:**
```sql
CREATE TABLE print_history (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  template_id TEXT,
  printed_at TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'success', 'failed', 'skipped'
  error TEXT
);
```

### Volume Mounts

```yaml
volumes:
  homebox-data:        # Homebox database
  companion-data:      # Companion settings
  label-data:          # Templates & history
```

## Deployment Topologies

### 1. All-in-One (Default)
Single host running all services via Docker Compose.
```
[Single Host/Raspberry Pi]
  ├─ Label Studio
  ├─ Backend API
  ├─ Homebox
  ├─ Homebox Companion
  └─ Print Proxy
```

### 2. Distributed
Services on different hosts for scale.
```
[Host 1 - Homebox]    [Host 2 - Label Studio]    [Host 3 - Printer]
├─ Homebox            ├─ Frontend                ├─ Print Proxy
└─ Companion          └─ Backend                 └─ DYMO Printer
```

### 3. Behind Reverse Proxy
Production deployment with SSL.
```
Internet → Cloudflare → Traefik/Nginx → Docker Network
                                           ├─ Label Studio
                                           ├─ Homebox
                                           └─ Companion
```

## Scaling Considerations

### Current Limitations
- **SQLite**: Good for <1000 prints/day, single writer
- **Single Print Proxy**: One printer per instance
- **No Queue**: Prints executed immediately

### Scaling Options
1. **Database**: Migrate to PostgreSQL for high volume
2. **Print Queue**: Add Redis for job queuing
3. **Multiple Printers**: Deploy multiple print-proxy instances
4. **Load Balancing**: Add nginx/HAProxy for frontend

## Monitoring

### Health Checks
All services expose `/health` endpoints:
- `http://localhost:8080/health` - Frontend
- `http://localhost:3001/health` - Backend
- `http://localhost:5000/health` - Print Proxy

### Logging
- **Frontend**: Nginx access logs
- **Backend**: stdout (captured by Docker)
- **Print Proxy**: Python logging to stdout
- **Homebox**: Homebox logging

### Metrics (Future)
Prometheus metrics can be added:
- Request rate and latency
- Print success/failure rates
- Template usage statistics
- Database query performance

## Backup Strategy

### Critical Data
1. **Templates**: `/data/templates.db` in label-data volume
2. **Homebox Data**: homebox-data volume
3. **Configuration**: `.env` file (store securely)

### Backup Commands
```bash
# Backup templates
docker run --rm -v homebox-label-studio_label-data:/data \
  -v $(pwd):/backup alpine \
  tar czf /backup/templates-backup.tar.gz -C /data .

# Restore templates
docker run --rm -v homebox-label-studio_label-data:/data \
  -v $(pwd):/backup alpine \
  tar xzf /backup/templates-backup.tar.gz -C /data
```

## Troubleshooting

### Common Issues

**Backend can't reach Homebox:**
- Check Docker network: `docker network inspect homebox-network`
- Verify Homebox is running: `docker ps`
- Test connectivity: `docker exec backend ping homebox`

**Printer not found:**
- Check USB connection
- Verify privileged mode: `docker inspect print-proxy`
- List CUPS printers: `docker exec print-proxy lpstat -p`

**Webhook not received:**
- Check Homebox webhook config
- Verify webhook URL in Homebox settings
- Check backend logs: `docker logs backend`
- Test webhook manually with curl

## Performance

### Expected Throughput
- **Templates API**: 100 req/15min per IP (rate limited)
- **Webhooks**: 30 req/min per IP (rate limited)
- **Print Speed**: ~5 seconds per label (printer dependent)
- **Database**: Handles 1000s of templates easily

### Resource Usage (Raspberry Pi 4)
- **Frontend**: ~100MB RAM
- **Backend**: ~50MB RAM
- **Print Proxy**: ~30MB RAM
- **Total**: ~200MB + Homebox overhead

## Security Checklist

- [x] Rate limiting enabled
- [x] Webhook secrets configured
- [x] Input validation and sanitization
- [x] No hardcoded credentials
- [x] HTTPS recommended (via reverse proxy)
- [x] Regular updates of dependencies
- [x] Audit logging enabled
- [x] Network isolation via Docker
- [x] Principle of least privilege

---

For more details, see:
- [README.md](README.md) - Getting started
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment guide
- [INTEGRATION.md](docs/INTEGRATION.md) - Homebox setup
- [SECURITY.md](SECURITY.md) - Security review

# Changelog

All notable changes to Homebox Label Studio will be documented in this file.

## [1.0.1] - 2026-01-27

### Security
- **CRITICAL**: Updated waitress from 3.0.0 to 3.0.1 to fix vulnerabilities:
  - CVE: DoS leading to high CPU usage/resource exhaustion
  - CVE: Request processing race condition in HTTP pipelining with invalid first request
- All production dependencies now vulnerability-free

## [1.0.0] - 2026-01-27

### Added - Homebox Integration Release

This release adds comprehensive integration with the Homebox ecosystem, enabling automatic label printing when items are created in Homebox or Homebox Companion.

#### Core Features
- **Backend API Server**: Complete Express.js backend for template storage and webhook handling
  - SQLite database for template persistence
  - RESTful API for template management
  - Webhook endpoint for Homebox item creation events
  - Print history tracking and monitoring
  - Health check endpoints

- **Docker Support**: Full containerization for easy deployment
  - Multi-stage Dockerfile for production builds
  - Docker Compose configuration for complete stack
  - Support for ARM64 (Raspberry Pi) and AMD64 architectures
  - Nginx reverse proxy configuration
  - Volume management for persistent data

- **Webhook Integration**: Automatic label printing on item creation
  - Webhook receiver endpoint with secret validation
  - Automatic template selection (default or custom)
  - Dynamic placeholder replacement with item data
  - Configurable auto-print behavior
  - Print job queuing and error handling

- **Environment Configuration**: Flexible configuration system
  - Environment variable support for all services
  - `.env.example` template with all options
  - Support for multiple deployment scenarios
  - Development mode for testing

- **Print Server**: Example print proxy implementation
  - Python Flask server for DYMO printers
  - CUPS integration for label printing
  - Health checks and monitoring
  - USB device support for direct printer access

#### Documentation
- Comprehensive README with setup instructions
- API documentation (`docs/API.md`)
- Deployment guide (`docs/DEPLOYMENT.md`)
- Integration guide for Homebox (`docs/INTEGRATION.md`)
- Setup script for quick start

#### Infrastructure
- Automated setup script (`setup.sh`)
- Security configurations (webhook secrets, API tokens)
- Health checks for all services
- Resource limits for Raspberry Pi
- Network isolation with Docker networks

### Changed
- Updated API client to use environment variables instead of hardcoded URLs
- Improved `.gitignore` to exclude build artifacts and data directories
- Enhanced error handling and logging throughout

### Technical Details

**Backend Stack:**
- Node.js 20
- Express.js 4.18
- better-sqlite3 for database
- xml2js for .lbl file generation

**Frontend Stack:**
- React 18
- TypeScript
- Vite 5
- shadcn-ui components
- Tailwind CSS

**Infrastructure:**
- Docker & Docker Compose
- Nginx for reverse proxy
- Python 3.11 for print server
- CUPS for printer communication

### Integration Points

**Homebox Integration:**
- Webhook endpoint: `/api/webhook/item-created`
- Template API for label management
- Item data fetching from Homebox API
- Support for all Homebox item fields

**Print Proxy Integration:**
- HTTP endpoint for receiving .lbl files
- Auto-detection of DYMO printers
- Print job tracking and status

**Homebox Companion Integration:**
- Automatic label printing when companion creates items
- Support for AI-scanned item data
- Configurable template selection

### Deployment

**Supported Platforms:**
- Raspberry Pi 4/5 (ARM64)
- x86_64 Linux servers
- macOS (development)
- Windows (via WSL2)

**Deployment Methods:**
- Docker Compose (recommended)
- Manual installation
- Kubernetes (community supported)

### Security

- Webhook secret validation
- API token authentication
- Network isolation
- Environment-based secrets
- No hardcoded credentials

### Performance

- Optimized Docker images with multi-stage builds
- SQLite for fast local storage
- Efficient webhook processing
- Resource limits for embedded systems

### Known Limitations

- Print proxy requires USB access (privileged mode)
- Homebox webhook support depends on Homebox version
- DYMO printers only (extendable to others)
- Single printer per print-proxy instance

### Future Roadmap

- Support for Brother and Zebra printers
- Batch printing capabilities
- Template marketplace
- Mobile app for label printing
- Advanced barcode formats
- Custom field mapping
- Print queue management
- Multi-language support

### Migration Guide

If you're upgrading from a previous version without backend:

1. Create `.env` file from `.env.example`
2. Configure environment variables
3. Run `docker-compose up -d` to start all services
4. Export existing templates (if any)
5. Import templates into new backend
6. Configure Homebox webhooks
7. Test integration with sample item

### Contributors

- Initial integration and Docker support
- Backend API implementation
- Documentation and examples

### Links

- Repository: https://github.com/gorick1/homebox-label-studio
- Homebox: https://github.com/sysadminsmedia/homebox
- Homebox Companion: https://github.com/Duelion/homebox-companion
- Docker Hub: (TBD)

---

## Version History

- **1.0.1** (2026-01-27): Security patch - waitress 3.0.1 (fixes DoS and HTTP pipelining vulnerabilities)
- **1.0.0** (2026-01-27): Initial Homebox integration release
- Previous versions: Label designer only (no backend)

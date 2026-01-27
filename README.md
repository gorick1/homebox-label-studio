# Homebox Label Studio

A web-based DYMO label designer that integrates seamlessly with [Homebox](https://github.com/sysadminsmedia/homebox) inventory management system. Design custom labels with dynamic data from your Homebox items and automatically print them when new items are created.

## 🎯 Features

- **Visual Label Designer**: Drag-and-drop interface for creating DYMO labels
- **Dynamic Placeholders**: Auto-populate labels with Homebox item data
- **Template Management**: Save, load, and share label templates
- **Automatic Printing**: Print labels automatically when items are created in Homebox
- **Webhook Integration**: Listens for Homebox item creation events
- **Multi-Platform**: Works with Homebox and Homebox-companion
- **Docker Support**: Full containerized deployment for Raspberry Pi and other platforms

## 📋 Supported Label Elements

- Text with custom fonts, sizes, and colors
- QR Codes with dynamic data
- Barcodes (Code128, Code39, EAN13)
- Shapes (rectangles, lines)
- Dynamic placeholders: `{item_name}`, `{location}`, `{quantity}`, `{item_id}`, `{asset_id}`, `{description}`, `{notes}`

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/gorick1/homebox-label-studio.git
cd homebox-label-studio
```

2. Create a `.env` file from the example:
```bash
cp .env.example .env
```

3. Edit `.env` to configure your settings:
```env
# API Configuration
VITE_HOMEBOX_URL=http://homebox:7745
VITE_PRINT_PROXY_URL=http://print-proxy:5000
AUTO_PRINT_ON_CREATE=true

# Webhook Security
WEBHOOK_SECRET=your-secret-key-here

# Homebox API Token (for server-side operations)
HOMEBOX_API_TOKEN=your-homebox-api-token
```

4. Start all services:
```bash
docker-compose up -d
```

5. Access the services:
- Label Studio: http://localhost:8080
- Homebox: http://localhost:7745
- Homebox Companion: http://localhost:5173
- Backend API: http://localhost:3001

### Manual Installation

#### Frontend

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

#### Backend

1. Navigate to backend directory:
```bash
cd backend
npm install
```

2. Start the backend server:
```bash
npm start
```

## 🔧 Configuration

### Environment Variables

#### Frontend (`.env`)
- `VITE_API_BASE_URL`: Backend API URL (default: `/api`)
- `VITE_HOMEBOX_URL`: Homebox instance URL
- `VITE_PRINT_PROXY_URL`: Print proxy service URL
- `VITE_DEV_MODE`: Enable dev mode (bypasses auth)

#### Backend
- `API_PORT`: Backend server port (default: `3001`)
- `HOMEBOX_API_URL`: Internal Homebox API URL
- `PRINT_PROXY_URL`: Internal print proxy URL
- `DATABASE_URL`: SQLite database path
- `AUTO_PRINT_ON_CREATE`: Auto-print labels on item creation (default: `true`)
- `DEFAULT_TEMPLATE_ID`: Default template to use for auto-printing
- `WEBHOOK_SECRET`: Secret for validating webhooks
- `HOMEBOX_API_TOKEN`: API token for Homebox authentication

### Homebox Configuration

Configure Homebox to send webhooks to the label studio:

```env
HBOX_WEBHOOK_URL=http://backend:3001/webhook/item-created
HBOX_WEBHOOK_SECRET=your-secret-key-here
```

## 🏗️ Architecture

```
┌─────────────────────┐
│   Homebox / Companion│
│   (Create Item)     │
└──────────┬──────────┘
           │ Webhook
           ▼
┌─────────────────────┐
│  Label Studio       │
│  Backend (API)      │
│  - Template Storage │
│  - Webhook Handler  │
│  - LBL Generator    │
└──────────┬──────────┘
           │ Print Request
           ▼
┌─────────────────────┐
│  Print Proxy        │
│  (DYMO Printer)     │
└─────────────────────┘
```

## 🖨️ Print Server Setup

The print server handles communication with DYMO label printers. You'll need to set up a print proxy service that:

1. Accepts `.lbl` XML files via HTTP POST
2. Communicates with DYMO printers via USB
3. Returns print status

### Example Print Proxy Implementation

You can create a simple Python print server:

```python
from flask import Flask, request
import subprocess

app = Flask(__name__)

@app.route('/print', methods=['POST'])
def print_label():
    lbl_content = request.data
    # Save to temp file
    with open('/tmp/label.lbl', 'wb') as f:
        f.write(lbl_content)
    
    # Send to DYMO printer using dymoprint or similar
    subprocess.run(['dymoprint', '/tmp/label.lbl'])
    
    return {'ok': True, 'message': 'Label printed'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

## 📡 API Endpoints

### Templates
- `GET /api/templates` - List all templates
- `GET /api/templates/default` - Get default template
- `GET /api/templates/:id` - Get specific template
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/:id/set-default` - Set as default template

### Label Generation
- `POST /api/download-lbl` - Generate .lbl file from label

### Webhooks
- `POST /api/webhook/item-created` - Receive Homebox item creation notifications

### Monitoring
- `GET /api/health` - Health check endpoint
- `GET /api/print-history` - View print history

## 🔐 Security

- Use `WEBHOOK_SECRET` to validate webhook requests
- Use `HOMEBOX_API_TOKEN` for authenticated API calls
- Run behind reverse proxy (nginx, Traefik) with SSL/TLS
- Use Cloudflare for additional DDoS protection

## 🍓 Raspberry Pi Deployment

The Docker images support ARM64 architecture for Raspberry Pi 4/5:

```bash
# Pull and run on Raspberry Pi
docker-compose up -d
```

### Performance Tips
- Use SSD instead of SD card for database storage
- Allocate at least 2GB RAM
- Enable swap if needed
- Use Docker volumes for persistent data

## 🔄 Integration with Homebox Companion

[Homebox Companion](https://github.com/Duelion/homebox-companion) is an AI-powered scanner that adds items to Homebox. When Companion creates an item:

1. Homebox receives the new item
2. Homebox triggers webhook to Label Studio
3. Label Studio generates label with item data
4. Label is automatically printed (if enabled)

## 🛠️ Development

### Tech Stack
- **Frontend**: React, TypeScript, Vite, shadcn-ui, Tailwind CSS
- **Backend**: Node.js, Express, SQLite
- **Docker**: Multi-stage builds, health checks

### Project Structure
```
homebox-label-studio/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── lib/               # Utilities and API
│   └── types/             # TypeScript types
├── backend/               # Backend API
│   └── src/
│       ├── index.js       # Express server
│       ├── lbl-generator.js
│       └── webhook-handler.js
├── public/                # Static assets
├── Dockerfile            # Frontend container
├── docker-compose.yml    # Full stack setup
└── nginx.conf           # Nginx configuration
```

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- [Homebox](https://github.com/sysadminsmedia/homebox) - Inventory management system
- [Homebox Companion](https://github.com/Duelion/homebox-companion) - AI-powered scanner
- DYMO for label printer support

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Consult the Homebox documentation

## 🗺️ Roadmap

- [ ] Support for more label printer brands (Brother, Zebra)
- [ ] Batch printing support
- [ ] Label preview with real item data
- [ ] Template marketplace
- [ ] Mobile app for label printing
- [ ] Advanced barcode formats (QR, DataMatrix)
- [ ] Custom field mapping
- [ ] Print queue management

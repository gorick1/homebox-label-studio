# Homebox Label Studio - Integration & Lovable Enhancement Guide

Professional label design and printing interface for Homebox inventory management system with CUPS and DYMO printer support.

## 🎯 Current Implementation Status

### ✅ Working Features (Production Ready)
- **Drag-and-drop label editor** with real-time canvas updates
- **Template system** with persistent storage
- **CUPS printer integration** for printing directly from browser
- **Autoprint workflow** triggered by item assignment in Homebox
- **Item browser** showing available inventory items
- **Login/authentication** with Homebox integration
- **Print preview** before sending to printer
- **Responsive UI** for desktop and tablet
- **DYMO printer support** via backend print addon service

### 🔄 Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Homebox Label Studio (This App)             │
│  TypeScript/React UI - Port 5173                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴──────────┐
                    ↓                    ↓
         ┌──────────────────┐  ┌─────────────────┐
         │ Companion API    │  │ CUPS Print Server│
         │ (Port 5000)      │  │ (Port 631)       │
         │ Python/FastAPI   │  │                  │
         └──────────────────┘  └─────────────────┘
                    ↓
         ┌──────────────────┐
         │ Homebox Core     │
         │ (Port 7745)      │
         │ Go Backend       │
         └──────────────────┘
```

### 🔗 API Integration Points

#### 1. **Companion API** (`http://localhost:5000`)
- **GET /api/items** - Fetch items for browser
- **GET /api/labels** - Retrieve label templates
- **POST /api/print** - Submit print jobs
- **GET /api/autoprint/status** - Monitor print queue
- **WebSocket /ws/print-status** - Real-time print updates

#### 2. **CUPS Server** (`http://localhost:631`)
- Direct printing via `ipp://localhost:631/printers/{printer_name}`
- Printer discovery and queue management
- Print job status tracking

#### 3. **Homebox API** (`http://localhost:7745`)
- User authentication and token management
- Item data retrieval for label population
- Location information

### 📁 Key File Structure

```
homebox-label-studio/
├── src/
│   ├── components/
│   │   ├── editor/
│   │   │   ├── LabelCanvas.tsx      ← Core canvas rendering
│   │   │   ├── EditorToolbar.tsx    ← Design tools
│   │   │   ├── TemplatesPanel.tsx   ← Template management
│   │   │   ├── ItemBrowser.tsx      ← Item selection
│   │   │   ├── ElementsPanel.tsx    ← Element properties
│   │   │   ├── PropertiesPanel.tsx  ← Design properties
│   │   │   └── CanvasRulers.tsx     ← Measurement guides
│   │   └── ui/                      ← shadcn/ui components
│   ├── hooks/
│   │   ├── useLabelEditor.ts        ← Editor state management
│   │   └── useAutoprintMonitor.ts   ← Print queue monitoring
│   ├── contexts/
│   │   ├── AuthContext.tsx          ← Authentication state
│   │   └── LabelEditorContext.tsx   ← Editor context
│   ├── lib/
│   │   ├── api.ts                   ← API client
│   │   ├── dymoFormat.ts            ← DYMO label formatting
│   │   └── utils.ts                 ← Utilities
│   ├── pages/
│   │   ├── Editor.tsx               ← Main editor page
│   │   ├── Index.tsx                ← Dashboard/home
│   │   ├── Login.tsx                ← Auth page
│   │   └── NotFound.tsx             ← 404 page
│   └── types/
│       └── label.ts                 ← TypeScript interfaces
├── vite.config.ts                   ← Vite configuration
├── tailwind.config.ts               ← Tailwind CSS
├── docker-compose.yml               ← Local development
└── Dockerfile                       ← Production build
```

### 💾 Important Data Structures

#### Label Template (TypeScript)
```typescript
interface Label {
  id: string;
  name: string;
  width: number;       // mm
  height: number;      // mm
  dpi: number;         // 203 for DYMO
  elements: Element[];
  createdAt: Date;
  updatedAt: Date;
}

interface Element {
  id: string;
  type: 'text' | 'image' | 'barcode' | 'qrcode';
  x: number;          // mm
  y: number;          // mm
  width: number;      // mm
  height: number;     // mm
  content: string;
  properties: Record<string, any>;
}
```

#### Print Job
```typescript
interface PrintJob {
  id: string;
  labelId: string;
  itemId?: string;
  printerId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}
```

## 🚀 Running the Application

### Development Mode
```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

### Docker (Production)
```bash
docker build -t homebox-label-studio:latest .
docker run -p 5173:5173 \
  -e VITE_API_BASE=http://localhost:5000 \
  -e VITE_HOMEBOX_API=http://localhost:7745 \
  homebox-label-studio:latest
```

### With Docker Compose (Full Stack)
```bash
docker-compose up -d
# All services start together with proper networking
```

## 🎨 Using Lovable for UI Enhancement

### ⚠️ Critical: Preserve Existing Integration

When using Lovable AI to improve the UI, **protect these critical integration points**:

#### 1. **Component Props & Exports**
```typescript
// DON'T CHANGE export names or prop interfaces
export const LabelCanvas = ({ ... }) => { ... }
export const EditorToolbar = ({ ... }) => { ... }
export const ItemBrowser = ({ ... }) => { ... }

// These are imported by parent components - signature changes break integration
```

#### 2. **Hook Signatures** (in `src/hooks/`)
```typescript
// Must maintain these exact interfaces
const useLabelEditor = () => {
  return {
    elements: Element[],
    selectedElement: Element | null,
    addElement: (type: string) => void,
    updateElement: (id: string, props: any) => void,
    deleteElement: (id: string) => void,
    exportLabel: (format: 'svg' | 'pdf' | 'dymo') => void,
    // ... other methods
  }
}

const useAutoprintMonitor = () => {
  return {
    printStatus: PrintJob[],
    monitorJob: (jobId: string) => void,
    // ... other methods
  }
}
```

#### 3. **API Endpoints** (in `src/lib/api.ts`)
```typescript
// Must maintain these exact endpoint URLs
export const apiClient = {
  items: {
    list: () => GET '/api/items',
    get: (id) => GET '/api/items/{id}',
  },
  labels: {
    list: () => GET '/api/labels',
    save: (label) => POST '/api/labels',
    delete: (id) => DELETE '/api/labels/{id}',
  },
  print: {
    submit: (job) => POST '/api/print',
    getStatus: (jobId) => GET '/api/print/{jobId}',
  }
}
```

#### 4. **Context Providers** (in `src/contexts/`)
```typescript
// Must wrap pages at appropriate level
<AuthProvider>
  <LabelEditorProvider>
    <App />
  </LabelEditorProvider>
</AuthProvider>
```

#### 5. **Docker Configuration** (in `Dockerfile`)
```dockerfile
# Don't change:
# - Build output directory (dist/)
# - Port exposure (5173)
# - Startup command
# - Environment variable names
```

### ✅ Safe Areas to Enhance with Lovable

1. **UI/UX Improvements**
   - Layout refinements
   - Button/form styling
   - Color schemes
   - Spacing and typography
   - Responsive design enhancements

2. **Component Visual Enhancement**
   - Add animations/transitions
   - Improve accessibility (a11y)
   - Better icons and imagery
   - Loading states and skeletons
   - Error messages and feedback

3. **Editor Canvas Features**
   - Grid/snap-to-grid improvements
   - Better selection indicators
   - Layer management UI
   - Zoom controls enhancement
   - Undo/redo visual feedback

4. **Print Preview**
   - Enhanced preview rendering
   - Print settings UI
   - Printer selection UI
   - Advanced formatting options

### 🔴 DO NOT MODIFY

- API endpoint URLs in `src/lib/api.ts`
- Hook return signatures in `src/hooks/`
- Component prop interfaces
- Context provider structure
- Docker base image or configuration
- Build output paths

### 📋 Instructions for Lovable

When briefing Lovable AI, include:

```markdown
# Homebox Label Studio UI Enhancement

This is a label design application integrated with:
- Homebox inventory system (API: port 7745)
- Companion microservice (API: port 5000)
- CUPS print server (port 631)

## Critical APIs to Preserve
[Include the API structures from above]

## Current Implementation Details
[Share your .lovable/plan.md from this repo]

## Safe Enhancement Areas
1. Visual improvements to the label editor canvas
2. Better template management UI
3. Enhanced print preview and job monitoring
4. Improved item browser layout
5. Better settings panel organization

## Keep Intact
- All API endpoint URLs
- Component export names
- Hook signatures
- Context provider structure
```

## 🔧 Configuration

### Environment Variables
```bash
# .env.example
VITE_API_BASE=http://localhost:5000           # Companion API
VITE_HOMEBOX_API=http://localhost:7745        # Homebox Core
VITE_CUPS_HOST=localhost:631                  # CUPS Server
VITE_AUTH_TIMEOUT=3600000                     # 1 hour
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 📚 Documentation Reference

- [CUPS Setup Guide](./docs/CUPS_SETUP.md)
- [Print Workflow Guide](./docs/WORKFLOW.md)
- [Quick Start Guide](./AUTOPRINT_QUICK_START.md)
- [Implementation Details](./IMPLEMENTATION_SUMMARY.txt)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## 🧪 Testing Print Integration

```bash
# Test CUPS connectivity
curl -v http://localhost:631/

# Test Companion API
curl http://localhost:5000/api/health

# Test Homebox connectivity
curl http://localhost:7745/api/v1/status

# Monitor print jobs
docker logs -f companion-api
docker logs -f cups-server
```

## 🐛 Common Issues & Solutions

### Print Jobs Not Appearing
1. Check CUPS connection: `curl http://localhost:631/`
2. Verify printer configuration: http://localhost:631/admin
3. Check Companion API logs: `docker logs companion-api`
4. Verify print endpoint: `curl -X POST http://localhost:5000/api/print`

### Items Not Loading
1. Check Homebox authentication
2. Verify token validity
3. Check CORS configuration in Companion API
4. Verify network connectivity between containers

### Label Template Issues
1. Check template format validation
2. Verify element coordinates are in mm
3. Check DYMO DPI settings (typically 203)
4. Validate element types match supported list

## 📦 Build & Deployment

### Build Docker Image
```bash
docker build -t homebox-label-studio:latest .

# Push to registry
docker tag homebox-label-studio:latest gorick1/homebox-label-studio:latest
docker push gorick1/homebox-label-studio:latest
```

### Production Deployment
```bash
docker run -d \
  --name label-studio \
  -p 5173:5173 \
  -e VITE_API_BASE=https://api.example.com \
  -e VITE_HOMEBOX_API=https://homebox.example.com \
  -e VITE_CUPS_HOST=cups.example.com:631 \
  gorick1/homebox-label-studio:latest
```

## 🤝 Contributing

When improving the UI with Lovable:
1. Test all editor functions after changes
2. Verify API calls still work
3. Test print workflow end-to-end
4. Ensure responsive design on tablet/desktop
5. Check accessibility standards

## 📝 Version History

- **Latest (Jan 2026)**: Full integration with Homebox, Companion API, CUPS, and DYMO support
- **Ready for UI enhancement** with Lovable AI while preserving integration

---

**This documentation is part of the integrated Homebox print automation system. Refer to parent project documentation for full system context.**

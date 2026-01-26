

## Plan: Add Barcode Feature + GitHub Push & Server Instructions

### Part 1: Add Barcode Element Support

#### 1.1 Update `useLabelEditor.ts` Hook
Add barcode element creation logic alongside text and QR code:
- Add `DEFAULT_BARCODE_ELEMENT` constant with:
  - `type: 'barcode'`
  - `data: '{asset_id}'` (default placeholder)
  - `format: 'code128'` (most common for inventory)
  - Default size: `width: 1.5, height: 0.4` inches
- Extend `addElement` function to accept `'barcode'` type
- Create barcode element with auto-incremented name

#### 1.2 Update `ElementsPanel.tsx` 
- Enable the disabled "Barcode" button (remove `disabled` prop)
- Add `onClick={() => addElement('barcode')}` handler
- Add a barcode preset: "Asset ID Barcode"

#### 1.3 Update `LabelCanvas.tsx` Canvas Rendering
Add barcode rendering in the draw effect:
- Draw barcode placeholder pattern (vertical lines of varying widths)
- Show the barcode data text below the barcode
- Use a Code128-style visual representation
- Apply selection border like other elements

#### 1.4 Update `PropertiesPanel.tsx`
Add barcode-specific property controls:
- **Format selector**: Dropdown with Code128, Code39, EAN-13 options
- **Data input**: Text field with placeholder insertion support
- **Show text toggle**: Option to show/hide data text below barcode
- Same placeholder insertion popover as QR codes

#### 1.5 Update `dymoFormat.ts` DYMO Export
Replace barcode placeholder with actual DYMO XML:
```xml
<BarcodeObject name="Barcode1" x="..." y="..." width="..." height="...">
  <Format>Code128</Format>
  <String>12345678</String>
</BarcodeObject>
```
- Add `barcodeElementToXml()` function
- Map format types to DYMO format names

#### 1.6 Update Types (minor)
The `BarcodeElement` interface already exists in `label.ts` but we may want to add:
- `showText: boolean` property to control whether data displays below barcode

---

### Part 2: Push to GitHub

**Note**: Lovable has built-in GitHub integration. Once I implement the barcode feature:

1. Click **GitHub** in the top toolbar of Lovable
2. If not connected, click **Connect to GitHub** and authorize
3. Select your GitHub account/organization
4. Either:
   - **Link to existing repo**: `gorick1/Homebox` (if available)
   - **Create new repo**: e.g., `homebox-label-designer`
5. Lovable will push all code automatically

The code will sync bidirectionally - any future changes in Lovable push to GitHub, and vice versa.

---

### Part 3: VSCode AI Implementation Instructions

After pushing to GitHub, provide your VSCode AI with these instructions to integrate with your server:

```markdown
# Homebox Label Designer - Server Integration Guide

## What This Project Is
A React frontend label designer that generates DYMO-compatible .lbl XML files.
It's designed to run alongside Homebox on a Raspberry Pi in Docker.

## File Structure
- `/src/` - React frontend (built with Vite)
- Built output goes to `/dist/` 

## Backend Requirements (FastAPI server.py)

### 1. Serve the React Build
Your existing `server.py` should serve static files from the built React app:

```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()

# Serve React build
app.mount("/static", StaticFiles(directory="dist"), name="static")

@app.get("/")
async def serve_spa():
    return FileResponse("dist/index.html")

# Catch-all for React Router
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    return FileResponse("dist/index.html")
```

### 2. Template API Endpoints
Add these endpoints to store/retrieve label templates:

```python
import json
from pathlib import Path

TEMPLATES_FILE = Path("/data/print_templates.json")

@app.get("/api/templates")
async def list_templates():
    if TEMPLATES_FILE.exists():
        return json.loads(TEMPLATES_FILE.read_text())
    return []

@app.get("/api/templates/default")
async def get_default_template():
    templates = json.loads(TEMPLATES_FILE.read_text()) if TEMPLATES_FILE.exists() else []
    default = next((t for t in templates if t.get("isDefault")), None)
    return default or templates[0] if templates else None

@app.post("/api/templates")
async def save_template(template: dict):
    templates = json.loads(TEMPLATES_FILE.read_text()) if TEMPLATES_FILE.exists() else []
    templates.append(template)
    TEMPLATES_FILE.write_text(json.dumps(templates, indent=2))
    return {"ok": True}
```

### 3. Print Integration
The frontend will call your existing print-proxy:

```python
import httpx

PRINT_PROXY_URL = "http://print-proxy:5000/print"

@app.post("/api/print")
async def print_label(lbl_data: bytes):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            PRINT_PROXY_URL,
            content=lbl_data,
            headers={"Content-Type": "application/octet-stream"}
        )
    return {"ok": response.status_code == 200}
```

### 4. Dockerfile Updates
Multi-stage build to compile React and serve with FastAPI:

```dockerfile
# Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Python runtime
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY server.py .
COPY --from=frontend-builder /app/dist ./dist
EXPOSE 8001
CMD ["uvicorn", "server.py:app", "--host", "0.0.0.0", "--port", "8001"]
```

### 5. Environment Configuration
The React app uses these environment variables (set in `.env` or Vite config):
- `VITE_HOMEBOX_URL`: Your Homebox instance (default: https://homebox.garrettorick.com)
- `VITE_PRINT_PROXY_URL`: Print proxy URL (default: http://print-proxy:5000)

### 6. Integration with Autoprint
Your autoprint service can call the template API:

```bash
# Get default template
curl http://localhost:8001/api/templates/default

# The response is a JSON template that your label generator can use
# to create .lbl files with item data substituted
```

## Key Files to Review
- `src/lib/dymoFormat.ts` - DYMO XML generation logic
- `src/types/label.ts` - Label element type definitions
- `src/lib/api.ts` - API endpoint configuration
```

---

### Summary of Changes

| Component | Changes |
|-----------|---------|
| `useLabelEditor.ts` | Add barcode element creation with default config |
| `ElementsPanel.tsx` | Enable barcode button, add preset |
| `LabelCanvas.tsx` | Add barcode visual rendering |
| `PropertiesPanel.tsx` | Add barcode format selector + data input |
| `dymoFormat.ts` | Add real DYMO barcode XML export |
| `label.ts` | Add `showText` to BarcodeElement (optional) |

After implementation, I'll push to GitHub and provide the full server integration guide for your VSCode AI.


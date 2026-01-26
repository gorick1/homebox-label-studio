

# Homebox Label Designer - Complete Feature Plan

## Overview
A professional, Figma-inspired label designer for Homebox that creates DYMO-compatible .lbl files. Built as a React frontend that you'll deploy in Docker alongside your existing Homebox stack on your Raspberry Pi.

**Ports:**
- This addon UI: 8001
- Your existing print-proxy: 5000
- Homebox: 7745
- Homebox Companion: 3001

---

## 1. Authentication

### Login Page
- Clean, centered login form with Homebox branding
- Connect to Homebox API at `homebox.garrettorick.com` for authentication
- Store JWT token for session persistence
- Auto-redirect to editor when authenticated
- Logout option in header

---

## 2. Label Designer Canvas (Core Feature)

### Visual WYSIWYG Editor
- Real-time preview at actual size (default: DYMO 30334 at 2.25" x 1.25")
- Clean white canvas with subtle shadow (Figma-style)
- Measurement rulers on top and left edges (in inches)
- Grid overlay with optional snap-to-grid
- Zoom controls (25% - 400%)

### Element Types
- **Text**: Customizable font, size (8-72pt), bold, italic, color
- **QR Codes**: Auto-generates URL to `https://homebox.garrettorick.com/item/[id]`
- **Barcodes**: Placeholder initially, future Code128 support
- **Shapes**: Lines, rectangles for visual structure

### Canvas Interactions
- Click to select (blue selection border)
- 8-point resize handles (corners + edges)
- Drag to move with boundary constraints
- Double-click text for inline editing
- Keyboard shortcuts: Undo (Ctrl+Z), Copy (Ctrl+C), Paste (Ctrl+V), Delete

---

## 3. Properties Panel (Right Sidebar)

### Element Properties
- Position (X/Y) in inches
- Size (Width/Height) in inches
- Text content editor
- Font settings: family dropdown, size slider, bold/italic toggles
- Color picker with preset palette
- QR code URL preview

### Dynamic Placeholders
- Insert menu for variables:
  - `{item_name}` - Item name
  - `{location}` - Location/shelf path
  - `{quantity}` - Stock count
  - `{item_id}` - UUID
  - `{asset_id}` - Asset ID
  - Custom field support
- Visual indicator (badge) for placeholder elements
- Toggle to preview with real Homebox data

---

## 4. Elements Panel (Left Sidebar)

### Element List
- Tree view showing all label elements
- Drag to reorder layers
- Type icons (text, QR, barcode)
- Quick delete button per element
- Click to select on canvas

### Quick Add Toolbar
- "Add Text" button
- "Add QR Code" button
- "Add Barcode" button (placeholder)
- Presets: "Item Name (Bold)", "Location (Small)", "QR to Item"

---

## 5. Template Management (Critical for Automation)

### Template Library
- Grid view with template thumbnails
- Create new template from current design
- Edit/rename/delete templates
- **Set as Default** button (for automatic printing workflow)
- Star favorites for quick access
- Search/filter templates

### API for External Scripts
Your existing scripts can call:
- `GET /api/templates` - List all templates
- `GET /api/templates/default` - Get the default template
- `GET /api/templates/{id}` - Get specific template
- `POST /api/templates` - Save new template
- `PUT /api/templates/{id}` - Update template
- `DELETE /api/templates/{id}` - Remove template

### Export/Import
- Export template as JSON file (for backup)
- Import template from JSON
- Download template as `.lbl` file

---

## 6. Item Browser & Preview

### Homebox Item Picker
- Search items from Homebox API
- Filter by location
- Display item name, location, quantity
- Select item to preview with real data

### Live Preview
- Toggle "Preview with Real Data"
- Placeholders substitute with actual item values
- QR code shows actual item URL
- Instant visual feedback

---

## 7. Print & Export

### Print Now (Direct Print)
- "Print" button sends .lbl to `http://print-proxy:5000/print`
- Loading state while printing
- Success/error toast notification
- Works for single labels

### Download .lbl
- Export as DYMO-compatible XML file
- Auto-generated filename with item name/date
- Uses existing dymoFormat logic (twips conversion)

### Batch Operations (Future)
- Select multiple items
- Apply template to all
- Print queue or batch export

---

## 8. Settings

### Label Settings
- Paper size selector (DYMO 30334 default, add custom sizes)
- Default font family and size
- Unit preference (inches/cm)
- Grid spacing

### Connection Settings
- Homebox URL configuration (default: `homebox.garrettorick.com`)
- Print-proxy URL (default: `http://print-proxy:5000`)
- Test connections button

---

## Visual Design

### Figma-Inspired Light Theme
- Clean white background (#FFFFFF)
- Subtle gray borders and shadows
- Light gray sidebar backgrounds (#F9FAFB)
- Blue accent for selection (#3B82F6)
- Consistent 8px spacing grid
- Rounded corners (8px) on panels
- Minimal chrome, maximum canvas space

### Layout
```
┌──────────────────────────────────────────────────────────┐
│  Logo   │  Zoom Controls  │  Undo/Redo  │  Print  │ User │
├─────────┼───────────────────────────────────────┼────────┤
│         │  ┌─ Ruler ────────────────────────┐   │        │
│ Elements│  │                                │   │ Props  │
│  Panel  │  │       Label Canvas             │   │ Panel  │
│         │  │       (with grid)              │   │        │
│─────────│  │                                │   │────────│
│Templates│  └────────────────────────────────┘   │ Place- │
│  List   │                                       │ holders│
└─────────┴───────────────────────────────────────┴────────┘
```

### Responsive
- Collapsible sidebars on smaller screens
- Mobile-friendly template browser
- Touch support for canvas editing

---

## Technical Implementation

### Frontend (React)
- React + TypeScript + Vite
- Tailwind CSS for styling
- Canvas-based label rendering
- Local state for editor
- API calls to FastAPI backend

### Backend Integration (Your Existing FastAPI)
The React app will communicate with your existing `server.py` on port 8001:
- `/api/login` - Auth with Homebox
- `/api/templates` - CRUD for templates
- `/api/download-lbl` - Generate .lbl file

### External Services
- **Print-Proxy** (port 5000): POST binary .lbl to print
- **Homebox API** (port 7745): Fetch items for preview
- **Templates Storage**: JSON files in `/data/` directory

### Deployment
Build the React app → Copy to your Pi → Docker container serves static files alongside FastAPI


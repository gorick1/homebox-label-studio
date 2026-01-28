

## Goal
Expand the label type selection to include the full range of DYMO LabelWriter labels (~40+ types), and replace the current dropdown with a searchable combobox since there will be many options.

---

## Current State

### Label Sizes (`src/types/label.ts`)
Currently only 5 label sizes:
```typescript
export const LABEL_SIZES: LabelSize[] = [
  { id: 'dymo-30334', name: 'DYMO 30334', width: 2.25, height: 1.25 },
  { id: 'dymo-30252', name: 'DYMO 30252', width: 3.5, height: 1.125 },
  { id: 'dymo-30336', name: 'DYMO 30336', width: 2.125, height: 1 },
  { id: 'dymo-30327', name: 'DYMO 30327', width: 3.5, height: 0.875 },
  { id: 'custom', name: 'Custom', width: 2, height: 1 },
];
```

### Label Size Selector (`src/components/editor/EditorToolbar.tsx`)
Uses a simple `Select` component - not searchable.

### Print Server Communication
The `labelToXml()` function in `dymoFormat.ts` already includes width/height in the XML output as twips, which the print proxy receives. This should work automatically with new sizes.

---

## Implementation Plan

### 1. Expand DYMO Label Sizes Database
**File:** `src/types/label.ts`

Add comprehensive DYMO LabelWriter label types. I'll also enhance the `LabelSize` interface to include:
- `category`: Group labels (Address, Shipping, Multi-Purpose, File Folder, etc.)
- `description`: Brief description of typical use

**New interface:**
```typescript
export interface LabelSize {
  id: string;           // e.g., 'dymo-30334'
  name: string;         // e.g., 'DYMO 30334'
  partNumber: string;   // e.g., '30334'
  width: number;        // inches
  height: number;       // inches
  category: string;     // e.g., 'Multi-Purpose'
  description: string;  // e.g., '2-1/4" x 1-1/4" Medium'
}
```

**Full DYMO label range to add (~40 types):**

| Part # | Category | Dimensions | Description |
|--------|----------|------------|-------------|
| 30251 | Address | 1-1/8" x 3-1/2" | Standard Address |
| 30252 | Address | 1-1/8" x 3-1/2" | 2-Up Address |
| 30253 | Address | 1-1/8" x 3-1/2" | 2-Up Address (Continued) |
| 30254 | Address | 1-1/8" x 3-1/2" | Clear Address |
| 30256 | Shipping | 2-5/16" x 4" | Large Shipping |
| 30258 | Disk | 2-1/4" dia | CD/DVD |
| 30269 | Shipping | 2-5/16" x 4" | Clear Shipping |
| 30270 | Address | 1-1/8" x 3-1/2" | White Plastic Address |
| 30271 | Address | 1-1/8" x 3-1/2" | 2-Up White Plastic |
| 30277 | File Folder | 9/16" x 3-7/16" | File Folder (Assorted) |
| 30299 | Jewelry | 7/16" x 2-1/8" | Price Tag / Jewelry |
| 30320 | Address | 1" x 3-1/2" | Address Labels |
| 30321 | Address | 1-4/10" x 3-1/2" | Large Address |
| 30323 | Shipping | 2-1/8" x 4" | Shipping Labels |
| 30324 | Disk | 2-1/4" dia | CD/DVD Labels |
| 30326 | VHS | 1-3/16" x 5-7/8" | VHS Spine |
| 30327 | File Folder | 9/16" x 3-1/2" | File Folder |
| 30330 | Return Address | 3/4" x 2" | Return Address |
| 30332 | Multi-Purpose | 1" x 1" | Square |
| 30333 | Multi-Purpose | 1/2" x 1" | Extra Small |
| 30334 | Multi-Purpose | 1-1/4" x 2-1/4" | Medium Multi-Purpose |
| 30335 | Multi-Purpose | 1-1/4" x 2-1/4" | Medium (Continued) |
| 30336 | Multi-Purpose | 1" x 2-1/8" | Small Multi-Purpose |
| 30337 | Multi-Purpose | 1/2" x 1" | Audio Cassette |
| 30339 | Multi-Purpose | 1" x 2-1/8" | (Continued Roll) |
| 30341 | Name Badge | 2-1/4" x 4" | Name Badge |
| 30343 | Name Badge | 2-1/4" x 4-1/8" | Name Badge (Clip) |
| 30345 | Suspension File | 9/16" x 2" | Hanging File Folder |
| 30346 | Library Barcode | 1/2" x 1-7/8" | Library Book Spine |
| 30347 | Name Badge | 2-1/4" x 4-1/8" | White Name Badge |
| 30348 | Name Badge | 2-1/4" x 4-1/8" | Red Name Badge |
| 30364 | Name Badge | 2-1/4" x 4" | Name Badge w/Clip |
| 30370 | Postage | 1-3/4" x 1-1/4" | Postage Stamp |
| 30373 | Postage | 2-5/16" x 10-1/2" | Internet Postage (2-Part) |
| 30374 | Appointment Card | 2" x 3-1/2" | Appointment Card |
| 30376 | Hanging Folder | 9/16" x 2" | Hanging File Tab Insert |
| 30377 | File Folder | 9/16" x 3-7/16" | File Folder (White) |
| 30378 | Diskette | 2" x 2-3/4" | 3.5" Diskette |
| 30379 | Diskette | 2-1/8" x 2-3/4" | 5.25" Diskette |
| 30380 | Multi-Purpose | 1-1/4" x 2-1/4" | Large Multi-Purpose |
| 30383 | Multi-Purpose | 1" x 3" | PC Postage 3-Part |
| 30384 | Postage | 2-5/16" x 7-1/2" | 3-Part Internet Postage |
| 30387 | Postage | 2-5/16" x 7" | Internet Postage Labels |

Plus a **Custom** option at the end for user-defined sizes.

---

### 2. Create Searchable Label Size Selector Component
**New File:** `src/components/editor/LabelSizeSelector.tsx`

Create a dedicated component using the `Command` (cmdk) component that:
- Shows a search input
- Groups labels by category
- Displays part number, dimensions, and description
- Shows the currently selected label prominently

**UI Design:**
```text
┌─────────────────────────────────────┐
│ 🔍 Search labels...                 │
├─────────────────────────────────────┤
│ Multi-Purpose                       │
│   30334 - 2¼" × 1¼" Medium         │
│   30336 - 2⅛" × 1" Small           │
│   30332 - 1" × 1" Square            │
│ Address                             │
│   30251 - 3½" × 1⅛" Standard       │
│   30252 - 3½" × 1⅛" 2-Up           │
│ Shipping                            │
│   30256 - 4" × 2⁵⁄₁₆" Large        │
│ ...                                 │
├─────────────────────────────────────┤
│ Custom                              │
│   Custom - Define your own size     │
└─────────────────────────────────────┘
```

Search will filter by:
- Part number (e.g., "30334")
- Category (e.g., "address")
- Description (e.g., "shipping")
- Dimensions (e.g., "2.25")

---

### 3. Update Editor Toolbar
**File:** `src/components/editor/EditorToolbar.tsx`

Replace the current `Select` component with the new `LabelSizeSelector` popover.

---

### 4. Print Server Compatibility
**No changes needed** - The existing `labelToXml()` function already converts the label size to twips and includes it in the XML:
```xml
<Paper width="3240" height="1800">
```

The print proxy receives this sizing information automatically.

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/editor/LabelSizeSelector.tsx` | Searchable combobox for label sizes |

### Files to Modify
| File | Changes |
|------|---------|
| `src/types/label.ts` | Expand `LabelSize` interface, add full DYMO label database |
| `src/components/editor/EditorToolbar.tsx` | Replace Select with LabelSizeSelector |

---

## User Experience

### Before
- Simple dropdown with 5 options
- No search capability
- No grouping or descriptions

### After
- Searchable popover with ~45 DYMO label types
- Grouped by category (Address, Shipping, Multi-Purpose, etc.)
- Shows part number, dimensions, and description
- Search by part number, category, or dimensions
- Custom option for non-standard sizes
- Changing label type automatically adjusts canvas size


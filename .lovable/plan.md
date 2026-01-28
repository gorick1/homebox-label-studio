

# Fix UI Issues and Add Keyboard Delete

## Issues Identified

Based on the code review and your description, there are **5 issues** to fix:

---

## Issue 1: Left Sidebar Cut Off Near Canvas

**Problem:** The left sidebar content gets visually cut off or obscured as it extends toward the canvas area.

**Root Cause:** The `overflow-hidden` class on the sidebar `<aside>` element (line 41 in Editor.tsx) combined with internal scrolling may be causing clipping issues. Additionally, the z-index stacking may need adjustment.

**Fix Location:** `src/pages/Editor.tsx` line 41

**Solution:** 
- Remove `overflow-hidden` from the aside and let the ScrollArea handle overflow
- Ensure proper z-index ordering so sidebar appears above any canvas overflow

---

## Issue 2: Blue Demo Mode Banner Blocking Toolbar Buttons

**Problem:** The demo mode banner at the top is preventing interaction with toolbar buttons.

**Root Cause:** The demo mode banner (lines 25-34 in Editor.tsx) may have z-index or pointer-event issues, OR the zoom indicator (line 473 in LabelCanvas.tsx) which uses `fixed` positioning with `z-10` may be overlapping the toolbar area.

**Fix Location:** 
- `src/components/editor/LabelCanvas.tsx` line 473 - change the zoom indicator positioning
- Potentially add `relative z-0` to main content area

**Solution:**
- Change the zoom indicator from `fixed` to `absolute` positioning within the canvas container
- Ensure proper stacking context so banner and toolbar don't interfere

---

## Issue 3: Rename "Asset ID Barcode" to "Item ID Barcode"

**Problem:** The Quick Presets section shows "Asset ID Barcode" but it actually uses `{item_id}`.

**Fix Location:** `src/components/editor/ElementsPanel.tsx` line 194

**Solution:** Change the label text from "Asset ID Barcode" to "Item ID Barcode"

---

## Issue 4: Quick Presets Don't Apply Formatting or Placeholders

**Problem:** Clicking "Item Name (Bold)" or "Location (Small)" just adds generic "New Text" instead of:
- Bold text with `{item_name}` placeholder
- Smaller text with `{location}` placeholder

**Root Cause:** The preset buttons all call `addElement('text')` which uses the default text element configuration. There's no preset-specific configuration being passed.

**Fix Location:** 
- `src/components/editor/ElementsPanel.tsx` lines 152-173 (preset buttons)
- `src/hooks/useLabelEditor.ts` - need to extend `addElement` to accept preset options

**Solution:** 
1. Extend the `addElement` function to accept an optional preset configuration
2. Create preset configurations for each Quick Preset:
   - **Item Name (Bold):** `{item_name}` content, bold font, larger size (14pt)
   - **Location (Small):** `{location}` content, normal font, smaller size (9pt)
   - **QR to Item:** Already works (uses default QR data)
   - **Item ID Barcode:** Already works (uses `{item_id}`)

---

## Issue 5: Backspace Key Should Delete Selected Element

**Problem:** Pressing backspace/delete when an element is selected does nothing.

**Fix Location:** `src/components/editor/LabelCanvas.tsx` or `src/pages/Editor.tsx`

**Solution:** Add a keyboard event listener that:
- Listens for `Backspace` or `Delete` key
- Checks if an element is selected
- Checks that the focus is NOT on an input/textarea (to avoid deleting while typing)
- Calls `deleteElement(selectedElementId)`

---

## Implementation Summary

| File | Changes |
|------|---------|
| `src/pages/Editor.tsx` | Fix sidebar overflow and z-index stacking |
| `src/components/editor/LabelCanvas.tsx` | Change zoom indicator from `fixed` to `absolute`, add keyboard delete handler |
| `src/components/editor/ElementsPanel.tsx` | Rename "Asset ID" to "Item ID", update preset buttons to use custom configs |
| `src/hooks/useLabelEditor.ts` | Extend `addElement` to accept optional preset configuration |

---

## Technical Details

### 1. Sidebar z-index fix in Editor.tsx

```tsx
// Line 41 - add relative z-10 to ensure sidebar stacks above canvas
<aside className="w-72 border-r bg-card/50 glass-panel relative z-10">
```

### 2. Zoom indicator positioning in LabelCanvas.tsx

```tsx
// Change from fixed to absolute, and position relative to canvas container
// Move inside the canvas container div instead of the outer container
<div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-full bg-card/80 glass-panel text-xs font-medium text-muted-foreground shadow-elevation-md">
  {zoom}%
</div>
```

### 3. Extended addElement function signature

```typescript
type TextPreset = {
  content: string;
  fontSize?: number;
  bold?: boolean;
  name?: string;
};

const addElement = (type: 'text' | 'qrcode' | 'barcode', preset?: TextPreset) => {
  // Apply preset values if provided
  if (type === 'text' && preset) {
    newElement = {
      ...DEFAULT_TEXT_ELEMENT,
      id,
      name: preset.name || `Text ${count}`,
      position,
      content: preset.content,
      font: {
        ...DEFAULT_TEXT_ELEMENT.font,
        size: preset.fontSize || 12,
        bold: preset.bold || false,
      },
    };
  }
};
```

### 4. Preset button configurations

```tsx
// Item Name (Bold)
onClick={() => addElement('text', { 
  content: '{item_name}', 
  fontSize: 14, 
  bold: true,
  name: 'Item Name'
})}

// Location (Small)
onClick={() => addElement('text', { 
  content: '{location}', 
  fontSize: 9, 
  bold: false,
  name: 'Location'
})}
```

### 5. Keyboard delete handler in LabelCanvas.tsx

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Only handle if an element is selected
    if (!selectedElementId) return;
    
    // Don't handle if user is typing in an input
    const activeElement = document.activeElement;
    if (activeElement?.tagName === 'INPUT' || 
        activeElement?.tagName === 'TEXTAREA') return;
    
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      deleteElement(selectedElementId);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedElementId, deleteElement]);
```

---

## Expected Results

After implementation:
1. Left sidebar content will be fully visible without clipping
2. All toolbar buttons will be clickable without interference from the demo banner
3. "Asset ID Barcode" preset will read "Item ID Barcode"
4. "Item Name (Bold)" preset will add bold text with `{item_name}` placeholder
5. "Location (Small)" preset will add smaller text with `{location}` placeholder
6. Pressing Backspace or Delete will remove the selected element from the canvas


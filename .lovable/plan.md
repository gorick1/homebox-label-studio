

# Fix Demo Banner and Sidebar Clipping Issues

## Problems Identified (from screenshot)

### Issue 1: Blue Gradient Bar
The demo mode banner (lines 27-36 in Editor.tsx) uses a blue gradient:
```
bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10
```
This creates the blue tinted bar that spans the full width. The user wants to **remove this entirely** - the gray "Demo Mode" indicator can stay (the Badge element with the "No Homebox connection" text).

### Issue 2: Left Sidebar Content Cut Off
Looking at the screenshot:
- The "Text" button is visible, but the "QR Code" button (which should be next to it in a 2-column grid) is completely invisible
- "No elements ye..." text is truncated at the right edge
- The sidebar width is `w-72` (288px), but the content inside is being clipped

**Root cause**: The combination of:
1. `overflow-hidden` on the aside element
2. `pr-3` padding pushing content left, but the grid buttons are still getting cut off
3. The 2-column grid (`grid-cols-2`) with buttons that don't fit in the available space after padding

---

## Solution

### Part 1: Remove the Blue Gradient Banner Completely
Remove the entire demo mode banner container. The demo mode indication can be shown in a more subtle way (e.g., just a small indicator in the toolbar or keep the Badge somewhere else).

**Simplest approach**: Just remove lines 27-36 from Editor.tsx entirely. Since the toolbar already shows the app name and controls, and the Badge could be moved to the toolbar if needed, this cleans up the UI.

### Part 2: Fix Sidebar Width and Clipping
The issue is that `w-72` (288px) minus border, padding, and scrollbar leaves insufficient space for the 2-column grid.

**Solution options**:
1. **Increase sidebar width** from `w-72` to `w-80` (320px) - gives more room
2. **Stack buttons vertically** instead of 2-column grid
3. **Reduce button padding/sizing**

**Recommended**: Increase sidebar width to `w-80` and ensure content has proper padding. This provides enough space for the 2-column layout while remaining visually balanced.

---

## Implementation Details

### File: `src/pages/Editor.tsx`

**Change 1**: Remove the entire demo mode banner (lines 27-36)
- Delete the conditional block that renders the blue gradient banner
- Keep just the `<EditorToolbar />` in the header region

**Change 2**: Increase left sidebar width
- Change `w-72` to `w-80` on the left aside element
- This gives 320px instead of 288px, providing adequate space for content

**Change 3**: Ensure proper content padding
- Keep the `pr-3` wrapper inside ScrollArea but this time with more width to work with

### Before (Editor.tsx header region):
```tsx
<div className="relative z-50">
  {isDemoMode && (
    <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-center gap-2 pointer-events-none">
      <Sparkles className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium text-foreground">Demo Mode</span>
      <Badge variant="secondary" className="text-xs pointer-events-auto">
        No Homebox connection
      </Badge>
    </div>
  )}
  <EditorToolbar />
</div>
```

### After (Editor.tsx header region):
```tsx
<div className="relative z-50">
  <EditorToolbar />
</div>
```

### Before (left sidebar):
```tsx
<aside className="w-72 border-r bg-card/50 glass-panel relative z-20 overflow-hidden">
```

### After (left sidebar):
```tsx
<aside className="w-80 border-r bg-card/50 glass-panel relative z-20 overflow-hidden">
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Editor.tsx` | Remove demo mode banner (lines 27-36), increase sidebar width from `w-72` to `w-80` |

---

## Visual Result

### After changes:
- No blue gradient bar at the top
- Toolbar is the only header element
- Left sidebar has full 320px width
- "Text" and "QR Code" buttons both visible in the 2-column grid
- All content and text fully visible without clipping

---

## Optional Enhancement
If you still want a demo mode indicator somewhere, it could be added to the EditorToolbar component as a small badge next to the logo or in the user menu. Let me know if you'd like that added.


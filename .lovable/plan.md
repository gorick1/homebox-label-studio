

# Fix Scrolling & Improve Default Buttons

## Problem Analysis

### Issue 1: Sidebar Scrolling
The left sidebar contains two panels stacked vertically (ElementsPanel + TemplatesPanel), both using `flex-1`. This causes them to compete for space, and when content exceeds the available height, it gets cut off instead of scrolling.

**Root Cause:**
- Both panels have `flex-1` which means they try to grow equally
- The combined content height exceeds viewport height
- ScrollArea needs a **fixed or constrained height** to enable scrolling, but parent containers are fighting for flex-grow

### Issue 2: Default Buttons Appearance
The "Item" and "Container" default toggle buttons on template rows are currently plain, small buttons that are hard to see and don't match the modern glass aesthetic.

---

## Solution

### Part 1: Fix Sidebar Scrolling

**Strategy:** Give each panel section a proper height constraint and make the entire sidebar scrollable, OR split the sidebar into collapsible sections with independent scroll areas.

**Recommended Approach:** Make the sidebar a single scrollable container with proper flex children.

**File:** `src/pages/Editor.tsx`
- Wrap the left sidebar content in a ScrollArea that spans the full sidebar height

**File:** `src/components/editor/ElementsPanel.tsx`
- Remove `flex-1` and `overflow-hidden` 
- Allow natural height based on content
- Keep internal ScrollArea only for the layers list (which can get long)

**File:** `src/components/editor/TemplatesPanel.tsx`
- Remove `flex-1` and `min-h-0`
- Give templates section a max-height with its own scroll
- OR make it collapsible

### Part 2: Improve Default Buttons

Replace the plain text buttons with modern pill-style toggle buttons that:
- Use distinct colors for active/inactive states
- Have icons (checkmark when active)
- Use the glass aesthetic with subtle backgrounds
- Are more touch-friendly with better sizing

---

## Implementation Details

### Changes to `src/pages/Editor.tsx`

Update the left sidebar to use a ScrollArea wrapper:

```jsx
{/* Left sidebar: Elements + Templates */}
<aside className="flex flex-col w-72 border-r bg-card/50 glass-panel">
  <ScrollArea className="flex-1">
    <ElementsPanel />
    <TemplatesPanel />
  </ScrollArea>
</aside>
```

### Changes to `src/components/editor/ElementsPanel.tsx`

Remove flex-1 from the root and adjust structure:

```jsx
// Change line 106 from:
<div className="flex-1 flex flex-col overflow-hidden">

// To:
<div className="flex flex-col">
```

For the Layers section, give it a max-height:

```jsx
// Around line 209, add max-height to ScrollArea:
<ScrollArea className="max-h-48">
```

### Changes to `src/components/editor/TemplatesPanel.tsx`

**1. Update root container (line 211-212):**
```jsx
// From:
<div className="flex-1 border-t flex flex-col min-h-0">

// To:
<div className="border-t flex flex-col">
```

**2. Give templates list a max-height (line 308):**
```jsx
// From:
<ScrollArea className="flex-1">

// To:
<ScrollArea className="max-h-64">
```

**3. Redesign the default toggle buttons (lines 351-384):**

Replace the current plain buttons with styled toggle pills:

```jsx
{/* Item Default Toggle */}
<button
  onClick={(e) => { /* existing logic */ }}
  className={cn(
    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all",
    template.isDefaultForItems
      ? "bg-primary text-primary-foreground shadow-sm"
      : "bg-muted/50 text-muted-foreground hover:bg-muted"
  )}
>
  {template.isDefaultForItems && <Check className="h-3 w-3" />}
  Item
</button>

{/* Container Default Toggle */}
<button
  onClick={(e) => { /* existing logic */ }}
  className={cn(
    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all",
    template.isDefaultForContainers
      ? "bg-emerald-500 text-white shadow-sm"
      : "bg-muted/50 text-muted-foreground hover:bg-muted"
  )}
>
  {template.isDefaultForContainers && <Check className="h-3 w-3" />}
  Container
</button>
```

---

## Visual Preview

### Before (Default Buttons)
```
[ Item ] [ Container ]  ← Plain ghost buttons, hard to see
```

### After (Default Buttons)
```
[● Item] [Container]   ← When Item is default: blue pill with checkmark
[Item] [● Container]   ← When Container is default: green pill with checkmark  
[Item] [Container]     ← Neither default: subtle gray pills
```

### Before (Sidebar)
```
┌──────────────────┐
│ Elements Panel   │ ← Takes 50% height
│ (cut off)        │
├──────────────────┤
│ Templates Panel  │ ← Takes 50% height
│ (cut off)        │
└──────────────────┘
```

### After (Sidebar)
```
┌──────────────────┐
│ Elements Panel   │
│ └─ Layers (scroll)
│ Quick Presets    │
│ Templates Panel  │
│ └─ List (scroll) │
│                  │ ← Full sidebar scrolls if needed
└──────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Editor.tsx` | Wrap sidebar content in ScrollArea |
| `src/components/editor/ElementsPanel.tsx` | Remove flex-1, add max-height to layers scroll |
| `src/components/editor/TemplatesPanel.tsx` | Remove flex-1, add max-height, redesign default buttons as pills |

---

## Summary

1. **Scrolling Fix**: Remove competing `flex-1` from both panels and wrap the entire sidebar in a ScrollArea. Give sub-sections appropriate max-heights for their internal scrolling.

2. **Button Styling**: Replace plain Button components with styled pill toggles using distinct colors (blue for Item, green for Container) and checkmark icons when active.


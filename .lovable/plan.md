

# Fix Build Errors Plan

## Issues Identified

Based on the build errors and code review, there are **4 distinct issues** to fix:

---

## Issue 1: Duplicate `variant` Attributes in TemplatesPanel.tsx

**Files affected:** `src/components/editor/TemplatesPanel.tsx` (lines 352, 365 and lines 369, 383)

**Problem:** Two buttons have `variant` specified twice - once at the beginning and once at the end of the props list:
```jsx
// Line 351-365: Button has variant="ghost" on line 352 AND variant={...} on line 365
<Button
  variant="ghost"  // <-- First variant
  size="sm"
  className="h-6 px-2 text-xs"
  onClick={...}
  title={...}
  variant={template.isDefaultForItems ? "default" : "ghost"}  // <-- Duplicate!
>
```

**Fix:** Remove the first `variant="ghost"` on lines 352 and 370, keeping only the conditional variant expressions on lines 365 and 383.

---

## Issue 2: `LabelTemplate` Type Missing `size` and `elements`

**Files affected:** `src/hooks/useAutoprintMonitor.ts` (lines 40-41, 60)

**Problem:** The code accesses `template.size` and `template.elements` directly on `LabelTemplate`, but according to `types/label.ts`, these properties are nested inside `template.label`:

```typescript
interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  label: Label;  // <-- size and elements are INSIDE this
  ...
}

interface Label {
  id: string;
  name: string;
  size: LabelSize;      // <-- Here
  elements: LabelElement[];  // <-- Here
  ...
}
```

**Fix:** Change all references from:
- `template.size` → `template.label.size`
- `template.elements` → `template.label.elements`

---

## Issue 3: `HomeboxItem` Missing `type` Property

**Files affected:** `src/hooks/useAutoprintMonitor.ts` (line 132)

**Problem:** The code checks `item.type === 'location'` but `HomeboxItem` interface doesn't have a `type` property:

```typescript
interface HomeboxItem {
  id: string;
  name: string;
  description: string;
  location: { ... };
  quantity: number;
  assetId: string;
  notes: string;
  customFields: Record<string, string>;
  // No 'type' property!
}
```

**Fix:** Either:
1. Add `type?: 'item' | 'location'` to `HomeboxItem` interface, OR
2. Change the logic to determine item type differently (e.g., check if `item.location` exists)

Option 2 is safer since the existing logic already has a fallback (`|| !item.location`).

**Updated code:**
```typescript
// Remove item.type check since it doesn't exist
const isLocation = !item.location;
```

---

## Summary of Changes

| File | Line(s) | Change |
|------|---------|--------|
| `TemplatesPanel.tsx` | 352 | Remove duplicate `variant="ghost"` |
| `TemplatesPanel.tsx` | 370 | Remove duplicate `variant="ghost"` |
| `useAutoprintMonitor.ts` | 40 | Change `template.size.width` → `template.label.size.width` |
| `useAutoprintMonitor.ts` | 41 | Change `template.size.height` → `template.label.size.height` |
| `useAutoprintMonitor.ts` | 60 | Change `template.elements` → `template.label.elements` |
| `useAutoprintMonitor.ts` | 132 | Change `item.type === 'location' \|\| !item.location` → `!item.location` |

---

## Technical Notes

These are straightforward type-safety fixes that align the code with the defined TypeScript interfaces. No functional changes are needed - just correcting property access paths and removing duplicate JSX attributes.


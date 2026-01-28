
## Goal
Fix two UI issues in the Editor screen:
1) The “Demo Mode” (blue) banner at the top is overlapping / blocking toolbar interactions.
2) The left sidebar (Add Elements → Templates) content is still getting visually cut off near the canvas.

---

## What I found in the code
### Current Editor layout (`src/pages/Editor.tsx`)
- Demo banner is rendered above the toolbar in normal document flow (not fixed/sticky).
- The main editor row uses `overflow-hidden`.
- Left sidebar uses:
  - `relative z-10 overflow-hidden`
  - a `ScrollArea` that is `h-full`
- The shared `ScrollArea` component (`src/components/ui/scroll-area.tsx`) uses `overflow-hidden` on the Root and the scrollbar is rendered on top of the viewport area (Radix custom scrollbar). This can visually “cover” the right edge of content if content sits flush to the right.

### Why the left sidebar can look “cut off”
There are two common causes that match your description:
1) **Scrollbar overlay**: Radix’s vertical scrollbar can sit on top of content at the right edge, making the last few pixels of text/buttons appear clipped.
2) **Stacking/overlap near the canvas**: If any canvas/center content ends up painting above the sidebar (z-index stacking context), the sidebar’s right edge can look like it’s being “covered”.

### Why the demo banner can block toolbar clicks
Even if the banner is visually above the toolbar, in some viewport/responsive states it can end up overlapping the toolbar’s click area (e.g., if layout wraps or if something becomes positioned/sticky elsewhere). The safest fix is to:
- Ensure the header region has a clear stacking order above everything else.
- Ensure the banner doesn’t intercept pointer events outside its own content.

---

## Implementation plan (targeted, minimal changes)

### 1) Make the top region “always on top” and never block toolbar buttons
**File:** `src/pages/Editor.tsx`

- Wrap the Demo banner + `EditorToolbar` in a single header container that establishes a stacking context, e.g.:
  - `relative z-50` (or similar) so it’s always above the canvas area.
- Add `pointer-events-none` to the *banner container* so it cannot steal clicks from the toolbar if any overlap occurs.
  - If we ever add links/buttons inside the banner later, we can selectively re-enable with `pointer-events-auto` on those specific children.

Result:
- Even if there’s a layout overlap, the banner won’t block toolbar clicks.
- The whole header region stays above the editor body visually and interactively.

---

### 2) Fix left sidebar “cut off near canvas” by preventing right-edge overlay and improving stacking
**File:** `src/pages/Editor.tsx`

Do two things:

#### 2a) Ensure sidebar stacks above center canvas
- Increase left sidebar stacking from `z-10` to a higher value (e.g. `z-20` or `z-30`)
- Ensure the center `<main>` establishes a lower stacking context (e.g. `relative z-0`)
This prevents any canvas-layered elements from visually covering the sidebar edge.

#### 2b) Add right padding inside the sidebar scroll viewport (avoid scrollbar covering content)
Because Radix ScrollArea’s scrollbar can overlay content, we’ll add a small right padding inside the ScrollArea content for the left sidebar only:
- Inside the `<ScrollArea>`, wrap sidebar panels in a container like:
  - `<div className="pr-3"> ... </div>`
This ensures text/buttons don’t render under the vertical scrollbar or get “shaved off” at the right edge.

Important: This is scoped to the left sidebar only (does not change global ScrollArea behavior everywhere else).

---

### 3) Re-verify in multiple viewport sizes
After changes, I’ll validate in:
- Desktop width (your typical editor use)
- Narrower widths where toolbar might wrap
- With Demo Mode enabled (banner visible)
Checks:
- Toolbar buttons clickable (Undo/Redo/Zoom/Print/Download/User menu)
- No visual clipping on the right edge of the left sidebar (Add Elements buttons, Quick Presets, Layers, Templates)
- Sidebar still scrolls correctly

---

## Files to change
1) `src/pages/Editor.tsx`
- Add a high z-index header wrapper for banner + toolbar
- Make banner `pointer-events-none`
- Adjust stacking: sidebar z-index up, main z-index down
- Add `pr-*` wrapper inside sidebar ScrollArea to prevent right-edge clipping

---

## Expected outcome
- Demo banner never blocks any toolbar buttons (even if overlap happens).
- Left sidebar content no longer appears cut off as it approaches the canvas; text/buttons have comfortable right padding and proper layering.

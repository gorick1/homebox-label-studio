

# Persist Mailer ID in Settings Panel

## Overview
Add the USPS Mailer ID to the Settings panel so it persists across sessions, and pre-populate it in the IMb generation dialog. The routing code (ZIP) is already correctly pulled from the address element.

---

## Current Behavior

**IMb Generation Dialog** (`AddressPropertiesPanel.tsx`):
- The Mailer ID field starts empty each time the dialog opens (line 49)
- Users must re-enter their Mailer ID every time

**Routing Code**:
- Already correctly uses the address's ZIP data (lines 98-104)
- `buildRoutingCode(element.address.zip5, element.address.zip4, element.address.deliveryPoint)`
- No changes needed here

---

## Changes Required

### 1. Add Mailer ID Storage Functions

**File:** `src/lib/uspsApi.ts`

Add helper functions for Mailer ID persistence (similar to USPS User ID):

```typescript
const MAILER_ID_KEY = 'usps_mailer_id';

export function getMailerId(): string | null {
  return localStorage.getItem(MAILER_ID_KEY);
}

export function setMailerId(mailerId: string): void {
  localStorage.setItem(MAILER_ID_KEY, mailerId);
}

export function removeMailerId(): void {
  localStorage.removeItem(MAILER_ID_KEY);
}
```

---

### 2. Add Mailer ID to Settings Panel

**File:** `src/components/editor/EditorSettingsPanel.tsx`

Add a new input field in the USPS Integration section:

| Setting | Description |
|---------|-------------|
| USPS Web Tools User ID | (existing) For address validation API |
| **Mailer ID** | 6 or 9 digit USPS-assigned ID for IMb barcodes |

The Mailer ID field will:
- Store value in localStorage on change
- Show helper text explaining where to get a Mailer ID
- Validate that input is 6 or 9 digits only

---

### 3. Pre-populate Mailer ID in IMb Dialog

**File:** `src/components/editor/AddressPropertiesPanel.tsx`

Initialize the `imbMailerId` state from localStorage:

```typescript
// Change from:
const [imbMailerId, setImbMailerId] = useState('');

// To:
const [imbMailerId, setImbMailerId] = useState(getMailerId() || '');
```

When the dialog opens, it will now show the saved Mailer ID.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/uspsApi.ts` | Add `getMailerId()`, `setMailerId()`, `removeMailerId()` functions |
| `src/components/editor/EditorSettingsPanel.tsx` | Add Mailer ID input field to USPS Integration section |
| `src/components/editor/AddressPropertiesPanel.tsx` | Initialize `imbMailerId` from localStorage |

---

## Updated Settings Panel UI

```
┌─────────────────────────────────────────┐
│ USPS Integration                        │
├─────────────────────────────────────────┤
│ USPS Web Tools User ID                  │
│ Required for address validation...      │
│ ┌─────────────────────────────────────┐ │
│ │ [Enter your USPS User ID]          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Mailer ID                               │
│ Your 6 or 9 digit USPS-assigned ID...   │
│ ┌─────────────────────────────────────┐ │
│ │ [123456789]                         │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## User Experience

**Before:**
1. Open IMb dialog → Mailer ID field is empty
2. Type Mailer ID each time
3. Close app, come back → Have to re-enter

**After:**
1. Set Mailer ID once in Settings
2. Open IMb dialog → Mailer ID is pre-filled
3. Can still override per-barcode if needed
4. Persists across browser sessions


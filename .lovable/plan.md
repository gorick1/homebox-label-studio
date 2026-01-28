

# Add Address Element with USPS Validation and Intelligent Mail Barcode

## Overview

Add a new **Address** element type to the label editor that supports:
1. Structured address input (Name, Street 1, Street 2, City, State, ZIP)
2. USPS Address Validation/Correction via the USPS Web Tools API
3. Generation of USPS Intelligent Mail Barcode (IMb) from the address

This extends the label maker beyond Homebox inventory labels to general mailing/shipping use cases.

---

## Technical Architecture

### New Element Type: `address`

A new element type that stores structured address data and can display it formatted on the label.

```typescript
// In src/types/label.ts
export interface AddressElement extends BaseLabelElement {
  type: 'address';
  address: {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip5: string;
    zip4?: string;  // +4 extension (populated by USPS validation)
    deliveryPoint?: string; // 2-digit delivery point (for IMb)
    checkDigit?: string;    // Check digit (for IMb)
  };
  font: FontSettings;
  color: Color;
  isValidated: boolean;  // True if address has been validated by USPS
}

export interface IMBarcodeElement extends BaseLabelElement {
  type: 'imbarcode';
  barcodeId: string;      // 2-digit Barcode ID (e.g., "00")
  serviceTypeId: string;  // 3-digit Service Type ID
  mailerId: string;       // 6 or 9 digit Mailer ID
  serialNumber: string;   // Serial number (fills remaining digits)
  routingCode: string;    // ZIP+4+Delivery Point (from validated address)
  showText: boolean;      // Show human-readable digits below barcode
}
```

---

## USPS Integration

### USPS Web Tools API

The USPS provides free API access for address validation. Requires registration at:
https://www.usps.com/business/web-tools-apis/

**API Endpoint**: `https://secure.shippingapis.com/ShippingAPI.dll`

**Address Validation Request (XML)**:
```xml
<AddressValidateRequest USERID="YOUR_USER_ID">
  <Address>
    <FirmName>Company Name</FirmName>
    <Address1>Suite 100</Address1>
    <Address2>123 Main Street</Address2>
    <City>Anytown</City>
    <State>NY</State>
    <Zip5>12345</Zip5>
    <Zip4></Zip4>
  </Address>
</AddressValidateRequest>
```

**Response includes**:
- Corrected/standardized address
- ZIP+4 extension
- Delivery Point (2 digits) - needed for IMb
- Check digit - needed for IMb

### Edge Function for USPS API

Create an edge function to proxy USPS API calls (keeps API credentials secure):

```typescript
// supabase/functions/usps-validate/index.ts
```

Since this project doesn't currently use Supabase, I'll implement this as a configurable API endpoint that can be self-hosted alongside the print proxy.

---

## Intelligent Mail Barcode (IMb)

The IMb is a 65-bar barcode encoding a 31-digit tracking code:

| Field | Digits | Description |
|-------|--------|-------------|
| Barcode ID | 2 | Type of mail piece |
| Service Type ID | 3 | Class of mail |
| Mailer ID | 6 or 9 | Assigned by USPS |
| Serial Number | 9 or 6 | Unique piece ID |
| Routing Code | 0, 5, 9, or 11 | ZIP, ZIP+4, or ZIP+4+DP |

**Total**: 20-31 digits depending on routing code length

### IMb Encoding

The IMb uses a complex encoding scheme:
1. Convert tracking code to binary
2. Apply Reed-Solomon error correction
3. Map to 65 bar patterns (Ascender, Descender, Full, Tracker)

I'll implement a client-side IMb generator in JavaScript, or use an existing library.

---

## Implementation Plan

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/uspsApi.ts` | USPS API client for address validation |
| `src/lib/intelligentMailBarcode.ts` | IMb encoding/generation |
| `src/components/editor/AddressPropertiesPanel.tsx` | Address-specific properties UI |

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/label.ts` | Add `AddressElement` and `IMBarcodeElement` types |
| `src/components/editor/ElementsPanel.tsx` | Add Address and IMb buttons |
| `src/components/editor/PropertiesPanel.tsx` | Render address properties when selected |
| `src/components/editor/LabelCanvas.tsx` | Render address text and IMb barcode |
| `src/hooks/useLabelEditor.ts` | Add address and IMb element creation defaults |

---

## User Interface Design

### Elements Panel - New Buttons

```
┌────────────────────────────┐
│ Add Elements               │
├────────────────────────────┤
│ [Text] [QR]                │
│ [Barcode]                  │
│ [Address] [IMb]  ← NEW     │
└────────────────────────────┘
```

### Properties Panel - Address Element Selected

```
┌────────────────────────────────────┐
│ Address                            │
│ ┌────────────────────────────────┐ │
│ │ [Validate Address] [Gen IMb]   │ │  ← Action buttons
│ └────────────────────────────────┘ │
├────────────────────────────────────┤
│ Recipient                          │
│ ┌────────────────────────────────┐ │
│ │ John Smith                     │ │
│ └────────────────────────────────┘ │
│ Company (optional)                 │
│ ┌────────────────────────────────┐ │
│ │                                │ │
│ └────────────────────────────────┘ │
│ Street Address                     │
│ ┌────────────────────────────────┐ │
│ │ 123 Main Street                │ │
│ └────────────────────────────────┘ │
│ Address Line 2                     │
│ ┌────────────────────────────────┐ │
│ │ Apt 4B                         │ │
│ └────────────────────────────────┘ │
│ ┌──────────┐ ┌────┐ ┌───────────┐ │
│ │ City     │ │ ST │ │ ZIP       │ │
│ └──────────┘ └────┘ └───────────┘ │
├────────────────────────────────────┤
│ ✓ Validated (ZIP+4: 12345-6789)   │  ← Status indicator
└────────────────────────────────────┘
```

### "Validate Address" Button Behavior

1. User clicks "Validate Address"
2. Shows loading spinner
3. Calls USPS API (via edge function or configured endpoint)
4. On success:
   - Updates address fields with corrected values
   - Populates ZIP+4 and delivery point
   - Shows green checkmark "Validated"
5. On error:
   - Shows error message (address not found, ambiguous, etc.)
   - Suggests corrections if available

### "Generate IMb" Button Behavior

1. Only enabled if address is validated (has ZIP+4 and delivery point)
2. Opens dialog for IMb configuration:
   - Barcode ID (dropdown with common values)
   - Service Type ID (dropdown)
   - Mailer ID (text input - user enters their USPS-assigned ID)
   - Serial Number (auto-generated or manual)
3. Generates IMb element and adds it to the label

---

## Canvas Rendering

### Address Element Rendering

Renders formatted address block:
```
John Smith
123 Main Street
Apt 4B
Anytown, NY 12345-6789
```

### IMb Rendering

Draws the 65-bar pattern using 4 bar types:
- **Ascender (A)**: Top half bar
- **Descender (D)**: Bottom half bar
- **Full (F)**: Full height bar
- **Tracker (T)**: Center tick only

The bars are drawn with precise spacing per USPS specifications.

---

## API Configuration

Since this project is self-hosted without Supabase, USPS API credentials will be configured via:

1. **Environment variable** or **settings panel**:
   ```typescript
   // In src/lib/api.ts
   const API_CONFIG = {
     // ... existing config
     uspsUserId: process.env.USPS_USER_ID || localStorage.getItem('usps_user_id'),
   };
   ```

2. **Settings panel** to enter USPS User ID:
   - Add a new section in EditorSettingsPanel
   - Store in localStorage for persistence
   - Required before validation feature works

---

## Implementation Order

1. **Phase 1: Types and Data Model**
   - Add `AddressElement` and `IMBarcodeElement` to `types/label.ts`
   - Update `useLabelEditor.ts` with default address/IMb elements

2. **Phase 2: UI Components**
   - Add Address and IMb buttons to `ElementsPanel.tsx`
   - Create address properties section in `PropertiesPanel.tsx`
   - Add USPS User ID field to `EditorSettingsPanel.tsx`

3. **Phase 3: Canvas Rendering**
   - Add address text rendering to `LabelCanvas.tsx`
   - Implement IMb barcode drawing

4. **Phase 4: USPS Integration**
   - Create `src/lib/uspsApi.ts` for address validation
   - Implement validation flow with loading states

5. **Phase 5: IMb Generation**
   - Create `src/lib/intelligentMailBarcode.ts`
   - Implement full IMb encoding algorithm
   - Add IMb generation dialog/flow

---

## Notes

- **USPS API Registration**: Users will need to register for free USPS Web Tools API access
- **Self-hosted**: All API calls go through a proxy to keep credentials secure
- **Offline**: Address elements work offline; validation requires network
- **No Supabase dependency**: Uses same architecture as existing print/API endpoints


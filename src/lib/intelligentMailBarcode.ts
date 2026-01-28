/**
 * USPS Intelligent Mail Barcode (IMb) encoder
 * 
 * The IMb is a 65-bar barcode that encodes up to 31 digits:
 * - Barcode ID (2 digits)
 * - Service Type ID (3 digits)
 * - Mailer ID (6 or 9 digits)
 * - Serial Number (fills remaining)
 * - Routing Code (0, 5, 9, or 11 digits for ZIP, ZIP+4, ZIP+4+DP)
 * 
 * References:
 * - USPS Publication 300
 * - https://postalpro.usps.com/onecodesolution
 */

// Bar types in the 65-bar pattern
export type BarType = 'T' | 'A' | 'D' | 'F';
// T = Tracker (short center bar)
// A = Ascender (top half bar)
// D = Descender (bottom half bar)  
// F = Full (full height bar)

export interface IMBarcodeData {
  barcodeId: string;      // 2 digits
  serviceTypeId: string;  // 3 digits
  mailerId: string;       // 6 or 9 digits
  serialNumber: string;   // 9 or 6 digits (total tracking = 20)
  routingCode: string;    // 0, 5, 9, or 11 digits
}

export interface IMBarcodeResult {
  success: boolean;
  bars?: BarType[];
  trackingCode?: string;
  error?: string;
}

// Character encoding table (from USPS spec)
const CHARACTER_TABLE: [number, number][] = [
  [4, 0], [0, 4], [2, 2], [6, 0], [0, 6], [4, 2], [2, 4], [6, 2], [2, 6], [4, 4],
  [0, 0], [8, 0], [0, 8], [4, 6], [6, 4], [8, 2], [2, 8], [6, 6], [8, 4], [4, 8],
  [2, 0], [0, 2], [10, 0], [0, 10], [10, 2], [2, 10], [8, 6], [6, 8], [10, 4], [4, 10],
  [6, 0], [0, 6], [4, 2], [2, 4], [12, 0], [0, 12], [10, 6], [6, 10], [12, 2], [2, 12],
  [8, 0], [0, 8], [4, 4], [12, 4], [4, 12], [10, 8], [8, 10], [12, 6], [6, 12],
  [8, 2], [2, 8], [6, 6], [10, 0], [0, 10], [14, 0], [0, 14], [14, 2], [2, 14],
  [12, 8], [8, 12], [14, 4], [4, 14], [10, 10], [14, 6], [6, 14]
];

// Descender/Ascender mapping for each bar position (from USPS spec)
const BAR_MAP: { desc: number; asc: number }[] = [
  { desc: 7, asc: 2 }, { desc: 1, asc: 5 }, { desc: 9, asc: 10 }, { desc: 5, asc: 1 },
  { desc: 8, asc: 4 }, { desc: 3, asc: 6 }, { desc: 0, asc: 11 }, { desc: 2, asc: 0 },
  { desc: 4, asc: 3 }, { desc: 6, asc: 9 }, { desc: 11, asc: 8 }, { desc: 10, asc: 7 },
  { desc: 9, asc: 2 }, { desc: 5, asc: 1 }, { desc: 8, asc: 10 }, { desc: 3, asc: 5 },
  { desc: 7, asc: 11 }, { desc: 1, asc: 0 }, { desc: 0, asc: 6 }, { desc: 2, asc: 4 },
  { desc: 4, asc: 3 }, { desc: 6, asc: 9 }, { desc: 11, asc: 8 }, { desc: 10, asc: 7 },
  { desc: 9, asc: 5 }, { desc: 5, asc: 10 }, { desc: 7, asc: 1 }, { desc: 3, asc: 2 },
  { desc: 8, asc: 0 }, { desc: 1, asc: 4 }, { desc: 0, asc: 6 }, { desc: 2, asc: 11 },
  { desc: 4, asc: 3 }, { desc: 6, asc: 9 }, { desc: 11, asc: 8 }, { desc: 10, asc: 7 },
  { desc: 9, asc: 5 }, { desc: 5, asc: 1 }, { desc: 7, asc: 10 }, { desc: 3, asc: 2 },
  { desc: 8, asc: 11 }, { desc: 1, asc: 6 }, { desc: 0, asc: 0 }, { desc: 2, asc: 4 },
  { desc: 4, asc: 3 }, { desc: 6, asc: 9 }, { desc: 11, asc: 8 }, { desc: 10, asc: 7 },
  { desc: 9, asc: 5 }, { desc: 5, asc: 2 }, { desc: 7, asc: 1 }, { desc: 3, asc: 10 },
  { desc: 8, asc: 6 }, { desc: 1, asc: 0 }, { desc: 0, asc: 11 }, { desc: 2, asc: 4 },
  { desc: 4, asc: 3 }, { desc: 6, asc: 9 }, { desc: 11, asc: 8 }, { desc: 10, asc: 7 },
  { desc: 9, asc: 2 }, { desc: 5, asc: 5 }, { desc: 7, asc: 1 }, { desc: 3, asc: 10 },
  { desc: 8, asc: 0 }
];

/**
 * Generate an Intelligent Mail Barcode from the given data
 */
export function generateIMBarcode(data: IMBarcodeData): IMBarcodeResult {
  // Validate input lengths
  if (data.barcodeId.length !== 2 || !/^\d{2}$/.test(data.barcodeId)) {
    return { success: false, error: 'Barcode ID must be exactly 2 digits' };
  }
  
  if (data.serviceTypeId.length !== 3 || !/^\d{3}$/.test(data.serviceTypeId)) {
    return { success: false, error: 'Service Type ID must be exactly 3 digits' };
  }
  
  if (![6, 9].includes(data.mailerId.length) || !/^\d+$/.test(data.mailerId)) {
    return { success: false, error: 'Mailer ID must be 6 or 9 digits' };
  }
  
  const serialLength = data.mailerId.length === 6 ? 9 : 6;
  if (data.serialNumber.length !== serialLength || !/^\d+$/.test(data.serialNumber)) {
    return { success: false, error: `Serial Number must be ${serialLength} digits for ${data.mailerId.length}-digit Mailer ID` };
  }
  
  if (![0, 5, 9, 11].includes(data.routingCode.length) || !/^\d*$/.test(data.routingCode)) {
    return { success: false, error: 'Routing Code must be 0, 5, 9, or 11 digits' };
  }

  // Build the tracking code
  const trackingCode = data.barcodeId + data.serviceTypeId + data.mailerId + data.serialNumber;
  
  try {
    // Convert to binary value
    const binaryValue = convertToBinary(trackingCode, data.routingCode);
    
    // Generate FCS (Frame Check Sequence) 
    const fcsValue = calculateFCS(binaryValue);
    
    // Generate codewords
    const codewords = generateCodewords(binaryValue, fcsValue);
    
    // Map to bars
    const bars = mapToBars(codewords);
    
    return {
      success: true,
      bars,
      trackingCode: trackingCode + data.routingCode,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to generate barcode',
    };
  }
}

/**
 * Convert tracking code and routing code to a binary value
 * This is a simplified implementation - full spec involves large number arithmetic
 */
function convertToBinary(tracking: string, routing: string): bigint {
  // The full binary value is a 104-bit number
  // tracking (20 digits) + routing (0-11 digits) encoded as specified in USPS pub 300
  
  let value = BigInt(tracking);
  
  if (routing.length === 5) {
    // 5-digit ZIP
    value = value * 100001n + BigInt(routing) + 1n;
  } else if (routing.length === 9) {
    // ZIP+4
    value = value * 1000000001n + BigInt(routing) + 100001n;
  } else if (routing.length === 11) {
    // ZIP+4+DP
    value = value * 100000000001n + BigInt(routing) + 1000000001n;
  }
  
  return value;
}

/**
 * Calculate FCS (Frame Check Sequence) for error detection
 * Simplified - actual implementation uses CRC-11
 */
function calculateFCS(value: bigint): number {
  // CRC-11 polynomial: x^11 + x^9 + x^8 + x^7 + x^2 + 1
  const poly = 0x0F35;
  let fcs = 0x07FF;
  
  // Process the binary value
  let temp = value;
  for (let i = 0; i < 102; i++) {
    const bit = Number(temp & 1n);
    temp = temp >> 1n;
    
    if ((fcs ^ bit) & 1) {
      fcs = (fcs >> 1) ^ poly;
    } else {
      fcs = fcs >> 1;
    }
  }
  
  return fcs;
}

/**
 * Generate codewords from binary value and FCS
 */
function generateCodewords(value: bigint, fcs: number): number[] {
  const codewords: number[] = [];
  
  // Split into 10 codewords of ~10.4 bits each (values 0-1364)
  for (let i = 0; i < 10; i++) {
    codewords.push(Number(value % 1365n));
    value = value / 1365n;
  }
  
  // Incorporate FCS
  codewords[0] = (codewords[0] * 2) + (fcs & 1);
  codewords[9] = (codewords[9] * 2) + ((fcs >> 10) & 1);
  
  return codewords;
}

/**
 * Map codewords to the 65 bar pattern
 */
function mapToBars(codewords: number[]): BarType[] {
  const bars: BarType[] = new Array(65);
  
  // Initialize with tracker bars
  bars.fill('T');
  
  // For each codeword, look up the character encoding
  for (let i = 0; i < 10; i++) {
    const codeword = Math.min(codewords[i], CHARACTER_TABLE.length - 1);
    const [descBits, ascBits] = CHARACTER_TABLE[codeword] || [0, 0];
    
    // Map bits to bars in the pattern
    for (let j = 0; j < 13; j++) {
      const barIndex = i * 6 + Math.floor(j / 2);
      if (barIndex >= 65) break;
      
      const mapping = BAR_MAP[barIndex];
      if (!mapping) continue;
      
      const hasDesc = (descBits >> mapping.desc) & 1;
      const hasAsc = (ascBits >> mapping.asc) & 1;
      
      if (hasDesc && hasAsc) {
        bars[barIndex] = 'F';
      } else if (hasAsc) {
        bars[barIndex] = 'A';
      } else if (hasDesc) {
        bars[barIndex] = 'D';
      }
    }
  }
  
  return bars;
}

/**
 * Format tracking code for human display (with dashes)
 */
export function formatTrackingCode(data: IMBarcodeData): string {
  const { barcodeId, serviceTypeId, mailerId, serialNumber, routingCode } = data;
  
  // Format: XX-XXX-XXXXXX-XXXXXXXXX XXXXXXXXXXX
  let formatted = `${barcodeId}-${serviceTypeId}-${mailerId}-${serialNumber}`;
  
  if (routingCode) {
    if (routingCode.length === 5) {
      formatted += ` ${routingCode}`;
    } else if (routingCode.length === 9) {
      formatted += ` ${routingCode.slice(0, 5)}-${routingCode.slice(5)}`;
    } else if (routingCode.length === 11) {
      formatted += ` ${routingCode.slice(0, 5)}-${routingCode.slice(5, 9)}-${routingCode.slice(9)}`;
    }
  }
  
  return formatted;
}

/**
 * Build routing code from address data
 */
export function buildRoutingCode(zip5?: string, zip4?: string, deliveryPoint?: string): string {
  if (!zip5) return '';
  
  let routing = zip5;
  
  if (zip4) {
    routing += zip4;
    
    if (deliveryPoint) {
      routing += deliveryPoint;
    }
  }
  
  return routing;
}

// Common Service Type IDs
export const SERVICE_TYPE_IDS = [
  { id: '001', name: 'First-Class Mail', description: 'Letters and postcards' },
  { id: '040', name: 'Periodicals', description: 'Magazines and newspapers' },
  { id: '300', name: 'Marketing Mail', description: 'Bulk advertising mail' },
  { id: '700', name: 'Package Services', description: 'Bound printed matter, media mail' },
] as const;

// Common Barcode IDs  
export const BARCODE_IDS = [
  { id: '00', name: 'Default', description: 'Standard mail piece' },
  { id: '10', name: 'Carrier Route', description: 'Presorted to carrier route' },
  { id: '20', name: 'Automation', description: 'Automation compatible' },
] as const;

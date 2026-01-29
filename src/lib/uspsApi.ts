// USPS Web Tools API client for address validation
// Users need to register at: https://www.usps.com/business/web-tools-apis/

import type { AddressData } from '@/types/label';

const USPS_API_URL = 'https://secure.shippingapis.com/ShippingAPI.dll';
const USPS_USER_ID_KEY = 'usps_user_id';
const MAILER_ID_KEY = 'usps_mailer_id';

export function getUspsUserId(): string | null {
  return localStorage.getItem(USPS_USER_ID_KEY);
}

export function setUspsUserId(userId: string): void {
  localStorage.setItem(USPS_USER_ID_KEY, userId);
}

export function removeUspsUserId(): void {
  localStorage.removeItem(USPS_USER_ID_KEY);
}

export function getMailerId(): string | null {
  return localStorage.getItem(MAILER_ID_KEY);
}

export function setMailerId(mailerId: string): void {
  localStorage.setItem(MAILER_ID_KEY, mailerId);
}

export function removeMailerId(): void {
  localStorage.removeItem(MAILER_ID_KEY);
}

export interface USPSValidationResult {
  success: boolean;
  address?: AddressData;
  error?: string;
  returnText?: string; // Footnotes or additional info from USPS
}

/**
 * Validate and standardize a US address using USPS Web Tools API
 * Returns the corrected address with ZIP+4 and delivery point
 */
export async function validateAddress(address: AddressData): Promise<USPSValidationResult> {
  const userId = getUspsUserId();
  
  if (!userId) {
    return {
      success: false,
      error: 'USPS User ID not configured. Please add your USPS Web Tools API User ID in settings.',
    };
  }

  // Build XML request per USPS Address Validation API spec
  // Note: USPS swaps Address1 and Address2 - Address2 is the street address
  const xml = `
    <AddressValidateRequest USERID="${escapeXml(userId)}">
      <Revision>1</Revision>
      <Address ID="0">
        <FirmName>${escapeXml(address.company || '')}</FirmName>
        <Address1>${escapeXml(address.street2 || '')}</Address1>
        <Address2>${escapeXml(address.street1)}</Address2>
        <City>${escapeXml(address.city)}</City>
        <State>${escapeXml(address.state)}</State>
        <Zip5>${escapeXml(address.zip5)}</Zip5>
        <Zip4>${escapeXml(address.zip4 || '')}</Zip4>
      </Address>
    </AddressValidateRequest>
  `.trim();

  try {
    const response = await fetch(`${USPS_API_URL}?API=Verify&XML=${encodeURIComponent(xml)}`);
    
    if (!response.ok) {
      return {
        success: false,
        error: `USPS API request failed: ${response.status} ${response.statusText}`,
      };
    }

    const responseText = await response.text();
    return parseUSPSResponse(responseText, address.name);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to connect to USPS API',
    };
  }
}

function parseUSPSResponse(xml: string, originalName: string): USPSValidationResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  // Check for parsing errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    return {
      success: false,
      error: 'Failed to parse USPS response',
    };
  }

  // Check for API-level error
  const error = doc.querySelector('Error');
  if (error) {
    const errorDescription = error.querySelector('Description')?.textContent || 'Unknown error';
    return {
      success: false,
      error: errorDescription,
    };
  }

  // Check for address-level error
  const addressError = doc.querySelector('Address > Error');
  if (addressError) {
    const errorDescription = addressError.querySelector('Description')?.textContent || 'Address not found';
    return {
      success: false,
      error: errorDescription,
    };
  }

  // Parse successful response
  const addressNode = doc.querySelector('Address');
  if (!addressNode) {
    return {
      success: false,
      error: 'No address in USPS response',
    };
  }

  const getText = (selector: string) => addressNode.querySelector(selector)?.textContent || '';

  // Note: USPS returns Address2 as the street address, Address1 as secondary (apt, suite, etc.)
  const validatedAddress: AddressData = {
    name: originalName, // Preserve original name
    company: getText('FirmName') || undefined,
    street1: getText('Address2'), // Primary street address
    street2: getText('Address1') || undefined, // Secondary address (apt, suite)
    city: getText('City'),
    state: getText('State'),
    zip5: getText('Zip5'),
    zip4: getText('Zip4') || undefined,
    deliveryPoint: getText('DeliveryPoint') || undefined,
    checkDigit: getText('CarrierRoute') || undefined, // CarrierRoute can be useful
  };

  // Get any return text (footnotes, etc.)
  const returnText = getText('ReturnText') || undefined;
  const dpvConfirmation = getText('DPVConfirmation');

  // DPV confirmation codes: Y = confirmed, D = primary confirmed but secondary missing, 
  // S = secondary confirmed but primary missing, N = not confirmed
  let warning: string | undefined;
  if (dpvConfirmation === 'D') {
    warning = 'Address confirmed, but apartment/suite number may be missing or invalid.';
  } else if (dpvConfirmation === 'S') {
    warning = 'Secondary address confirmed, but primary street address may have issues.';
  } else if (dpvConfirmation === 'N') {
    warning = 'Address could not be confirmed as deliverable.';
  }

  return {
    success: true,
    address: validatedAddress,
    returnText: warning || returnText,
  };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format an address for display on a label
 */
export function formatAddressForLabel(address: AddressData): string[] {
  const lines: string[] = [];
  
  if (address.name) {
    lines.push(address.name.toUpperCase());
  }
  
  if (address.company) {
    lines.push(address.company.toUpperCase());
  }
  
  if (address.street1) {
    lines.push(address.street1.toUpperCase());
  }
  
  if (address.street2) {
    lines.push(address.street2.toUpperCase());
  }
  
  // City, State ZIP line
  const zip = address.zip4 ? `${address.zip5}-${address.zip4}` : address.zip5;
  if (address.city && address.state && zip) {
    lines.push(`${address.city.toUpperCase()}, ${address.state.toUpperCase()} ${zip}`);
  }
  
  return lines;
}

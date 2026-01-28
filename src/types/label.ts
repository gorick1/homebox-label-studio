// Label element types
export type LabelElementType = 'text' | 'qrcode' | 'barcode' | 'rectangle' | 'line';

export interface Position {
  x: number; // inches
  y: number; // inches
}

export interface Size {
  width: number; // inches
  height: number; // inches
}

export interface FontSettings {
  family: string;
  size: number; // points
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface BaseLabelElement {
  id: string;
  type: LabelElementType;
  name: string;
  position: Position;
  size: Size;
  locked: boolean;
  visible: boolean;
}

export interface TextElement extends BaseLabelElement {
  type: 'text';
  content: string;
  font: FontSettings;
  color: Color;
}

export interface QRCodeElement extends BaseLabelElement {
  type: 'qrcode';
  data: string; // URL or text, supports {placeholders}
}

export interface BarcodeElement extends BaseLabelElement {
  type: 'barcode';
  data: string;
  format: 'code128' | 'code39' | 'ean13';
  showText: boolean;
}

export interface RectangleElement extends BaseLabelElement {
  type: 'rectangle';
  strokeColor: Color;
  fillColor: Color | null;
  strokeWidth: number;
}

export interface LineElement extends BaseLabelElement {
  type: 'line';
  strokeColor: Color;
  strokeWidth: number;
}

export type LabelElement = TextElement | QRCodeElement | BarcodeElement | RectangleElement | LineElement;

export interface LabelSize {
  id: string;
  name: string;
  width: number; // inches
  height: number; // inches
}

export interface Label {
  id: string;
  name: string;
  size: LabelSize;
  elements: LabelElement[];
  createdAt: string;
  updatedAt: string;
}

export interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  label: Label;
  usageType: 'item' | 'container' | 'both'; // What this template is used for
  isDefaultForItems: boolean; // Default template for items
  isDefaultForContainers: boolean; // Default template for containers
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// Available placeholders for dynamic data
export const PLACEHOLDERS = [
  { key: '{item_name}', label: 'Item Name', description: 'Name of the item' },
  { key: '{location}', label: 'Location', description: 'Location/shelf path' },
  { key: '{quantity}', label: 'Quantity', description: 'Stock count' },
  { key: '{item_id}', label: 'Item ID', description: 'UUID of the item' },
  { key: '{asset_id}', label: 'Asset ID', description: 'Asset identifier' },
  { key: '{description}', label: 'Description', description: 'Item description' },
  { key: '{notes}', label: 'Notes', description: 'Item notes' },
] as const;

// Default label sizes
export const LABEL_SIZES: LabelSize[] = [
  { id: 'dymo-30334', name: 'DYMO 30334', width: 2.25, height: 1.25 },
  { id: 'dymo-30252', name: 'DYMO 30252', width: 3.5, height: 1.125 },
  { id: 'dymo-30336', name: 'DYMO 30336', width: 2.125, height: 1 },
  { id: 'dymo-30327', name: 'DYMO 30327', width: 3.5, height: 0.875 },
  { id: 'custom', name: 'Custom', width: 2, height: 1 },
];

// Default fonts available
export const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
] as const;

// Homebox item data for preview
export interface HomeboxItem {
  id: string;
  name: string;
  description: string;
  location: {
    id: string;
    name: string;
    path: string;
  };
  quantity: number;
  assetId: string;
  notes: string;
  customFields: Record<string, string>;
}

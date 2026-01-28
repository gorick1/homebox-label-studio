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
  partNumber: string;
  width: number; // inches
  height: number; // inches
  category: string;
  description: string;
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

// Label size categories
export const LABEL_CATEGORIES = [
  'Multi-Purpose',
  'Address',
  'Shipping',
  'Return Address',
  'File Folder',
  'Name Badge',
  'Postage',
  'Disk',
  'Diskette',
  'Jewelry',
  'VHS',
  'Suspension File',
  'Library',
  'Hanging Folder',
  'Appointment Card',
  'Custom',
] as const;

// Comprehensive DYMO LabelWriter label sizes
export const LABEL_SIZES: LabelSize[] = [
  // Multi-Purpose Labels
  { id: 'dymo-30332', partNumber: '30332', name: 'DYMO 30332', width: 1, height: 1, category: 'Multi-Purpose', description: '1" × 1" Square' },
  { id: 'dymo-30333', partNumber: '30333', name: 'DYMO 30333', width: 1, height: 0.5, category: 'Multi-Purpose', description: '1" × ½" Extra Small' },
  { id: 'dymo-30334', partNumber: '30334', name: 'DYMO 30334', width: 2.25, height: 1.25, category: 'Multi-Purpose', description: '2¼" × 1¼" Medium' },
  { id: 'dymo-30335', partNumber: '30335', name: 'DYMO 30335', width: 2.25, height: 1.25, category: 'Multi-Purpose', description: '2¼" × 1¼" Medium (Cont.)' },
  { id: 'dymo-30336', partNumber: '30336', name: 'DYMO 30336', width: 2.125, height: 1, category: 'Multi-Purpose', description: '2⅛" × 1" Small' },
  { id: 'dymo-30337', partNumber: '30337', name: 'DYMO 30337', width: 1, height: 0.5, category: 'Multi-Purpose', description: '1" × ½" Audio Cassette' },
  { id: 'dymo-30339', partNumber: '30339', name: 'DYMO 30339', width: 2.125, height: 1, category: 'Multi-Purpose', description: '2⅛" × 1" (Cont. Roll)' },
  { id: 'dymo-30380', partNumber: '30380', name: 'DYMO 30380', width: 2.25, height: 1.25, category: 'Multi-Purpose', description: '2¼" × 1¼" Large' },
  { id: 'dymo-30383', partNumber: '30383', name: 'DYMO 30383', width: 3, height: 1, category: 'Multi-Purpose', description: '3" × 1" PC Postage 3-Part' },
  
  // Address Labels
  { id: 'dymo-30251', partNumber: '30251', name: 'DYMO 30251', width: 3.5, height: 1.125, category: 'Address', description: '3½" × 1⅛" Standard Address' },
  { id: 'dymo-30252', partNumber: '30252', name: 'DYMO 30252', width: 3.5, height: 1.125, category: 'Address', description: '3½" × 1⅛" 2-Up Address' },
  { id: 'dymo-30253', partNumber: '30253', name: 'DYMO 30253', width: 3.5, height: 1.125, category: 'Address', description: '3½" × 1⅛" 2-Up (Cont.)' },
  { id: 'dymo-30254', partNumber: '30254', name: 'DYMO 30254', width: 3.5, height: 1.125, category: 'Address', description: '3½" × 1⅛" Clear Address' },
  { id: 'dymo-30270', partNumber: '30270', name: 'DYMO 30270', width: 3.5, height: 1.125, category: 'Address', description: '3½" × 1⅛" White Plastic' },
  { id: 'dymo-30271', partNumber: '30271', name: 'DYMO 30271', width: 3.5, height: 1.125, category: 'Address', description: '3½" × 1⅛" 2-Up Plastic' },
  { id: 'dymo-30320', partNumber: '30320', name: 'DYMO 30320', width: 3.5, height: 1, category: 'Address', description: '3½" × 1" Address Labels' },
  { id: 'dymo-30321', partNumber: '30321', name: 'DYMO 30321', width: 3.5, height: 1.4, category: 'Address', description: '3½" × 1⅖" Large Address' },
  
  // Shipping Labels
  { id: 'dymo-30256', partNumber: '30256', name: 'DYMO 30256', width: 4, height: 2.3125, category: 'Shipping', description: '4" × 2⁵⁄₁₆" Large Shipping' },
  { id: 'dymo-30269', partNumber: '30269', name: 'DYMO 30269', width: 4, height: 2.3125, category: 'Shipping', description: '4" × 2⁵⁄₁₆" Clear Shipping' },
  { id: 'dymo-30323', partNumber: '30323', name: 'DYMO 30323', width: 4, height: 2.125, category: 'Shipping', description: '4" × 2⅛" Shipping Labels' },
  
  // Return Address Labels
  { id: 'dymo-30330', partNumber: '30330', name: 'DYMO 30330', width: 2, height: 0.75, category: 'Return Address', description: '2" × ¾" Return Address' },
  
  // File Folder Labels
  { id: 'dymo-30277', partNumber: '30277', name: 'DYMO 30277', width: 3.4375, height: 0.5625, category: 'File Folder', description: '3⁷⁄₁₆" × ⁹⁄₁₆" Assorted' },
  { id: 'dymo-30327', partNumber: '30327', name: 'DYMO 30327', width: 3.5, height: 0.5625, category: 'File Folder', description: '3½" × ⁹⁄₁₆" File Folder' },
  { id: 'dymo-30377', partNumber: '30377', name: 'DYMO 30377', width: 3.4375, height: 0.5625, category: 'File Folder', description: '3⁷⁄₁₆" × ⁹⁄₁₆" White' },
  
  // Name Badge Labels
  { id: 'dymo-30341', partNumber: '30341', name: 'DYMO 30341', width: 4, height: 2.25, category: 'Name Badge', description: '4" × 2¼" Name Badge' },
  { id: 'dymo-30343', partNumber: '30343', name: 'DYMO 30343', width: 4.125, height: 2.25, category: 'Name Badge', description: '4⅛" × 2¼" Badge (Clip)' },
  { id: 'dymo-30347', partNumber: '30347', name: 'DYMO 30347', width: 4.125, height: 2.25, category: 'Name Badge', description: '4⅛" × 2¼" White Badge' },
  { id: 'dymo-30348', partNumber: '30348', name: 'DYMO 30348', width: 4.125, height: 2.25, category: 'Name Badge', description: '4⅛" × 2¼" Red Badge' },
  { id: 'dymo-30364', partNumber: '30364', name: 'DYMO 30364', width: 4, height: 2.25, category: 'Name Badge', description: '4" × 2¼" Badge w/Clip' },
  
  // Postage Labels
  { id: 'dymo-30370', partNumber: '30370', name: 'DYMO 30370', width: 1.25, height: 1.75, category: 'Postage', description: '1¼" × 1¾" Postage Stamp' },
  { id: 'dymo-30373', partNumber: '30373', name: 'DYMO 30373', width: 10.5, height: 2.3125, category: 'Postage', description: '10½" × 2⁵⁄₁₆" Internet (2-Part)' },
  { id: 'dymo-30384', partNumber: '30384', name: 'DYMO 30384', width: 7.5, height: 2.3125, category: 'Postage', description: '7½" × 2⁵⁄₁₆" 3-Part Internet' },
  { id: 'dymo-30387', partNumber: '30387', name: 'DYMO 30387', width: 7, height: 2.3125, category: 'Postage', description: '7" × 2⁵⁄₁₆" Internet Postage' },
  
  // Disk Labels
  { id: 'dymo-30258', partNumber: '30258', name: 'DYMO 30258', width: 2.25, height: 2.25, category: 'Disk', description: '2¼" dia CD/DVD' },
  { id: 'dymo-30324', partNumber: '30324', name: 'DYMO 30324', width: 2.25, height: 2.25, category: 'Disk', description: '2¼" dia CD/DVD Labels' },
  
  // Diskette Labels
  { id: 'dymo-30378', partNumber: '30378', name: 'DYMO 30378', width: 2.75, height: 2, category: 'Diskette', description: '2¾" × 2" 3.5" Diskette' },
  { id: 'dymo-30379', partNumber: '30379', name: 'DYMO 30379', width: 2.75, height: 2.125, category: 'Diskette', description: '2¾" × 2⅛" 5.25" Diskette' },
  
  // Jewelry / Price Tag Labels
  { id: 'dymo-30299', partNumber: '30299', name: 'DYMO 30299', width: 2.125, height: 0.4375, category: 'Jewelry', description: '2⅛" × ⁷⁄₁₆" Price Tag/Jewelry' },
  
  // VHS Labels
  { id: 'dymo-30326', partNumber: '30326', name: 'DYMO 30326', width: 5.875, height: 1.1875, category: 'VHS', description: '5⅞" × 1³⁄₁₆" VHS Spine' },
  
  // Suspension/Hanging File Labels
  { id: 'dymo-30345', partNumber: '30345', name: 'DYMO 30345', width: 2, height: 0.5625, category: 'Suspension File', description: '2" × ⁹⁄₁₆" Hanging File' },
  { id: 'dymo-30376', partNumber: '30376', name: 'DYMO 30376', width: 2, height: 0.5625, category: 'Hanging Folder', description: '2" × ⁹⁄₁₆" Tab Insert' },
  
  // Library Labels
  { id: 'dymo-30346', partNumber: '30346', name: 'DYMO 30346', width: 1.875, height: 0.5, category: 'Library', description: '1⅞" × ½" Book Spine' },
  
  // Appointment Card Labels
  { id: 'dymo-30374', partNumber: '30374', name: 'DYMO 30374', width: 3.5, height: 2, category: 'Appointment Card', description: '3½" × 2" Appointment Card' },
  
  // Custom (always last)
  { id: 'custom', partNumber: 'Custom', name: 'Custom Size', width: 2, height: 1, category: 'Custom', description: 'Define your own dimensions' },
];

// Helper to get label by ID
export function getLabelSizeById(id: string): LabelSize | undefined {
  return LABEL_SIZES.find(size => size.id === id);
}

// Helper to get labels by category
export function getLabelsByCategory(category: string): LabelSize[] {
  return LABEL_SIZES.filter(size => size.category === category);
}

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

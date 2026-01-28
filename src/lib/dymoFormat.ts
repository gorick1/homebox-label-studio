import type { Label, LabelElement, TextElement, QRCodeElement, BarcodeElement, Color } from '@/types/label';

// Twips conversion: 1 inch = 1440 twips
const TWIPS_PER_INCH = 1440;

export function inchesToTwips(inches: number): number {
  return Math.round(inches * TWIPS_PER_INCH);
}

export function twipsToInches(twips: number): number {
  return twips / TWIPS_PER_INCH;
}

export function pointsToTwips(points: number): number {
  // 1 point = 20 twips
  return Math.round(points * 20);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colorToXml(color: Color): string {
  return `<ForeColor Alpha="${color.a}" Red="${color.r}" Green="${color.g}" Blue="${color.b}"/>`;
}

function textElementToXml(element: TextElement): string {
  const x = inchesToTwips(element.position.x);
  const y = inchesToTwips(element.position.y);
  const width = inchesToTwips(element.size.width);
  const height = inchesToTwips(element.size.height);

  return `
    <TextObject name="${escapeXml(element.name)}" x="${x}" y="${y}" width="${width}" height="${height}">
      ${colorToXml(element.color)}
      <Font name="${escapeXml(element.font.family)}" size="${element.font.size}" bold="${element.font.bold}" italic="${element.font.italic}" underline="${element.font.underline}"/>
      <String>${escapeXml(element.content)}</String>
    </TextObject>`;
}

function qrCodeElementToXml(element: QRCodeElement): string {
  const x = inchesToTwips(element.position.x);
  const y = inchesToTwips(element.position.y);
  const width = inchesToTwips(element.size.width);
  const height = inchesToTwips(element.size.height);

  return `
    <QRCodeObject name="${escapeXml(element.name)}" x="${x}" y="${y}" width="${width}" height="${height}">
      <String>${escapeXml(element.data)}</String>
    </QRCodeObject>`;
}

const BARCODE_FORMAT_MAP: Record<BarcodeElement['format'], string> = {
  code128: 'Code128Auto',
  code39: 'Code39',
  ean13: 'Ean13',
};

function barcodeElementToXml(element: BarcodeElement): string {
  const x = inchesToTwips(element.position.x);
  const y = inchesToTwips(element.position.y);
  const width = inchesToTwips(element.size.width);
  const height = inchesToTwips(element.size.height);
  const format = BARCODE_FORMAT_MAP[element.format] || 'Code128Auto';

  return `
    <BarcodeObject name="${escapeXml(element.name)}" x="${x}" y="${y}" width="${width}" height="${height}">
      <Format>${format}</Format>
      <String>${escapeXml(element.data)}</String>
      <ShowText>${element.showText}</ShowText>
    </BarcodeObject>`;
}

function elementToXml(element: LabelElement): string {
  switch (element.type) {
    case 'text':
      return textElementToXml(element);
    case 'qrcode':
      return qrCodeElementToXml(element);
    case 'barcode':
      return barcodeElementToXml(element);
    case 'rectangle':
    case 'line':
      // Shapes are for visual design, not typically exported to DYMO
      return '';
    default:
      return '';
  }
}

export function labelToXml(label: Label): string {
  const paperWidth = inchesToTwips(label.size.width);
  const paperHeight = inchesToTwips(label.size.height);

  const elementsXml = label.elements
    .filter(el => el.visible)
    .map(elementToXml)
    .filter(xml => xml.trim().length > 0)
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<Doc>
  <Paper width="${paperWidth}" height="${paperHeight}">
${elementsXml}
  </Paper>
</Doc>`;
}

export function downloadLabelFile(label: Label, filename?: string): void {
  const xml = labelToXml(label);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${label.name.replace(/\s+/g, '_')}_${Date.now()}.lbl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Substitute placeholders with actual item data
export function substitutePlaceholders(
  content: string,
  itemData: Record<string, string>
): string {
  let result = content;
  for (const [key, value] of Object.entries(itemData)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  return result;
}

// Check if content contains any placeholders
export function containsPlaceholders(content: string): boolean {
  return /\{[a-z_]+\}/i.test(content);
}

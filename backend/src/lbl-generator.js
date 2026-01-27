import { Builder } from 'xml2js';

/**
 * Generate DYMO .lbl XML file from label data
 * @param {Object} label - Label object with elements
 * @returns {string} XML string for .lbl file
 */
export function generateLblXml(label) {
  const builder = new Builder({
    xmldec: { version: '1.0', encoding: 'utf-8' },
    renderOpts: { pretty: true, indent: '  ' }
  });

  // DYMO label XML structure
  const lblData = {
    DieCutLabel: {
      $: {
        Version: '8.0',
        Units: 'twips' // DYMO uses twips (1/1440 inch)
      },
      PaperOrientation: 'Landscape',
      Id: label.id || 'Label',
      PaperName: label.size?.id || 'Custom',
      DrawCommands: {
        RoundRectangle: [],
        Line: [],
        Text: [],
        Barcode: [],
        Image: []
      },
      ObjectInfo: label.elements.map(element => convertElementToObjectInfo(element, label.size))
    }
  };

  return builder.buildObject(lblData);
}

/**
 * Convert inches to twips (1/1440 inch)
 */
function inchesToTwips(inches) {
  return Math.round(inches * 1440);
}

/**
 * Convert label element to DYMO ObjectInfo
 */
function convertElementToObjectInfo(element, labelSize) {
  const baseInfo = {
    $: {
      ObjectType: getObjectType(element.type),
      Name: element.name || element.id
    },
    Bounds: {
      $: {
        X: inchesToTwips(element.position.x),
        Y: inchesToTwips(element.position.y),
        Width: inchesToTwips(element.size.width),
        Height: inchesToTwips(element.size.height)
      }
    },
    Locked: element.locked ? 'True' : 'False',
    IsOutlined: 'False',
    BorderStyle: 'SolidLine',
    Visible: element.visible ? 'True' : 'False'
  };

  // Add type-specific properties
  switch (element.type) {
    case 'text':
      return {
        ...baseInfo,
        TextObject: {
          Name: element.name,
          ForeColor: colorToRgba(element.color),
          BackColor: 'Transparent',
          Font: {
            Family: element.font.family,
            Size: element.font.size,
            Bold: element.font.bold ? 'True' : 'False',
            Italic: element.font.italic ? 'True' : 'False',
            Underline: element.font.underline ? 'True' : 'False'
          },
          HorizontalAlignment: 'Left',
          VerticalAlignment: 'Middle',
          String: element.content
        }
      };

    case 'barcode':
      return {
        ...baseInfo,
        BarcodeObject: {
          Name: element.name,
          Symbology: getBarcodeSymbology(element.format),
          ShowText: element.showText ? 'True' : 'False',
          Data: element.data
        }
      };

    case 'qrcode':
      return {
        ...baseInfo,
        BarcodeObject: {
          Name: element.name,
          Symbology: 'QRCode',
          ShowText: 'False',
          Data: element.data
        }
      };

    case 'rectangle':
      return {
        ...baseInfo,
        ShapeObject: {
          Name: element.name,
          ShapeType: 'Rectangle',
          LineColor: colorToRgba(element.strokeColor),
          LineWidth: element.strokeWidth || 1,
          FillColor: element.fillColor ? colorToRgba(element.fillColor) : 'Transparent'
        }
      };

    case 'line':
      return {
        ...baseInfo,
        ShapeObject: {
          Name: element.name,
          ShapeType: 'HorizontalLine',
          LineColor: colorToRgba(element.strokeColor),
          LineWidth: element.strokeWidth || 1
        }
      };

    default:
      return baseInfo;
  }
}

/**
 * Get DYMO object type
 */
function getObjectType(elementType) {
  const typeMap = {
    text: 'TextObject',
    barcode: 'BarcodeObject',
    qrcode: 'BarcodeObject',
    rectangle: 'ShapeObject',
    line: 'ShapeObject'
  };
  return typeMap[elementType] || 'TextObject';
}

/**
 * Get DYMO barcode symbology
 */
function getBarcodeSymbology(format) {
  const symbologyMap = {
    code128: 'Code128Auto',
    code39: 'Code39',
    ean13: 'Ean13'
  };
  return symbologyMap[format] || 'Code128Auto';
}

/**
 * Convert color object to RGBA string
 */
function colorToRgba(color) {
  if (!color) return 'Transparent';
  return `Alpha:${Math.round(color.a * 255)}, Red:${color.r}, Green:${color.g}, Blue:${color.b}`;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace placeholders in text with actual item data
 * Only replaces known placeholders in curly braces
 */
export function replacePlaceholders(text, itemData) {
  if (!text || !itemData) return text;
  
  // Define valid placeholders with their corresponding values
  const placeholders = {
    '{item_name}': itemData.name || '',
    '{location}': itemData.location?.path || itemData.location?.name || '',
    '{quantity}': itemData.quantity?.toString() || '0',
    '{item_id}': itemData.id || '',
    '{asset_id}': itemData.assetId || '',
    '{description}': itemData.description || '',
    '{notes}': itemData.notes || ''
  };

  let result = text;
  
  // Only replace exact placeholder matches to avoid unintended replacements
  for (const [placeholder, value] of Object.entries(placeholders)) {
    // Properly escape all special regex characters
    const regex = new RegExp(escapeRegex(placeholder), 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}

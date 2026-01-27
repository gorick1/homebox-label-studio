import fetch from 'node-fetch';
import { generateLblXml, replacePlaceholders } from './lbl-generator.js';

const HOMEBOX_API_URL = process.env.HOMEBOX_API_URL || 'http://homebox:7745';
const PRINT_PROXY_URL = process.env.PRINT_PROXY_URL || 'http://print-proxy:5000';
const AUTO_PRINT = process.env.AUTO_PRINT_ON_CREATE === 'true';
const DEFAULT_TEMPLATE_ID = process.env.DEFAULT_TEMPLATE_ID;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * Handle webhook from Homebox when an item is created
 * @param {Object} payload - Webhook payload
 * @param {Object} db - Database instance
 */
export async function handleWebhook(payload, db) {
  console.log('Webhook received:', JSON.stringify(payload, null, 2));

  // Validate webhook secret if configured
  if (WEBHOOK_SECRET && payload.secret !== WEBHOOK_SECRET) {
    throw new Error('Invalid webhook secret');
  }

  // Extract item data from payload
  const itemId = payload.item?.id || payload.itemId || payload.id;
  if (!itemId) {
    throw new Error('No item ID in webhook payload');
  }

  // Get item details from Homebox
  let itemData;
  try {
    itemData = await fetchHomeboxItem(itemId);
  } catch (error) {
    console.error('Failed to fetch item from Homebox:', error);
    throw error;
  }

  // Get template to use
  const templateId = payload.templateId || DEFAULT_TEMPLATE_ID;
  let template;
  
  if (templateId) {
    template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
  } else {
    // Use default template
    template = db.prepare('SELECT * FROM templates WHERE is_default = 1 LIMIT 1').get();
  }

  if (!template) {
    const error = 'No template available for printing';
    logPrintHistory(db, itemId, null, 'failed', error);
    throw new Error(error);
  }

  const label = JSON.parse(template.label_data);

  // Replace placeholders in label elements with actual item data
  const processedLabel = processLabelWithData(label, itemData);

  // Auto-print if enabled
  if (AUTO_PRINT) {
    try {
      const lblXml = generateLblXml(processedLabel);
      await printLabel(lblXml);
      logPrintHistory(db, itemId, template.id, 'success', null);
      console.log(`Auto-printed label for item ${itemId}`);
    } catch (error) {
      logPrintHistory(db, itemId, template.id, 'failed', error.message);
      throw error;
    }
  } else {
    logPrintHistory(db, itemId, template.id, 'skipped', 'Auto-print disabled');
    console.log(`Label prepared for item ${itemId} (auto-print disabled)`);
  }

  return { success: true, itemId, templateId: template.id };
}

/**
 * Fetch item details from Homebox API
 */
async function fetchHomeboxItem(itemId) {
  const token = process.env.HOMEBOX_API_TOKEN;
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${HOMEBOX_API_URL}/api/v1/items/${itemId}`, {
    headers
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch item: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Process label by replacing placeholders with item data
 */
function processLabelWithData(label, itemData) {
  const processedLabel = { ...label };
  
  processedLabel.elements = label.elements.map(element => {
    const processedElement = { ...element };
    
    if (element.type === 'text' && element.content) {
      processedElement.content = replacePlaceholders(element.content, itemData);
    } else if ((element.type === 'barcode' || element.type === 'qrcode') && element.data) {
      processedElement.data = replacePlaceholders(element.data, itemData);
    }
    
    return processedElement;
  });
  
  return processedLabel;
}

/**
 * Send label to print proxy
 */
async function printLabel(lblXml) {
  const response = await fetch(`${PRINT_PROXY_URL}/print`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream'
    },
    body: lblXml
  });

  if (!response.ok) {
    throw new Error(`Failed to print: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Log print history to database
 */
function logPrintHistory(db, itemId, templateId, status, error) {
  const id = `ph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO print_history (id, item_id, template_id, printed_at, status, error)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, itemId, templateId, now, status, error);
}

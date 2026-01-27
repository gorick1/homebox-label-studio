import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { generateLblXml } from './lbl-generator.js';
import { handleWebhook } from './webhook-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3001;
const DB_PATH = process.env.DATABASE_URL || join(__dirname, '../data/templates.db');

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    label_data TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    is_favorite INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS print_history (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    template_id TEXT,
    printed_at TEXT NOT NULL,
    status TEXT NOT NULL,
    error TEXT
  );
`);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Template endpoints
app.get('/templates', (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM templates ORDER BY updated_at DESC').all();
    res.json(templates.map(t => ({
      ...t,
      label: JSON.parse(t.label_data),
      isDefault: !!t.is_default,
      isFavorite: !!t.is_favorite,
    })));
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

app.get('/templates/default', (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM templates WHERE is_default = 1 LIMIT 1').get();
    if (!template) {
      return res.status(404).json({ error: 'No default template found' });
    }
    res.json({
      ...template,
      label: JSON.parse(template.label_data),
      isDefault: true,
      isFavorite: !!template.is_favorite,
    });
  } catch (error) {
    console.error('Error fetching default template:', error);
    res.status(500).json({ error: 'Failed to fetch default template' });
  }
});

app.get('/templates/:id', (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({
      ...template,
      label: JSON.parse(template.label_data),
      isDefault: !!template.is_default,
      isFavorite: !!template.is_favorite,
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

app.post('/templates', (req, res) => {
  try {
    const { name, description, label, isFavorite } = req.body;
    const id = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO templates (id, name, description, label_data, is_favorite, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description || '', JSON.stringify(label), isFavorite ? 1 : 0, now, now);
    
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
    res.json({
      ...template,
      label: JSON.parse(template.label_data),
      isDefault: false,
      isFavorite: !!template.is_favorite,
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

app.put('/templates/:id', (req, res) => {
  try {
    const { name, description, label, isFavorite } = req.body;
    const now = new Date().toISOString();
    
    const result = db.prepare(`
      UPDATE templates 
      SET name = ?, description = ?, label_data = ?, is_favorite = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name,
      description || '',
      label ? JSON.stringify(label) : undefined,
      isFavorite ? 1 : 0,
      now,
      req.params.id
    );
    
    // Check if any rows were updated
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
    
    res.json({
      ...template,
      label: JSON.parse(template.label_data),
      isDefault: !!template.is_default,
      isFavorite: !!template.is_favorite,
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

app.delete('/templates/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

app.post('/templates/:id/set-default', (req, res) => {
  try {
    // Remove default from all templates
    db.prepare('UPDATE templates SET is_default = 0').run();
    // Set this template as default
    db.prepare('UPDATE templates SET is_default = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting default template:', error);
    res.status(500).json({ error: 'Failed to set default template' });
  }
});

// Label generation endpoint
app.post('/download-lbl', (req, res) => {
  try {
    const { label } = req.body;
    const lblXml = generateLblXml(label);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${label.name || 'label'}.lbl"`);
    res.send(lblXml);
  } catch (error) {
    console.error('Error generating LBL file:', error);
    res.status(500).json({ error: 'Failed to generate label file' });
  }
});

// Webhook endpoint for Homebox item creation
app.post('/webhook/item-created', async (req, res) => {
  try {
    await handleWebhook(req.body, db);
    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Print history endpoint
app.get('/print-history', (req, res) => {
  try {
    const history = db.prepare('SELECT * FROM print_history ORDER BY printed_at DESC LIMIT 100').all();
    res.json(history);
  } catch (error) {
    console.error('Error fetching print history:', error);
    res.status(500).json({ error: 'Failed to fetch print history' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Homebox Label Studio Backend running on port ${PORT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing database...');
  db.close();
  process.exit(0);
});

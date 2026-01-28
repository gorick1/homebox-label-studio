import type { LabelTemplate, HomeboxItem, Label } from '@/types/label';

// Configuration - these would be set based on deployment environment
const API_CONFIG = {
  // In production, these would come from environment or settings
  addonBaseUrl: '/api', // Same origin for the addon
  homeboxUrl: '/homebox', // Relative URL - Nginx will proxy this to Homebox
  printProxyUrl: '/print', // Relative URL - Nginx will proxy to print addon
  companionUrl: 'http://homebox-companion:8000', // Internal companion service
};

// Dev mode - allows bypassing auth for testing
const DEV_MODE = true;

// Settings storage
const SETTINGS_STORAGE_KEY = 'editor_settings';

export interface EditorSettings {
  autoprint: boolean;
  snapToGrid: boolean;
  showGrid: boolean;
}

export function getSettings(): EditorSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return {
    autoprint: false,
    snapToGrid: true,
    showGrid: true,
  };
}

export function saveSettings(settings: EditorSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem('hb_token');
}

function getHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['X-Addon-Token'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Authentication
export async function login(email: string, password: string): Promise<{ token: string }> {
  try {
    // Authenticate with Homebox API
    const response = await fetch(`${API_CONFIG.homeboxUrl}/api/v1/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password, stayLoggedIn: true }),
    });
    
    // Handle different response statuses
    if (response.status === 401 || response.status === 500) {
      // Homebox returns 500 for invalid credentials instead of 401
      throw new Error('Invalid username or password. Please check your credentials and try again.');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const token = data.token || data.access_token;
    
    if (!token) {
      throw new Error('No authentication token received. Please ensure your Homebox instance is configured correctly.');
    }
    
    localStorage.setItem('hb_token', token);
    return { token };
  } catch (err) {
    console.error('Login failed:', err);
    throw err;
  }
}

export function logout(): void {
  localStorage.removeItem('hb_token');
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// Template Management
const TEMPLATES_STORAGE_KEY = 'label_templates';

// Helper functions for localStorage persistence
function saveTemplatesToStorage(templates: LabelTemplate[]): void {
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}

function getTemplatesFromStorage(): LabelTemplate[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Failed to load templates from storage:', err);
    return [];
  }
}

export async function getTemplates(): Promise<LabelTemplate[]> {
  // Try to fetch from backend first
  try {
    const response = await fetch(`${API_CONFIG.addonBaseUrl}/templates`, {
      headers: getHeaders(),
    });
    
    if (response.ok) {
      const templates = await response.json();
      // Sync backend templates to localStorage
      saveTemplatesToStorage(templates);
      return templates;
    }
  } catch (err) {
    console.warn('Failed to fetch templates from backend, using localStorage:', err);
  }
  
  // Fallback to localStorage if backend fails
  return getTemplatesFromStorage();
}

export async function getDefaultTemplate(): Promise<LabelTemplate | null> {
  const response = await fetch(`${API_CONFIG.addonBaseUrl}/templates/default`, {
    headers: getHeaders(),
  });
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    throw new Error('Failed to fetch default template');
  }
  
  return response.json();
}

export async function getTemplate(id: string): Promise<LabelTemplate> {
  const response = await fetch(`${API_CONFIG.addonBaseUrl}/templates/${id}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch template');
  }
  
  return response.json();
}

export async function saveTemplate(template: Omit<LabelTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<LabelTemplate> {
  const newTemplate: LabelTemplate = {
    ...template as LabelTemplate,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Try to save to backend
  try {
    const response = await fetch(`${API_CONFIG.addonBaseUrl}/templates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(newTemplate),
    });
    
    if (response.ok) {
      return response.json();
    }
  } catch (err) {
    console.warn('Failed to save template to backend, saving locally:', err);
  }

  // Save to localStorage as fallback
  const existing = getTemplatesFromStorage();
  const updated = [...existing, newTemplate];
  saveTemplatesToStorage(updated);
  
  return newTemplate;
}

export async function updateTemplate(id: string, template: Partial<LabelTemplate>): Promise<LabelTemplate> {
  const response = await fetch(`${API_CONFIG.addonBaseUrl}/templates/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(template),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update template');
  }
  
  return response.json();
}

export async function deleteTemplate(id: string): Promise<void> {
  // Try to delete from backend
  try {
    const response = await fetch(`${API_CONFIG.addonBaseUrl}/templates/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (response.ok) {
      return;
    }
  } catch (err) {
    console.warn('Failed to delete template from backend, removing locally:', err);
  }
  
  // Remove from localStorage as fallback
  const existing = getTemplatesFromStorage();
  const updated = existing.filter(t => t.id !== id);
  saveTemplatesToStorage(updated);
}

// Default template storage (localStorage-based)
const DEFAULT_ITEM_TEMPLATE_KEY = 'default_item_template_id';
const DEFAULT_CONTAINER_TEMPLATE_KEY = 'default_container_template_id';

export async function setDefaultTemplate(id: string, type: 'item' | 'container' = 'item'): Promise<void> {
  // Try to persist to backend first (if implemented)
  try {
    const response = await fetch(`${API_CONFIG.addonBaseUrl}/templates/${id}/set-default`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ type }),
    });
    
    // If backend succeeds, use the response
    if (response.ok) {
      return;
    }
  } catch (err) {
    // Backend not available, will use localStorage
    console.warn('Backend default template endpoint not available, using localStorage');
  }
  
  // Fallback to localStorage if backend doesn't exist
  const key = type === 'container' ? DEFAULT_CONTAINER_TEMPLATE_KEY : DEFAULT_ITEM_TEMPLATE_KEY;
  localStorage.setItem(key, id);
}

export function getDefaultTemplateId(type: 'item' | 'container' = 'item'): string | null {
  const key = type === 'container' ? DEFAULT_CONTAINER_TEMPLATE_KEY : DEFAULT_ITEM_TEMPLATE_KEY;
  return localStorage.getItem(key);
}

export function setDefaultTemplateId(id: string, type: 'item' | 'container' = 'item'): void {
  const key = type === 'container' ? DEFAULT_CONTAINER_TEMPLATE_KEY : DEFAULT_ITEM_TEMPLATE_KEY;
  localStorage.setItem(key, id);
}

// Homebox Integration
export async function searchItems(query: string): Promise<HomeboxItem[]> {
  const response = await fetch(
    `${API_CONFIG.homeboxUrl}/api/v1/items/search?q=${encodeURIComponent(query)}`,
    { headers: getHeaders() }
  );
  
  if (!response.ok) {
    throw new Error('Failed to search items');
  }
  
  return response.json();
}

export async function getItem(id: string): Promise<HomeboxItem> {
  const response = await fetch(
    `${API_CONFIG.homeboxUrl}/api/v1/items/${id}`,
    { headers: getHeaders() }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch item');
  }
  
  return response.json();
}

// Print Proxy Integration
export async function printLabel(imageData: Blob | string): Promise<{ ok: boolean; message: string }> {
  // If it's a Blob (PNG image), send as multipart form
  if (imageData instanceof Blob) {
    const formData = new FormData();
    formData.append('image', imageData, 'label.png');
    
    const response = await fetch(`${API_CONFIG.printProxyUrl}/print/image`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to send label to printer');
    }
    
    return response.json();
  }
  
  // Otherwise it's XML string, send as JSON
  const response = await fetch(`${API_CONFIG.printProxyUrl}/print`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ label: imageData }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send label to printer');
  }
  
  return response.json();
}

// Download .lbl file generation
export async function generateLblFile(label: Label): Promise<Blob> {
  const response = await fetch(`${API_CONFIG.addonBaseUrl}/download-lbl`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ label }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate label file');
  }
  
  return response.blob();
}

// Autoprint Integration
export async function triggerAutoprint(itemId: string, type: 'item' | 'location'): Promise<{ ok: boolean; message?: string }> {
  try {
    const token = getAuthToken();
    if (!token) {
      return { ok: false, message: 'Not authenticated' };
    }

    // Call companion service to handle autoprint
    const response = await fetch(`/api/autoprint/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ itemId, type }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { ok: false, message: error };
    }

    return { ok: true };
  } catch (err) {
    console.error('Autoprint trigger failed:', err);
    return { ok: false, message: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Homebox API Integration
export async function fetchHomeboxItems(): Promise<HomeboxItem[]> {
  try {
    // Fetch from Homebox API with proper authentication
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    // Add authorization token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_CONFIG.homeboxUrl}/api/v1/items`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Homebox API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Map Homebox API response to our HomeboxItem type
    // The API returns items with different field names, so we need to normalize
    return (data.items || data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      location: {
        id: item.location?.id || '',
        name: item.location?.name || 'Unknown',
        path: item.location?.path || item.location?.name || 'Unknown',
      },
      quantity: item.quantity || 1,
      assetId: item.assetId || item.id?.substring(0, 8).toUpperCase(),
      notes: item.notes || '',
      customFields: item.customFields || {},
    })) as HomeboxItem[];
  } catch (err) {
    console.error('Failed to fetch items from Homebox:', err);
    throw err;
  }
}
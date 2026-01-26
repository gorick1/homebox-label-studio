import type { LabelTemplate, HomeboxItem, Label } from '@/types/label';

// Configuration - these would be set based on deployment environment
const API_CONFIG = {
  // In production, these would come from environment or settings
  addonBaseUrl: '/api', // Same origin for the addon
  homeboxUrl: 'https://homebox.garrettorick.com',
  printProxyUrl: 'http://print-proxy:5000',
};

// Dev mode - allows bypassing auth for testing
const DEV_MODE = true;

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
  // Dev mode: accept any credentials
  if (DEV_MODE) {
    const token = 'dev_token_' + Date.now();
    localStorage.setItem('hb_token', token);
    return { token };
  }

  const response = await fetch(`${API_CONFIG.addonBaseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });
  
  if (!response.ok) {
    throw new Error('Authentication failed');
  }
  
  const data = await response.json();
  localStorage.setItem('hb_token', data.token);
  return data;
}

export function logout(): void {
  localStorage.removeItem('hb_token');
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// Template Management
export async function getTemplates(): Promise<LabelTemplate[]> {
  const response = await fetch(`${API_CONFIG.addonBaseUrl}/templates`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch templates');
  }
  
  return response.json();
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
  const response = await fetch(`${API_CONFIG.addonBaseUrl}/templates`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(template),
  });
  
  if (!response.ok) {
    throw new Error('Failed to save template');
  }
  
  return response.json();
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
  const response = await fetch(`${API_CONFIG.addonBaseUrl}/templates/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete template');
  }
}

export async function setDefaultTemplate(id: string): Promise<void> {
  const response = await fetch(`${API_CONFIG.addonBaseUrl}/templates/${id}/set-default`, {
    method: 'POST',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to set default template');
  }
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
export async function printLabel(lblContent: string): Promise<{ ok: boolean; message: string }> {
  const response = await fetch(`${API_CONFIG.printProxyUrl}/print`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    body: lblContent,
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

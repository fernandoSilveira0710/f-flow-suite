/**
 * API Client Mock
 * Preparado para trocar por API externa (2F License Hub) via .env
 */

import { API_URLS } from './env';
const BASE_URL = API_URLS.HUB;
const TENANT_KEY = '2f.tenantId';

export function getTenantId(): string {
  if (typeof window === 'undefined') return 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b';
  return localStorage.getItem(TENANT_KEY) || 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b';
}

export function setTenantId(tenantId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TENANT_KEY, tenantId);
}

interface FetchOptions extends RequestInit {
  body?: any;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const tenantId = getTenantId();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': tenantId,
    ...(options.headers || {}),
  };

  // Se houver token JWT (futuro), adicionar aqui
  // const token = getToken();
  // if (token) headers['Authorization'] = `Bearer ${token}`;

  const config: RequestInit = {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  // Fazer requisição real para o Hub
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      let errorMessage = `Erro HTTP ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.message || errorMessage;
      } catch (_) {
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch {}
      }
      throw new Error(errorMessage);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return data as T;
    }
    const text = await response.text();
    return text as unknown as T;
  } catch (error) {
    console.error('[API Error]', error);
    throw error;
  }
}

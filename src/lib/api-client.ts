/**
 * API Client Mock
 * Preparado para trocar por API externa (2F License Hub) via .env
 */

import { API_URLS } from './env';
const BASE_URL = API_URLS.HUB;
const BASE_URL_LOCAL = API_URLS.CLIENT_LOCAL;
const TENANT_KEY = '2f.tenantId';
const LICENSE_TOKEN_KEY = '2f.license.token';
const LICENSE_TOKEN_TS_KEY = '2f.license.token.ts';
const LICENSE_TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutos

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
  suppressErrorLog?: boolean;
}

async function getLicenseToken(): Promise<string | null> {
  try {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(LICENSE_TOKEN_KEY);
      const tsRaw = localStorage.getItem(LICENSE_TOKEN_TS_KEY);
      const ts = tsRaw ? Number(tsRaw) : 0;
      if (cached && ts && Date.now() - ts < LICENSE_TOKEN_TTL_MS) {
        return cached;
      }
    }

    const tenantId = getTenantId();
    // Buscar token do client-local
    const response = await fetch(`${BASE_URL_LOCAL}/licensing/token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': tenantId,
      },
    });

    if (!response.ok) {
      // Não bloquear; retorna null para permitir fallback/erros de guard mais claros
      return null;
    }

    const data = await response.json();
    const token = data?.token || null;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem(LICENSE_TOKEN_KEY, token);
      localStorage.setItem(LICENSE_TOKEN_TS_KEY, String(Date.now()));
    }
    return token;
  } catch (error) {
    console.warn('[License Token] Falha ao obter token de licença:', error);
    return null;
  }
}

export async function apiClientLocal<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const tenantId = getTenantId();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': tenantId,
    ...(options.headers || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  try {
    const response = await fetch(`${BASE_URL_LOCAL}${endpoint}`, config);

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
    console.error('[API Local Error]', error);
    throw error;
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const tenantId = getTenantId();
  const licenseToken = await getLicenseToken().catch(() => null);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': tenantId,
    ...(options.headers || {}),
  };

  // Enviar cabeçalhos de licença compatíveis com LicenseGuard
  if (licenseToken) {
    (headers as any)['X-License-Token'] = licenseToken;
    (headers as any)['Authorization'] = `Bearer ${licenseToken}`;
  }

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
      // Mensagem mais amigável para erro de licença
      if (response.status === 403) {
        errorMessage = 'Missing or invalid license token';
      }
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
    if (!options.suppressErrorLog) {
      console.error('[API Error]', error);
    } else {
      // Em cenários com fallback (ex.: Hub offline), evitar ruído nos logs
      console.warn('[API Warning suppressed]', (error as any)?.message || error);
    }
    throw error;
  }
}

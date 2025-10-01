/**
 * API Client Mock
 * Preparado para trocar por API externa (2F License Hub) via .env
 */

const BASE_URL = import.meta.env.VITE_LICENSE_HUB_URL || '';
const TENANT_KEY = '2f.tenantId';

export function getTenantId(): string {
  if (typeof window === 'undefined') return 'demo-tenant';
  return localStorage.getItem(TENANT_KEY) || 'demo-tenant';
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

  // Por enquanto, não faz fetch real, retorna mock
  // Quando tiver backend: const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  console.log('[API Mock]', options.method || 'GET', endpoint, options.body);
  
  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Retornar mock vazio por enquanto
  return {} as T;
}

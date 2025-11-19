import { API_URLS } from './env';
import { getTenantId, apiClientLocal } from './api-client';

// Tipos alinhados com o DTO/resposta do client-local
export interface CreateProductPayload {
  name: string;
  description?: string;
  imageUrl?: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost?: number;
  category?: string;
  unit?: string;
  minStock?: number;
  maxStock?: number;
  trackStock?: boolean;
  active?: boolean;
  marginPct?: number;
  expiryDate?: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost?: number;
  category?: string;
  unit?: string;
  minStock?: number;
  maxStock?: number;
  trackStock: boolean;
  active: boolean;
  currentStock: number;
  createdAt: string;
  updatedAt: string;
  marginPct?: number;
  expiryDate?: string;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export class ApiError extends Error {
  status: number;
  body?: any;
  constructor(message: string, status: number, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

function buildFriendlyMessage(status: number, body: any, statusText: string): string {
  const rawMessage = typeof body === 'string' ? body : (body?.message || body?.error || statusText);

  // Mensagens amigáveis por status
  if (status === 409) {
    const msg: string = (typeof body === 'object' ? body?.message : rawMessage) || '';
    const match = /duplicado em:\s*([a-zA-Z_]+)/i.exec(msg);
    const campo = match?.[1]?.toLowerCase();
    if (campo === 'barcode') {
      return 'Já existe um produto com este código de barras. Altere o código e tente novamente.';
    }
    if (campo === 'sku') {
      return 'Já existe um produto com este SKU. Altere o SKU e tente novamente.';
    }
    return 'Já existe um produto com valor duplicado. Verifique os campos únicos e tente novamente.';
  }
  if (status === 400 || status === 422) {
    return rawMessage || 'Dados inválidos. Verifique os campos informados e tente novamente.';
  }
  if (status === 404) {
    return 'Registro não encontrado.';
  }
  if (status >= 500) {
    return 'Erro interno no serviço Client Local. Tente novamente mais tarde.';
  }
  return rawMessage || `Erro ${status} ${statusText}`;
}

const API_BASE_URL = API_URLS.CLIENT_LOCAL;

const apiCall = async <T>(
  endpoint: string,
  options?: RequestInit,
  timeoutMs: number = 20000,
): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    // Monta headers evitando Content-Type quando não há corpo, reduzindo preflight
    const hasBody = options && 'body' in options && options.body !== undefined && options.body !== null;
    const headers: HeadersInit = {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      'X-Tenant-Id': getTenantId?.() || 'cf0fee8c-5cb6-493b-8f02-d4fc045b114b',
      ...options?.headers,
    };

    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ApiError('Tempo limite excedido ao chamar a API. Verifique o serviço Client Local (porta 8081).', 0);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    // Tenta ler e interpretar o corpo para mensagem amigável
    let bodyText = '';
    let parsedBody: any = undefined;
    try {
      bodyText = await response.text();
    } catch {}
    if (bodyText) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        parsedBody = bodyText;
      }
    }
    const friendly = buildFriendlyMessage(response.status, parsedBody ?? bodyText, response.statusText);
    throw new ApiError(friendly, response.status, parsedBody ?? bodyText);
  }

  // DELETE e outros podem responder 204/205 (sem corpo)
  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (isJson) {
    // Evita SyntaxError em corpo vazio retornando undefined
    const text = await response.text();
    return (text ? (JSON.parse(text) as T) : (undefined as T));
  }

  // Fallback para texto caso não seja JSON
  const text = await response.text();
  return text as unknown as T;
};

// Normaliza campos numéricos que podem vir como string do backend (ex.: Decimal)
const normalizeProduct = (raw: any): ProductResponse => {
  return {
    id: String(raw.id),
    name: raw.name,
    description: raw.description ?? undefined,
    imageUrl: raw.imageUrl ?? undefined,
    sku: raw.sku ?? undefined,
    barcode: raw.barcode ?? undefined,
    price: typeof raw.price === 'number' ? raw.price : Number(raw.price),
    cost:
      raw.cost !== undefined && raw.cost !== null
        ? typeof raw.cost === 'number'
          ? raw.cost
          : Number(raw.cost)
        : undefined,
    category: raw.category ?? undefined,
    unit: raw.unit ?? undefined,
    minStock:
      raw.minStock !== undefined && raw.minStock !== null
        ? Number(raw.minStock)
        : undefined,
    maxStock:
      raw.maxStock !== undefined && raw.maxStock !== null
        ? Number(raw.maxStock)
        : undefined,
    trackStock: Boolean(raw.trackStock),
    active: Boolean(raw.active),
    currentStock:
      typeof raw.currentStock === 'number'
        ? raw.currentStock
        : Number(raw.currentStock ?? 0),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    marginPct:
      raw.marginPct !== undefined && raw.marginPct !== null
        ? Number(raw.marginPct)
        : undefined,
    expiryDate: raw.expiryDate ? String(raw.expiryDate) : undefined,
  };
};

export const createProduct = async (
  payload: CreateProductPayload,
): Promise<ProductResponse> => {
  return apiCall<ProductResponse>('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then(normalizeProduct);
};

export const getProducts = async (): Promise<ProductResponse[]> => {
  return apiCall<ProductResponse[]>('/products').then((list) =>
    Array.isArray(list) ? list.map(normalizeProduct) : [],
  );
};

export const getProductById = async (id: string): Promise<ProductResponse> => {
  return apiCall<ProductResponse>(`/products/${id}`).then(normalizeProduct);
};

export const updateProduct = async (
  id: string,
  payload: UpdateProductPayload,
): Promise<ProductResponse> => {
  return apiCall<ProductResponse>(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then(normalizeProduct);
};

export const deleteProduct = async (id: string, options?: { hard?: boolean }): Promise<void> => {
  const query = options?.hard ? '?hard=true' : '';
  await apiClientLocal<void>(`/products/${id}${query}`, { method: 'DELETE' });
};

export const getProductDependencies = async (id: string): Promise<{
  blocking: { saleItems: number; stockMovements: number; inventoryAdjustments: number };
  nonBlocking: { groomingItems: number };
  canHardDelete: boolean;
}> => {
  return apiClientLocal(`/products/${id}/dependencies`, { method: 'GET' });
};
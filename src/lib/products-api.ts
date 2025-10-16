import { API_URLS } from './env';

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
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

const API_BASE_URL = API_URLS.CLIENT_LOCAL;

const apiCall = async <T>(
  endpoint: string,
  options?: RequestInit,
  timeoutMs: number = 10000,
): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Tempo limite excedido ao chamar a API. Verifique o serviço Client Local (porta 8081).');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    // Tenta incluir mensagem do corpo em erros para facilitar debug
    let errBody = '';
    try {
      errBody = await response.text();
    } catch {}
    throw new Error(`API Error: ${response.status} ${response.statusText}${errBody ? ` - ${errBody}` : ''}`);
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

export const deleteProduct = async (id: string): Promise<void> => {
  await apiCall<void>(`/products/${id}`, {
    method: 'DELETE',
  });
};
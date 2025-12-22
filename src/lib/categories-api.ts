import { API_URLS } from './env';

export interface Category {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  active?: boolean; // default true
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

const API_BASE_URL = API_URLS.CLIENT_LOCAL;

function toFriendlyNetworkError(err: unknown): Error | null {
  const msg = String((err as any)?.message || '');
  if ((err as any) instanceof TypeError || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
    return new Error('Não foi possível conectar ao Client Local (porta 8081). Verifique se o serviço está rodando.');
  }
  return null;
}

async function toHttpError(res: Response, prefix: string): Promise<Error> {
  let bodyText = '';
  let parsed: any = undefined;
  try {
    bodyText = await res.text();
  } catch (e) {
    void e;
  }
  if (bodyText) {
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      parsed = bodyText;
    }
  }
  const message = `${prefix}: ${res.status} ${res.statusText}${bodyText ? ` - ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}` : ''}`;
  const err: any = new Error(message);
  err.status = res.status;
  err.body = parsed ?? bodyText;
  return err as Error;
}

export async function fetchCategories(params?: { active?: 'all' | 'true' | 'false' }): Promise<Category[]> {
  const query = new URLSearchParams();
  if (params?.active === 'true' || params?.active === 'false') {
    query.append('active', params.active);
  } else if (params?.active === 'all') {
    // no query param -> retorna todas
  } else {
    // compat: antes retornava apenas ativas
    query.append('active', 'true');
  }
  const q = query.toString();
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/categories${q ? `?${q}` : ''}`);
  } catch (e) {
    const friendly = toFriendlyNetworkError(e);
    throw friendly || e;
  }
  if (!res.ok) throw await toHttpError(res, 'Erro ao listar categorias');
  return res.json();
}

export async function fetchCategory(id: string): Promise<Category> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/categories/${id}`);
  } catch (e) {
    const friendly = toFriendlyNetworkError(e);
    throw friendly || e;
  }
  if (!res.ok) throw await toHttpError(res, 'Erro ao obter categoria');
  return res.json();
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const friendly = toFriendlyNetworkError(e);
    throw friendly || e;
  }
  if (!res.ok) throw await toHttpError(res, 'Erro ao criar categoria');
  return res.json();
}

export async function updateCategory(id: string, payload: UpdateCategoryPayload): Promise<Category> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const friendly = toFriendlyNetworkError(e);
    throw friendly || e;
  }
  if (!res.ok) throw await toHttpError(res, 'Erro ao atualizar categoria');
  return res.json();
}

export async function deleteCategory(id: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE' });
  } catch (e) {
    const friendly = toFriendlyNetworkError(e);
    throw friendly || e;
  }
  if (!res.ok) throw await toHttpError(res, 'Erro ao deletar categoria');
}

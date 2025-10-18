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
  const res = await fetch(`${API_BASE_URL}/categories${q ? `?${q}` : ''}`);
  if (!res.ok) throw new Error(`Erro ao listar categorias: ${res.status}`);
  return res.json();
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Erro ao criar categoria: ${res.status}`);
  return res.json();
}

export async function updateCategory(id: string, payload: UpdateCategoryPayload): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Erro ao atualizar categoria: ${res.status}`);
  return res.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erro ao deletar categoria: ${res.status}`);
}
/**
 * Customers API
 * Integração com o Hub para gerenciamento de clientes
 */

import { apiClient } from './api-client';

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  documento?: string;
  email?: string;
  phone?: string;
  dataNascISO?: string;
  tags?: string;
  notes?: string;
  address?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  pets?: PetSummary[];
}

export interface PetSummary {
  id: string;
  name: string;
  species: string;
  breed?: string;
  active: boolean;
}

export interface CreateCustomerDto {
  name: string;
  documento?: string;
  email?: string;
  phone?: string;
  dataNascISO?: string;
  tags?: string;
  notes?: string;
  address?: string;
  active?: boolean;
}

export interface UpdateCustomerDto {
  name?: string;
  documento?: string;
  email?: string;
  phone?: string;
  dataNascISO?: string;
  tags?: string;
  notes?: string;
  address?: string;
  active?: boolean;
}

export interface CustomerFilters {
  q?: string;        // search by name, email, phone, documento
  active?: boolean;  // filter by active status
  tags?: string[];   // filter by tags
}

/**
 * GET /api/customers - Lista todos os clientes
 */
export async function fetchCustomers(filters: CustomerFilters = {}): Promise<Customer[]> {
  const params = new URLSearchParams();
  
  if (filters.q) params.append('q', filters.q);
  if (filters.active !== undefined) params.append('active', filters.active.toString());
  if (filters.tags?.length) {
    filters.tags.forEach(tag => params.append('tags', tag));
  }

  const query = params.toString();
  const endpoint = `/api/customers${query ? `?${query}` : ''}`;
  
  return apiClient<Customer[]>(endpoint);
}

/**
 * GET /api/customers/:id - Busca cliente por ID
 */
export async function fetchCustomer(id: string): Promise<Customer> {
  return apiClient<Customer>(`/api/customers/${id}`);
}

/**
 * POST /api/customers - Cria novo cliente
 */
export async function createCustomer(data: CreateCustomerDto): Promise<Customer> {
  return apiClient<Customer>('/api/customers', {
    method: 'POST',
    body: data,
  });
}

/**
 * PATCH /api/customers/:id - Atualiza cliente
 */
export async function updateCustomer(id: string, data: UpdateCustomerDto): Promise<Customer> {
  return apiClient<Customer>(`/api/customers/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

/**
 * DELETE /api/customers/:id - Remove cliente (soft delete)
 */
export async function deleteCustomer(id: string): Promise<void> {
  return apiClient<void>(`/api/customers/${id}`, {
    method: 'DELETE',
  });
}

/**
 * GET /api/customers/search - Busca clientes por termo
 */
export async function searchCustomers(query: string): Promise<Customer[]> {
  return fetchCustomers({ q: query });
}

/**
 * GET /api/customers/active - Lista apenas clientes ativos
 */
export async function fetchActiveCustomers(): Promise<Customer[]> {
  return fetchCustomers({ active: true });
}
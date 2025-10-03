/**
 * Pets API
 * Integração com o Hub para gerenciamento de pets
 */

import { apiClient } from './api-client';

export interface Pet {
  id: string;
  tenantId: string;
  tutorId: string;
  name: string;
  species: string;
  breed?: string;
  weight?: number;
  birthDate?: string;
  observations?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  tutor?: CustomerSummary;
}

export interface CustomerSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface CreatePetDto {
  tutorId: string;
  name: string;
  species: string;
  breed?: string;
  weight?: number;
  birthDate?: string;
  observations?: string;
  active?: boolean;
}

export interface UpdatePetDto {
  tutorId?: string;
  name?: string;
  species?: string;
  breed?: string;
  weight?: number;
  birthDate?: string;
  observations?: string;
  active?: boolean;
}

export interface PetFilters {
  q?: string;        // search by name, species, breed
  tutorId?: string;  // filter by tutor
  species?: string;  // filter by species
  active?: boolean;  // filter by active status
}

/**
 * GET /api/pets - Lista todos os pets
 */
export async function fetchPets(filters: PetFilters = {}): Promise<Pet[]> {
  const params = new URLSearchParams();
  
  if (filters.q) params.append('q', filters.q);
  if (filters.tutorId) params.append('tutorId', filters.tutorId);
  if (filters.species) params.append('species', filters.species);
  if (filters.active !== undefined) params.append('active', filters.active.toString());

  const query = params.toString();
  const endpoint = `/api/pets${query ? `?${query}` : ''}`;
  
  return apiClient<Pet[]>(endpoint);
}

/**
 * GET /api/pets/:id - Busca pet por ID
 */
export async function fetchPet(id: string): Promise<Pet> {
  return apiClient<Pet>(`/api/pets/${id}`);
}

/**
 * GET /api/pets/by-tutor/:tutorId - Lista pets de um tutor específico
 */
export async function fetchPetsByTutor(tutorId: string): Promise<Pet[]> {
  return fetchPets({ tutorId });
}

/**
 * POST /api/pets - Cria novo pet
 */
export async function createPet(data: CreatePetDto): Promise<Pet> {
  return apiClient<Pet>('/api/pets', {
    method: 'POST',
    body: data,
  });
}

/**
 * PATCH /api/pets/:id - Atualiza pet
 */
export async function updatePet(id: string, data: UpdatePetDto): Promise<Pet> {
  return apiClient<Pet>(`/api/pets/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

/**
 * DELETE /api/pets/:id - Remove pet (soft delete)
 */
export async function deletePet(id: string): Promise<void> {
  return apiClient<void>(`/api/pets/${id}`, {
    method: 'DELETE',
  });
}

/**
 * GET /api/pets/search - Busca pets por termo
 */
export async function searchPets(query: string): Promise<Pet[]> {
  return fetchPets({ q: query });
}

/**
 * GET /api/pets/active - Lista apenas pets ativos
 */
export async function fetchActivePets(): Promise<Pet[]> {
  return fetchPets({ active: true });
}

/**
 * GET /api/pets/species - Lista espécies únicas
 */
export async function fetchPetSpecies(): Promise<string[]> {
  // Esta seria uma funcionalidade adicional que poderia ser implementada no backend
  // Por enquanto, retornamos uma lista padrão
  return ['Cão', 'Gato', 'Pássaro', 'Peixe', 'Hamster', 'Coelho', 'Réptil', 'Outro'];
}
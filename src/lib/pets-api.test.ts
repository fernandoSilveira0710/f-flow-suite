import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  fetchPets, 
  fetchPet, 
  fetchPetsByTutor, 
  createPet, 
  updatePet, 
  deletePet, 
  searchPets, 
  fetchActivePets, 
  fetchPetSpecies 
} from './pets-api';
import { apiClient } from './api-client';

// Mock the api-client
vi.mock('./api-client', () => ({
  apiClient: vi.fn(),
}));

const mockApiClient = vi.mocked(apiClient);

describe('pets-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchPets', () => {
    it('should fetch pets with default parameters', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            nome: 'Rex',
            especie: 'Cão',
            raca: 'Golden Retriever',
            dataNascimento: '2020-01-01T00:00:00.000Z',
            peso: 25.5,
            cor: 'Dourado',
            sexo: 'M',
            microchip: '123456789012345',
            observacoes: 'Pet muito dócil',
            ativo: true,
            tutorId: 'customer-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            tutor: {
              id: 'customer-1',
              nome: 'João Silva',
              telefone: '11999999999',
              email: 'joao@example.com',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockApiClient.mockResolvedValue(mockResponse);

      const result = await fetchPets();

      expect(mockApiClient).toHaveBeenCalledWith('/pets', {
        method: 'GET',
        params: {
          page: 1,
          limit: 20,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch pets with custom filters', async () => {
      const filters = {
        page: 2,
        limit: 10,
        search: 'Rex',
        tutorId: 'customer-1',
        ativo: true,
      };

      const mockResponse = {
        data: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
      };

      mockApiClient.mockResolvedValue(mockResponse);

      const result = await fetchPets(filters);

      expect(mockApiClient).toHaveBeenCalledWith('/pets', {
        method: 'GET',
        params: filters,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('fetchPet', () => {
    it('should fetch a single pet by id', async () => {
      const mockPet = {
        id: '1',
        nome: 'Rex',
        especie: 'Cão',
        raca: 'Golden Retriever',
        dataNascimento: '2020-01-01T00:00:00.000Z',
        peso: 25.5,
        cor: 'Dourado',
        sexo: 'M',
        microchip: '123456789012345',
        observacoes: 'Pet muito dócil',
        ativo: true,
        tutorId: 'customer-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        tutor: {
          id: 'customer-1',
          nome: 'João Silva',
          telefone: '11999999999',
          email: 'joao@example.com',
        },
      };

      mockApiClient.mockResolvedValue(mockPet);

      const result = await fetchPet('1');

      expect(mockApiClient).toHaveBeenCalledWith('/pets/1', {
        method: 'GET',
      });
      expect(result).toEqual(mockPet);
    });
  });

  describe('fetchPetsByTutor', () => {
    it('should fetch pets by tutor id', async () => {
      const mockPets = [
        {
          id: '1',
          nome: 'Rex',
          especie: 'Cão',
          raca: 'Golden Retriever',
          dataNascimento: '2020-01-01T00:00:00.000Z',
          peso: 25.5,
          cor: 'Dourado',
          sexo: 'M',
          microchip: '123456789012345',
          observacoes: 'Pet muito dócil',
          ativo: true,
          tutorId: 'customer-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      mockApiClient.mockResolvedValue(mockPets);

      const result = await fetchPetsByTutor('customer-1');

      expect(mockApiClient).toHaveBeenCalledWith('/pets/tutor/customer-1', {
        method: 'GET',
      });
      expect(result).toEqual(mockPets);
    });
  });

  describe('createPet', () => {
    it('should create a new pet', async () => {
      const petData = {
        nome: 'Bella',
        especie: 'Gato',
        raca: 'Persa',
        dataNascimento: new Date('2021-03-15'),
        peso: 4.2,
        cor: 'Branco',
        sexo: 'F' as const,
        microchip: '987654321098765',
        observacoes: 'Gata muito carinhosa',
        ativo: true,
        tutorId: 'customer-2',
      };

      const mockCreatedPet = {
        id: '2',
        ...petData,
        dataNascimento: petData.dataNascimento.toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        tutor: {
          id: 'customer-2',
          nome: 'Maria Santos',
          telefone: '11888888888',
          email: 'maria@example.com',
        },
      };

      mockApiClient.mockResolvedValue(mockCreatedPet);

      const result = await createPet(petData);

      expect(mockApiClient).toHaveBeenCalledWith('/pets', {
        method: 'POST',
        body: petData,
      });
      expect(result).toEqual(mockCreatedPet);
    });
  });

  describe('updatePet', () => {
    it('should update an existing pet', async () => {
      const updateData = {
        nome: 'Rex Jr.',
        peso: 30.0,
      };

      const mockUpdatedPet = {
        id: '1',
        nome: 'Rex Jr.',
        especie: 'Cão',
        raca: 'Golden Retriever',
        dataNascimento: '2020-01-01T00:00:00.000Z',
        peso: 30.0,
        cor: 'Dourado',
        sexo: 'M',
        microchip: '123456789012345',
        observacoes: 'Pet muito dócil',
        ativo: true,
        tutorId: 'customer-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        tutor: {
          id: 'customer-1',
          nome: 'João Silva',
          telefone: '11999999999',
          email: 'joao@example.com',
        },
      };

      mockApiClient.mockResolvedValue(mockUpdatedPet);

      const result = await updatePet('1', updateData);

      expect(mockApiClient).toHaveBeenCalledWith('/pets/1', {
        method: 'PUT',
        body: updateData,
      });
      expect(result).toEqual(mockUpdatedPet);
    });
  });

  describe('deletePet', () => {
    it('should delete a pet', async () => {
      const mockDeletedPet = {
        id: '1',
        nome: 'Rex',
        especie: 'Cão',
        raca: 'Golden Retriever',
        dataNascimento: '2020-01-01T00:00:00.000Z',
        peso: 25.5,
        cor: 'Dourado',
        sexo: 'M',
        microchip: '123456789012345',
        observacoes: 'Pet muito dócil',
        ativo: true,
        tutorId: 'customer-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        tutor: {
          id: 'customer-1',
          nome: 'João Silva',
          telefone: '11999999999',
          email: 'joao@example.com',
        },
      };

      mockApiClient.mockResolvedValue(mockDeletedPet);

      const result = await deletePet('1');

      expect(mockApiClient).toHaveBeenCalledWith('/pets/1', {
        method: 'DELETE',
      });
      expect(result).toEqual(mockDeletedPet);
    });
  });

  describe('searchPets', () => {
    it('should search pets by term', async () => {
      const mockSearchResults = [
        {
          id: '1',
          nome: 'Rex',
          especie: 'Cão',
          raca: 'Golden Retriever',
          dataNascimento: '2020-01-01T00:00:00.000Z',
          peso: 25.5,
          cor: 'Dourado',
          sexo: 'M',
          microchip: '123456789012345',
          observacoes: 'Pet muito dócil',
          ativo: true,
          tutorId: 'customer-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          tutor: {
            id: 'customer-1',
            nome: 'João Silva',
            telefone: '11999999999',
            email: 'joao@example.com',
          },
        },
      ];

      mockApiClient.mockResolvedValue(mockSearchResults);

      const result = await searchPets('Rex');

      expect(mockApiClient).toHaveBeenCalledWith('/pets/search', {
        method: 'GET',
        params: { q: 'Rex' },
      });
      expect(result).toEqual(mockSearchResults);
    });
  });

  describe('fetchActivePets', () => {
    it('should fetch only active pets', async () => {
      const mockActivePets = [
        {
          id: '1',
          nome: 'Rex',
          especie: 'Cão',
          raca: 'Golden Retriever',
          dataNascimento: '2020-01-01T00:00:00.000Z',
          peso: 25.5,
          cor: 'Dourado',
          sexo: 'M',
          microchip: '123456789012345',
          observacoes: 'Pet muito dócil',
          ativo: true,
          tutorId: 'customer-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          tutor: {
            id: 'customer-1',
            nome: 'João Silva',
            telefone: '11999999999',
            email: 'joao@example.com',
          },
        },
      ];

      mockApiClient.mockResolvedValue(mockActivePets);

      const result = await fetchActivePets();

      expect(mockApiClient).toHaveBeenCalledWith('/pets/active', {
        method: 'GET',
      });
      expect(result).toEqual(mockActivePets);
    });
  });

  describe('fetchPetSpecies', () => {
    it('should fetch distinct pet species', async () => {
      const mockSpecies = ['Cão', 'Gato', 'Pássaro', 'Peixe'];

      mockApiClient.mockResolvedValue(mockSpecies);

      const result = await fetchPetSpecies();

      expect(mockApiClient).toHaveBeenCalledWith('/pets/species', {
        method: 'GET',
      });
      expect(result).toEqual(mockSpecies);
    });
  });
});
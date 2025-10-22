import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  fetchPets, 
  fetchPet, 
  fetchPetsByTutor, 
  createPet, 
  updatePet, 
  deletePet, 
  searchPets 
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
      const mockResponse = [
        {
          id: '1',
          name: 'Rex',
          species: 'Cão',
          breed: 'Golden Retriever',
          birthDate: '2020-01-01T00:00:00.000Z',
          weight: 25.5,
          observations: 'Pet muito dócil',
          active: true,
          tutorId: 'customer-1',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          tutor: {
            id: 'customer-1',
            name: 'João Silva',
            phone: '11999999999',
            email: 'joao@example.com',
          },
        },
      ];

      mockApiClient.mockResolvedValue(mockResponse);

      const result = await fetchPets();

      expect(mockApiClient).toHaveBeenCalledWith('/api/pets');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch pets with custom filters', async () => {
      const filters = {
        q: 'Rex',
        tutorId: 'customer-1',
        active: true,
      };

      const mockResponse: any[] = [];

      mockApiClient.mockResolvedValue(mockResponse);

      const result = await fetchPets(filters);

      expect(mockApiClient).toHaveBeenCalledWith('/api/pets?q=Rex&tutorId=customer-1&active=true');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('fetchPet', () => {
    it('should fetch a single pet by id', async () => {
      const mockPet = {
        id: '1',
        name: 'Rex',
        species: 'Cão',
        breed: 'Golden Retriever',
        birthDate: '2020-01-01T00:00:00.000Z',
        weight: 25.5,
        observations: 'Pet muito dócil',
        active: true,
        tutorId: 'customer-1',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        tutor: {
          id: 'customer-1',
          name: 'João Silva',
          phone: '11999999999',
          email: 'joao@example.com',
        },
      };

      mockApiClient.mockResolvedValue(mockPet);

      const result = await fetchPet('1');

      expect(mockApiClient).toHaveBeenCalledWith('/api/pets/1');
      expect(result).toEqual(mockPet);
    });
  });

  describe('fetchPetsByTutor', () => {
    it('should fetch pets by tutor', async () => {
      const mockResponse = [
        { id: '1', name: 'Rex', species: 'Cão', active: true, tutorId: 'customer-1', createdAt: new Date(), updatedAt: new Date() },
      ];

      mockApiClient.mockResolvedValue(mockResponse);

      const result = await fetchPetsByTutor('customer-1');

      expect(mockApiClient).toHaveBeenCalledWith('/api/pets?tutorId=customer-1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createPet', () => {
    it('should create a new pet', async () => {
      const petData = {
        tutorId: 'customer-1',
        name: 'Rex',
        species: 'Cão',
        breed: 'Golden Retriever',
        weight: 25.5,
        birthDate: '2020-01-01T00:00:00.000Z',
        observations: 'Pet muito dócil',
        active: true,
      };

      const mockCreatedPet = {
        id: '2',
        ...petData,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      mockApiClient.mockResolvedValue(mockCreatedPet);

      const result = await createPet(petData);

      expect(mockApiClient).toHaveBeenCalledWith('/api/pets', {
        method: 'POST',
        body: petData,
      });
      expect(result).toEqual(mockCreatedPet);
    });
  });

  describe('updatePet', () => {
    it('should update an existing pet', async () => {
      const updateData = {
        name: 'Rex Jr.',
        weight: 26,
      };

      const mockUpdatedPet = {
        id: '1',
        tutorId: 'customer-1',
        name: 'Rex Jr.',
        species: 'Cão',
        breed: 'Golden Retriever',
        birthDate: '2020-01-01T00:00:00.000Z',
        weight: 26,
        observations: 'Pet muito dócil',
        active: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      mockApiClient.mockResolvedValue(mockUpdatedPet);

      const result = await updatePet('1', updateData);

      expect(mockApiClient).toHaveBeenCalledWith('/api/pets/1', {
        method: 'PATCH',
        body: updateData,
      });
      expect(result).toEqual(mockUpdatedPet);
    });
  });

  describe('deletePet', () => {
    it('should delete a pet', async () => {
      mockApiClient.mockResolvedValue(undefined);

      const result = await deletePet('1');

      expect(mockApiClient).toHaveBeenCalledWith('/api/pets/1', {
        method: 'DELETE',
      });
      expect(result).toBeUndefined();
    });
  });

  describe('searchPets', () => {
    it('should search pets by term', async () => {
      const mockSearchResults = [
        { id: '1', name: 'Rex', species: 'Cão', active: true, tutorId: 'customer-1', createdAt: new Date(), updatedAt: new Date() },
      ];

      mockApiClient.mockResolvedValue(mockSearchResults);

      const result = await searchPets('Rex');

      expect(mockApiClient).toHaveBeenCalledWith('/api/pets?q=Rex');
      expect(result).toEqual(mockSearchResults);
    });
  });
});
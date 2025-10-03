import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  fetchCustomers, 
  fetchCustomer, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer, 
  searchCustomers, 
  fetchActiveCustomers 
} from './customers-api';
import { apiClient } from './api-client';

// Mock the api-client
vi.mock('./api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);

describe('customers-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchCustomers', () => {
    it('should fetch customers with default parameters', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            nome: 'João Silva',
            documento: '12345678901',
            email: 'joao@example.com',
            telefone: '11999999999',
            dataNascimento: '1990-01-01T00:00:00.000Z',
            endereco: 'Rua A, 123',
            tags: ['VIP'],
            notas: 'Cliente especial',
            ativo: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            pets: [],
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockApiClient.mockResolvedValue(mockResponse);

      const result = await fetchCustomers();

      expect(mockApiClient).toHaveBeenCalledWith('/customers', {
        method: 'GET',
        params: {
          page: 1,
          limit: 20,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch customers with custom filters', async () => {
      const filters = {
        page: 2,
        limit: 10,
        search: 'João',
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

      const result = await fetchCustomers(filters);

      expect(mockApiClient).toHaveBeenCalledWith('/customers', {
        method: 'GET',
        params: filters,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('fetchCustomer', () => {
    it('should fetch a single customer by id', async () => {
      const mockCustomer = {
        id: '1',
        nome: 'João Silva',
        documento: '12345678901',
        email: 'joao@example.com',
        telefone: '11999999999',
        dataNascimento: '1990-01-01T00:00:00.000Z',
        endereco: 'Rua A, 123',
        tags: ['VIP'],
        notas: 'Cliente especial',
        ativo: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        pets: [
          {
            id: 'pet-1',
            nome: 'Rex',
            especie: 'Cão',
            raca: 'Golden Retriever',
          },
        ],
      };

      mockApiClient.mockResolvedValue(mockCustomer);

      const result = await fetchCustomer('1');

      expect(mockApiClient).toHaveBeenCalledWith('/customers/1', {
        method: 'GET',
      });
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      const customerData = {
        nome: 'Maria Santos',
        documento: '98765432100',
        email: 'maria@example.com',
        telefone: '11888888888',
        dataNascimento: new Date('1985-05-15'),
        endereco: 'Rua B, 456',
        tags: ['Premium'],
        notas: 'Cliente premium',
        ativo: true,
      };

      const mockCreatedCustomer = {
        id: '2',
        ...customerData,
        dataNascimento: customerData.dataNascimento.toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        pets: [],
      };

      mockApiClient.mockResolvedValue(mockCreatedCustomer);

      const result = await createCustomer(customerData);

      expect(mockApiClient).toHaveBeenCalledWith('/customers', {
        method: 'POST',
        body: customerData,
      });
      expect(result).toEqual(mockCreatedCustomer);
    });
  });

  describe('updateCustomer', () => {
    it('should update an existing customer', async () => {
      const updateData = {
        nome: 'João Silva Santos',
        telefone: '11777777777',
      };

      const mockUpdatedCustomer = {
        id: '1',
        nome: 'João Silva Santos',
        documento: '12345678901',
        email: 'joao@example.com',
        telefone: '11777777777',
        dataNascimento: '1990-01-01T00:00:00.000Z',
        endereco: 'Rua A, 123',
        tags: ['VIP'],
        notas: 'Cliente especial',
        ativo: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        pets: [],
      };

      mockApiClient.mockResolvedValue(mockUpdatedCustomer);

      const result = await updateCustomer('1', updateData);

      expect(mockApiClient).toHaveBeenCalledWith('/customers/1', {
        method: 'PUT',
        body: updateData,
      });
      expect(result).toEqual(mockUpdatedCustomer);
    });
  });

  describe('deleteCustomer', () => {
    it('should delete a customer', async () => {
      const mockDeletedCustomer = {
        id: '1',
        nome: 'João Silva',
        documento: '12345678901',
        email: 'joao@example.com',
        telefone: '11999999999',
        dataNascimento: '1990-01-01T00:00:00.000Z',
        endereco: 'Rua A, 123',
        tags: ['VIP'],
        notas: 'Cliente especial',
        ativo: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        pets: [],
      };

      mockApiClient.mockResolvedValue(mockDeletedCustomer);

      const result = await deleteCustomer('1');

      expect(mockApiClient).toHaveBeenCalledWith('/customers/1', {
        method: 'DELETE',
      });
      expect(result).toEqual(mockDeletedCustomer);
    });
  });

  describe('searchCustomers', () => {
    it('should search customers by term', async () => {
      const mockSearchResults = [
        {
          id: '1',
          nome: 'João Silva',
          documento: '12345678901',
          email: 'joao@example.com',
          telefone: '11999999999',
          dataNascimento: '1990-01-01T00:00:00.000Z',
          endereco: 'Rua A, 123',
          tags: ['VIP'],
          notas: 'Cliente especial',
          ativo: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          pets: [],
        },
      ];

      mockApiClient.mockResolvedValue(mockSearchResults);

      const result = await searchCustomers('João');

      expect(mockApiClient).toHaveBeenCalledWith('/customers/search', {
        method: 'GET',
        params: { q: 'João' },
      });
      expect(result).toEqual(mockSearchResults);
    });
  });

  describe('fetchActiveCustomers', () => {
    it('should fetch only active customers', async () => {
      const mockActiveCustomers = [
        {
          id: '1',
          nome: 'João Silva',
          documento: '12345678901',
          email: 'joao@example.com',
          telefone: '11999999999',
          dataNascimento: '1990-01-01T00:00:00.000Z',
          endereco: 'Rua A, 123',
          tags: ['VIP'],
          notas: 'Cliente especial',
          ativo: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          pets: [],
        },
      ];

      mockApiClient.mockResolvedValue(mockActiveCustomers);

      const result = await fetchActiveCustomers();

      expect(mockApiClient).toHaveBeenCalledWith('/customers/active', {
        method: 'GET',
      });
      expect(result).toEqual(mockActiveCustomers);
    });
  });
});
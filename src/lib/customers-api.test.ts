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
  apiClient: vi.fn(),
}));

const mockApiClient = vi.mocked(apiClient);

describe('customers-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchCustomers', () => {
    it('should fetch customers with default parameters', async () => {
      const mockResponse = [
        {
          id: '1',
          name: 'João Silva',
          documento: '12345678901',
          email: 'joao@example.com',
          phone: '11999999999',
          dataNascISO: '1990-01-01T00:00:00.000Z',
          address: 'Rua A, 123',
          tags: 'VIP',
          notes: 'Cliente especial',
          active: true,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          pets: [],
        },
      ];

      mockApiClient.mockResolvedValue(mockResponse);

      const result = await fetchCustomers();

      expect(mockApiClient).toHaveBeenCalledWith('/api/customers');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch customers with custom filters', async () => {
      const filters = {
        q: 'João',
        active: true,
        tags: ['VIP'],
      };

      const mockResponse: any[] = [];

      mockApiClient.mockResolvedValue(mockResponse);

      const result = await fetchCustomers(filters);

      expect(mockApiClient).toHaveBeenCalledWith('/api/customers?q=Jo%C3%A3o&active=true&tags=VIP');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('fetchCustomer', () => {
    it('should fetch a single customer by id', async () => {
      const mockCustomer = {
        id: '1',
        name: 'João Silva',
        documento: '12345678901',
        email: 'joao@example.com',
        phone: '11999999999',
        dataNascISO: '1990-01-01T00:00:00.000Z',
        address: 'Rua A, 123',
        tags: 'VIP',
        notes: 'Cliente especial',
        active: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        pets: [
          {
            id: 'pet-1',
            name: 'Rex',
            species: 'Cão',
            breed: 'Golden Retriever',
            active: true,
          },
        ],
      };

      mockApiClient.mockResolvedValue(mockCustomer);

      const result = await fetchCustomer('1');

      expect(mockApiClient).toHaveBeenCalledWith('/api/customers/1');
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      const customerData = {
        name: 'Maria Santos',
        documento: '98765432100',
        email: 'maria@example.com',
        phone: '11888888888',
        dataNascISO: new Date('1985-05-15').toISOString(),
        address: 'Rua B, 456',
        tags: 'Premium',
        notes: 'Cliente premium',
        active: true,
      };

      const mockCreatedCustomer = {
        id: '2',
        ...customerData,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        pets: [],
      };

      mockApiClient.mockResolvedValue(mockCreatedCustomer);

      const result = await createCustomer(customerData);

      expect(mockApiClient).toHaveBeenCalledWith('/api/customers', {
        method: 'POST',
        body: customerData,
      });
      expect(result).toEqual(mockCreatedCustomer);
    });
  });

  describe('updateCustomer', () => {
    it('should update an existing customer', async () => {
      const updateData = {
        name: 'João Silva Santos',
        phone: '11777777777',
      };

      const mockUpdatedCustomer = {
        id: '1',
        name: 'João Silva Santos',
        documento: '12345678901',
        email: 'joao@example.com',
        phone: '11777777777',
        dataNascISO: '1990-01-01T00:00:00.000Z',
        address: 'Rua A, 123',
        tags: 'VIP',
        notes: 'Cliente especial',
        active: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        pets: [],
      };

      mockApiClient.mockResolvedValue(mockUpdatedCustomer);

      const result = await updateCustomer('1', updateData);

      expect(mockApiClient).toHaveBeenCalledWith('/api/customers/1', {
        method: 'PATCH',
        body: updateData,
      });
      expect(result).toEqual(mockUpdatedCustomer);
    });
  });

  describe('deleteCustomer', () => {
    it('should delete a customer', async () => {
      const mockDeletedCustomer = {
        id: '1',
        name: 'João Silva',
        documento: '12345678901',
        email: 'joao@example.com',
        phone: '11999999999',
        dataNascISO: '1990-01-01T00:00:00.000Z',
        address: 'Rua A, 123',
        tags: 'VIP',
        notes: 'Cliente especial',
        active: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        pets: [],
      };

      mockApiClient.mockResolvedValue(mockDeletedCustomer);

      const result = await deleteCustomer('1');

      expect(mockApiClient).toHaveBeenCalledWith('/api/customers/1', {
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
          name: 'João Silva',
          documento: '12345678901',
          email: 'joao@example.com',
          phone: '11999999999',
          dataNascISO: '1990-01-01T00:00:00.000Z',
          address: 'Rua A, 123',
          tags: 'VIP',
          notes: 'Cliente especial',
          active: true,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          pets: [],
        },
      ];

      mockApiClient.mockResolvedValue(mockSearchResults);

      const result = await searchCustomers('João');

      expect(mockApiClient).toHaveBeenCalledWith('/api/customers?q=Jo%C3%A3o');
      expect(result).toEqual(mockSearchResults);
    });
  });

  describe('fetchActiveCustomers', () => {
    it('should fetch only active customers', async () => {
      const mockActiveCustomers = [
        {
          id: '1',
          name: 'João Silva',
          documento: '12345678901',
          email: 'joao@example.com',
          phone: '11999999999',
          dataNascISO: '1990-01-01T00:00:00.000Z',
          address: 'Rua A, 123',
          tags: 'VIP',
          notes: 'Cliente especial',
          active: true,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          pets: [],
        },
      ];

      mockApiClient.mockResolvedValue(mockActiveCustomers);

      const result = await fetchActiveCustomers();

      expect(mockApiClient).toHaveBeenCalledWith('/api/customers?active=true');
      expect(result).toEqual(mockActiveCustomers);
    });
  });
});
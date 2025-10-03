import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaClient } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('CustomersService', () => {
  let service: CustomersService;
  let prismaClient: PrismaClient;

  const mockPrismaClient = {
    $executeRaw: jest.fn(),
    customer: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: PrismaClient,
          useValue: mockPrismaClient,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prismaClient = module.get<PrismaClient>(PrismaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByTenant', () => {
    it('should return all customers for a tenant', async () => {
      const tenantId = 'tenant-1';
      const mockCustomers = [
        {
          id: '1',
          tenantId,
          name: 'João Silva',
          documento: '123.456.789-00',
          email: 'joao@email.com',
          phone: '(11) 99999-9999',
          dataNascISO: '1990-01-01',
          tags: ['VIP'],
          notes: 'Cliente especial',
          address: 'Rua A, 123',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          pets: [
            {
              id: 'pet-1',
              name: 'Rex',
              species: 'Cão',
              breed: 'Labrador',
              active: true,
            },
          ],
        },
      ];

      mockPrismaClient.$executeRaw.mockResolvedValue(undefined);
      mockPrismaClient.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await service.findAllByTenant(tenantId);

      expect(mockPrismaClient.$executeRaw).toHaveBeenCalledWith(
        expect.anything()
      );
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith({
        where: { 
          tenantId,
          deletedAt: null 
        },
        include: {
          pets: {
            where: { 
              active: true,
              deletedAt: null 
            },
            select: {
              id: true,
              name: true,
              species: true,
              breed: true,
              active: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockCustomers);
    });
  });

  describe('findOneByTenant', () => {
    it('should return a customer by id and tenant', async () => {
      const tenantId = 'tenant-1';
      const customerId = '1';
      const mockCustomer = {
        id: customerId,
        tenantId,
        name: 'João Silva',
        documento: '123.456.789-00',
        email: 'joao@email.com',
        phone: '(11) 99999-9999',
        dataNascISO: '1990-01-01',
        tags: ['VIP'],
        notes: 'Cliente especial',
        address: 'Rua A, 123',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        pets: [],
      };

      mockPrismaClient.$executeRaw.mockResolvedValue(undefined);
      mockPrismaClient.customer.findFirst.mockResolvedValue(mockCustomer);

      const result = await service.findOneByTenant(tenantId, customerId);

      expect(mockPrismaClient.$executeRaw).toHaveBeenCalledWith(
        expect.anything()
      );
      expect(mockPrismaClient.customer.findFirst).toHaveBeenCalledWith({
        where: { 
          id: customerId,
          tenantId,
          deletedAt: null 
        },
        include: {
          pets: {
            where: { 
              active: true,
              deletedAt: null 
            },
            select: {
              id: true,
              name: true,
              species: true,
              breed: true,
              active: true,
            },
          },
        },
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException when customer not found', async () => {
      const tenantId = 'tenant-1';
      const customerId = 'non-existent';

      mockPrismaClient.$executeRaw.mockResolvedValue(undefined);
      mockPrismaClient.customer.findFirst.mockResolvedValue(null);

      await expect(service.findOneByTenant(tenantId, customerId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('upsertFromEvent', () => {
    it('should create or update a customer from event payload', async () => {
      const tenantId = 'tenant-1';
      const eventPayload = {
        id: '1',
        name: 'João Silva',
        documento: '123.456.789-00',
        email: 'joao@email.com',
        phone: '(11) 99999-9999',
        dataNascISO: '1990-01-01',
        tags: ['VIP'],
        notes: 'Cliente especial',
        address: 'Rua A, 123',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCustomer = {
        ...eventPayload,
        tenantId,
        pets: [],
      };

      mockPrismaClient.$executeRaw.mockResolvedValue(undefined);
      mockPrismaClient.customer.upsert.mockResolvedValue(mockCustomer);

      const result = await service.upsertFromEvent(tenantId, eventPayload);

      expect(mockPrismaClient.$executeRaw).toHaveBeenCalledWith(
        expect.anything()
      );
      expect(mockPrismaClient.customer.upsert).toHaveBeenCalledWith({
        where: { 
          id: eventPayload.id,
        },
        create: {
          id: eventPayload.id,
          tenantId,
          name: eventPayload.name,
          documento: eventPayload.documento,
          email: eventPayload.email,
          phone: eventPayload.phone,
          dataNascISO: eventPayload.dataNascISO,
          tags: eventPayload.tags,
          notes: eventPayload.notes,
          address: eventPayload.address,
          active: eventPayload.active,
          createdAt: eventPayload.createdAt,
          updatedAt: eventPayload.updatedAt,
        },
        update: {
          name: eventPayload.name,
          documento: eventPayload.documento,
          email: eventPayload.email,
          phone: eventPayload.phone,
          dataNascISO: eventPayload.dataNascISO,
          tags: eventPayload.tags,
          notes: eventPayload.notes,
          address: eventPayload.address,
          active: eventPayload.active,
          updatedAt: eventPayload.updatedAt,
        },
        include: {
          pets: {
            where: { 
              active: true,
              deletedAt: null 
            },
            select: {
              id: true,
              name: true,
              species: true,
              breed: true,
              active: true,
            },
          },
        },
      });
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('deleteFromEvent', () => {
    it('should soft delete a customer', async () => {
      const tenantId = 'tenant-1';
      const customerId = '1';
      const deletedAt = new Date();

      mockPrismaClient.$executeRaw.mockResolvedValue(undefined);
      mockPrismaClient.customer.update.mockResolvedValue({});

      await service.deleteFromEvent(tenantId, customerId, deletedAt);

      expect(mockPrismaClient.$executeRaw).toHaveBeenCalledWith(
        expect.anything()
      );
      expect(mockPrismaClient.customer.update).toHaveBeenCalledWith({
        where: { 
          id: customerId,
          tenantId 
        },
        data: {
          deletedAt,
          active: false,
        },
      });
    });
  });


});
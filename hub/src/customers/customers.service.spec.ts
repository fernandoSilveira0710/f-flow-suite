import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../common/events.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: PrismaService;
  let events: EventsService;

  const mockPrismaService = {
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
    pet: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const mockEventsService = {
    createEvent: jest.fn(),
  } as unknown as EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventsService, useValue: mockEventsService },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prisma = module.get<PrismaService>(PrismaService);
    events = module.get<EventsService>(EventsService);
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
      const mockPrismaCustomers = [
        {
          id: '1',
          tenantId,
          name: 'João Silva',
          document: '123.456.789-00',
          email: 'joao@email.com',
          phone: '(11) 99999-9999',
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
      const mockExpectedCustomers = [
        {
          id: '1',
          tenantId,
          name: 'João Silva',
          documento: '123.456.789-00',
          email: 'joao@email.com',
          phone: '(11) 99999-9999',
          dataNascISO: undefined,
          tags: ['VIP'],
          notes: 'Cliente especial',
          address: 'Rua A, 123',
          active: true,
          createdAt: mockPrismaCustomers[0].createdAt,
          updatedAt: mockPrismaCustomers[0].updatedAt,
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

      (prisma.customer.findMany as any).mockResolvedValue(mockPrismaCustomers);

      const result = await service.findAllByTenant(tenantId);

      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: { 
          tenantId,
          active: true 
        },
        include: {
          pets: {
            where: { 
              active: true
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
      expect(result).toEqual(mockExpectedCustomers);
    });
  });

  describe('findOneByTenant', () => {
    it('should return a customer by id and tenant', async () => {
      const tenantId = 'tenant-1';
      const customerId = '1';
      const mockPrismaCustomer = {
        id: customerId,
        tenantId,
        name: 'João Silva',
        document: '123.456.789-00',
        email: 'joao@email.com',
        phone: '(11) 99999-9999',
        tags: ['VIP'],
        notes: 'Cliente especial',
        address: 'Rua A, 123',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        pets: [],
      };
      const mockExpectedCustomer = {
        id: customerId,
        tenantId,
        name: 'João Silva',
        documento: '123.456.789-00',
        email: 'joao@email.com',
        phone: '(11) 99999-9999',
        dataNascISO: undefined,
        tags: ['VIP'],
        notes: 'Cliente especial',
        address: 'Rua A, 123',
        active: true,
        createdAt: mockPrismaCustomer.createdAt,
        updatedAt: mockPrismaCustomer.updatedAt,
        pets: [],
      };

      (prisma.customer.findFirst as any).mockResolvedValue(mockPrismaCustomer);

      const result = await service.findOneByTenant(tenantId, customerId);

      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { 
          id: customerId,
          tenantId,
          active: true 
        },
        include: {
          pets: {
            where: { 
              active: true
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
      expect(result).toEqual(mockExpectedCustomer);
    });

    it('should throw NotFoundException when customer not found', async () => {
      const tenantId = 'tenant-1';
      const customerId = 'non-existent';

      (prisma.customer.findFirst as any).mockResolvedValue(null);

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
        tags: ['VIP'],
        notes: 'Cliente especial',
        address: 'Rua A, 123',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPrismaCustomer = {
        id: eventPayload.id,
        tenantId,
        name: eventPayload.name,
        document: eventPayload.documento,
        email: eventPayload.email,
        phone: eventPayload.phone,
        tags: eventPayload.tags,
        notes: eventPayload.notes,
        address: eventPayload.address,
        active: eventPayload.active,
        createdAt: eventPayload.createdAt,
        updatedAt: eventPayload.updatedAt,
        pets: [],
      };
      const mockExpectedCustomer = {
        id: eventPayload.id,
        tenantId,
        name: eventPayload.name,
        documento: eventPayload.documento,
        email: eventPayload.email,
        phone: eventPayload.phone,
        dataNascISO: undefined,
        tags: eventPayload.tags,
        notes: eventPayload.notes,
        address: eventPayload.address,
        active: eventPayload.active,
        createdAt: eventPayload.createdAt,
        updatedAt: eventPayload.updatedAt,
        pets: [],
      };

      (prisma.customer.upsert as any).mockResolvedValue(mockPrismaCustomer);

      const result = await service.upsertFromEvent(tenantId, eventPayload);

      expect(prisma.customer.upsert).toHaveBeenCalledWith({
        where: { 
          id: eventPayload.id,
        },
        create: {
          id: eventPayload.id,
          tenantId,
          name: eventPayload.name,
          document: eventPayload.documento,
          email: eventPayload.email,
          phone: eventPayload.phone,
          tags: eventPayload.tags,
          notes: eventPayload.notes,
          address: eventPayload.address,
          active: eventPayload.active,
          createdAt: eventPayload.createdAt,
          updatedAt: eventPayload.updatedAt,
        },
        update: {
          name: eventPayload.name,
          document: eventPayload.documento,
          email: eventPayload.email,
          phone: eventPayload.phone,
          tags: eventPayload.tags,
          notes: eventPayload.notes,
          address: eventPayload.address,
          active: eventPayload.active,
          updatedAt: eventPayload.updatedAt,
        },
        include: {
          pets: {
            where: { 
              active: true
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
      expect(result).toEqual(mockExpectedCustomer);
    });
  });

  describe('deleteFromEvent', () => {
    it('should soft delete a customer', async () => {
      const tenantId = 'tenant-1';
      const customerId = '1';

      (prisma.customer.update as any).mockResolvedValue({});

      await service.deleteFromEvent(tenantId, customerId);

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { 
          id: customerId,
          tenantId 
        },
        data: {
          active: false,
        },
      });
    });
  });

});
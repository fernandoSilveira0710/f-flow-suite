import { Test, TestingModule } from '@nestjs/testing';
import { PetsService } from './pets.service';
import { PrismaClient } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('PetsService', () => {
  let service: PetsService;
  let prismaClient: PrismaClient;

  const mockPrismaClient = {
    $executeRaw: jest.fn(),
    pet: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetsService,
        {
          provide: PrismaClient,
          useValue: mockPrismaClient,
        },
      ],
    }).compile();

    service = module.get<PetsService>(PetsService);
    prismaClient = module.get<PrismaClient>(PrismaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllByTenant', () => {
    it('should return all pets for a tenant', async () => {
      const tenantId = 'tenant-1';
      const mockPets = [
        {
          id: 'pet-1',
          tenantId,
          tutorId: 'tutor-1',
          name: 'Rex',
          species: 'Cão',
          breed: 'Labrador',
          weight: 25.5,
          birthDate: new Date('2020-01-01'),
          observations: 'Pet muito dócil',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          tutor: {
            id: 'tutor-1',
            name: 'João Silva',
            email: 'joao@email.com',
            phone: '(11) 99999-9999',
          },
        },
      ];

      mockPrismaClient.$executeRaw.mockResolvedValue(undefined);
      mockPrismaClient.pet.findMany.mockResolvedValue(mockPets);

      const result = await service.findAllByTenant(tenantId);

      expect(mockPrismaClient.$executeRaw).toHaveBeenCalledWith(
        expect.anything()
      );
      expect(mockPrismaClient.pet.findMany).toHaveBeenCalledWith({
        where: { 
          tenantId,
          deletedAt: null 
        },
        include: {
          tutor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockPets);
    });
  });

  describe('findByTutor', () => {
    it('should return pets for a specific tutor', async () => {
      const tenantId = 'tenant-1';
      const tutorId = 'tutor-1';
      const mockPets = [
        {
          id: 'pet-1',
          tenantId,
          tutorId,
          name: 'Rex',
          species: 'Cão',
          breed: 'Labrador',
          weight: 25.5,
          birthDate: new Date('2020-01-01'),
          observations: 'Pet muito dócil',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          tutor: {
            id: tutorId,
            name: 'João Silva',
            email: 'joao@email.com',
            phone: '(11) 99999-9999',
          },
        },
      ];

      mockPrismaClient.$executeRaw.mockResolvedValue(undefined);
      mockPrismaClient.pet.findMany.mockResolvedValue(mockPets);

      const result = await service.findByTutor(tenantId, tutorId);

      expect(mockPrismaClient.$executeRaw).toHaveBeenCalledWith(
        expect.anything()
      );
      expect(mockPrismaClient.pet.findMany).toHaveBeenCalledWith({
        where: { 
          tenantId,
          tutorId,
          deletedAt: null 
        },
        include: {
          tutor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockPets);
    });
  });

  describe('findOneByTenant', () => {
    it('should return a pet by id and tenant', async () => {
      const tenantId = 'tenant-1';
      const petId = 'pet-1';
      const mockPet = {
        id: petId,
        tenantId,
        tutorId: 'tutor-1',
        name: 'Rex',
        species: 'Cão',
        breed: 'Labrador',
        weight: 25.5,
        birthDate: new Date('2020-01-01'),
        observations: 'Pet muito dócil',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        tutor: {
          id: 'tutor-1',
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '(11) 99999-9999',
        },
      };

      mockPrismaClient.$executeRaw.mockResolvedValue(undefined);
      mockPrismaClient.pet.findFirst.mockResolvedValue(mockPet);

      const result = await service.findOneByTenant(tenantId, petId);

      expect(mockPrismaClient.$executeRaw).toHaveBeenCalledWith(
        expect.anything()
      );
      expect(mockPrismaClient.pet.findFirst).toHaveBeenCalledWith({
        where: { 
          id: petId,
          tenantId,
          deletedAt: null 
        },
        include: {
          tutor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });
      expect(result).toEqual(mockPet);
    });

    it('should throw NotFoundException when pet not found', async () => {
      const tenantId = 'tenant-1';
      const petId = 'non-existent';

      mockPrismaClient.$executeRaw.mockResolvedValue(undefined);
      mockPrismaClient.pet.findFirst.mockResolvedValue(null);

      await expect(service.findOneByTenant(tenantId, petId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('upsertFromEvent', () => {
    it('should create or update a pet from event payload', async () => {
      const tenantId = 'tenant-1';
      const eventPayload = {
        id: 'pet-1',
        tutorId: 'tutor-1',
        name: 'Rex',
        species: 'Cão',
        breed: 'Labrador',
        weight: 25.5,
        birthDate: new Date('2020-01-01'),
        observations: 'Pet muito dócil',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPet = {
        ...eventPayload,
        tenantId,
        tutor: {
          id: 'tutor-1',
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '(11) 99999-9999',
        },
      };

      mockPrismaClient.$executeRaw.mockResolvedValue(undefined);
      mockPrismaClient.pet.upsert.mockResolvedValue(mockPet);

      const result = await service.upsertFromEvent(tenantId, eventPayload);

      expect(mockPrismaClient.$executeRaw).toHaveBeenCalledWith(
        expect.anything()
      );
      expect(mockPrismaClient.pet.upsert).toHaveBeenCalledWith({
        where: { 
          id: eventPayload.id,
        },
        create: {
          id: eventPayload.id,
          tenantId,
          tutorId: eventPayload.tutorId,
          name: eventPayload.name,
          species: eventPayload.species,
          breed: eventPayload.breed,
          weight: eventPayload.weight,
          birthDate: eventPayload.birthDate,
          observations: eventPayload.observations,
          active: eventPayload.active,
          createdAt: eventPayload.createdAt,
          updatedAt: eventPayload.updatedAt,
        },
        update: {
          tutorId: eventPayload.tutorId,
          name: eventPayload.name,
          species: eventPayload.species,
          breed: eventPayload.breed,
          weight: eventPayload.weight,
          birthDate: eventPayload.birthDate,
          observations: eventPayload.observations,
          active: eventPayload.active,
          updatedAt: eventPayload.updatedAt,
        },
        include: {
          tutor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });
      expect(result).toEqual(mockPet);
    });
  });

  describe('deleteFromEvent', () => {
    it('should soft delete a pet', async () => {
      const tenantId = 'tenant-1';
      const petId = 'pet-1';
      const deletedAt = new Date();

      mockPrismaClient.$executeRaw.mockResolvedValue(undefined);
      mockPrismaClient.pet.update.mockResolvedValue({});

      await service.deleteFromEvent(tenantId, petId, deletedAt);

      expect(mockPrismaClient.$executeRaw).toHaveBeenCalledWith(
        expect.anything()
      );
      expect(mockPrismaClient.pet.update).toHaveBeenCalledWith({
        where: { 
          id: petId,
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


});
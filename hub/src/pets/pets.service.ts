import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../common/events.service';
import { CreatePetDto, UpdatePetDto, PetResponseDto } from './dto';

@Injectable()
export class PetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async findAllByTenant(tenantId: string): Promise<PetResponseDto[]> {
    const pets = await this.prisma.pet.findMany({
      where: { 
        tenantId,
        active: true
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

    return pets.map(this.mapToResponseDto);
  }

  async findByTutor(tenantId: string, tutorId: string): Promise<PetResponseDto[]> {
    const pets = await this.prisma.pet.findMany({
      where: { 
        tenantId,
        tutorId,
        active: true
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

    return pets.map(this.mapToResponseDto);
  }

  async findOneByTenant(tenantId: string, petId: string): Promise<PetResponseDto> {
    const pet = await this.prisma.pet.findFirst({
      where: { 
        id: petId,
        tenantId,
        active: true
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

    if (!pet) {
      throw new NotFoundException(`Pet with ID ${petId} not found`);
    }

    return this.mapToResponseDto(pet);
  }

  async upsertFromEvent(tenantId: string, eventPayload: any): Promise<PetResponseDto> {
    const pet = await this.prisma.pet.upsert({
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

    return this.mapToResponseDto(pet);
  }

  async deleteFromEvent(tenantId: string, petId: string): Promise<void> {
    await this.prisma.pet.update({
      where: { 
        id: petId,
        tenantId 
      },
      data: {
        active: false,
      },
    });
  }

  async create(tenantId: string, createPetDto: CreatePetDto): Promise<PetResponseDto> {
    // Verify that the tutor exists and belongs to the tenant
    const tutor = await this.prisma.customer.findFirst({
      where: {
        id: createPetDto.tutorId,
        tenantId,
        active: true,
      },
    });

    if (!tutor) {
      throw new NotFoundException(`Tutor with ID ${createPetDto.tutorId} not found`);
    }

    const pet = await this.prisma.pet.create({
      data: {
        tenantId,
        ...createPetDto,
        birthDate: createPetDto.birthDate ? new Date(createPetDto.birthDate) : null,
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

    // Generate event for synchronization
    await this.generatePetEvent(tenantId, 'pet.created.v1', pet);

    return this.mapToResponseDto(pet);
  }

  async update(tenantId: string, petId: string, updatePetDto: UpdatePetDto): Promise<PetResponseDto> {
    const existingPet = await this.findOneByTenant(tenantId, petId);

    // Verify that the tutor exists and belongs to the tenant if tutorId is being updated
    if (updatePetDto.tutorId && updatePetDto.tutorId !== existingPet.tutorId) {
      const tutor = await this.prisma.customer.findFirst({
        where: {
          id: updatePetDto.tutorId,
          tenantId,
          active: true,
        },
      });

      if (!tutor) {
        throw new NotFoundException(`Tutor with ID ${updatePetDto.tutorId} not found`);
      }
    }

    const pet = await this.prisma.pet.update({
      where: { 
        id: petId,
        tenantId 
      },
      data: {
        ...updatePetDto,
        birthDate: updatePetDto.birthDate ? new Date(updatePetDto.birthDate) : undefined,
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

    // Generate event for synchronization
    await this.generatePetEvent(tenantId, 'pet.updated.v1', pet);

    return this.mapToResponseDto(pet);
  }

  async remove(tenantId: string, petId: string): Promise<void> {
    const existingPet = await this.findOneByTenant(tenantId, petId);

    await this.prisma.pet.update({
      where: { 
        id: petId,
        tenantId 
      },
      data: {
        active: false,
      },
    });

    // Generate event for synchronization
    await this.generatePetEvent(tenantId, 'pet.deleted.v1', { id: petId });
  }

  private async generatePetEvent(tenantId: string, eventType: string, pet: any): Promise<void> {
    await this.eventsService.createEvent(tenantId, {
      eventType,
      entityType: 'pet',
      entityId: pet.id,
      data: pet,
    });
  }

  private mapToResponseDto(pet: any): PetResponseDto {
    return {
      id: pet.id,
      tenantId: pet.tenantId,
      tutorId: pet.tutorId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      weight: pet.weight,
      birthDate: pet.birthDate,
      observations: pet.observations,
      active: pet.active,
      createdAt: pet.createdAt,
      updatedAt: pet.updatedAt,
      tutor: pet.tutor ? {
        id: pet.tutor.id,
        name: pet.tutor.name,
        email: pet.tutor.email,
        phone: pet.tutor.phone,
      } : undefined,
    };
  }
}
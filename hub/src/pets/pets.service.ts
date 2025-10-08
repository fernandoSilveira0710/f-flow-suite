import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PetResponseDto } from './dto';

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

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
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  private readonly logger = new Logger(PetsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventValidator: EventValidatorService,
  ) {}

  async create(createPetDto: CreatePetDto) {
    // Verify that the tutor (customer) exists
    const tutor = await this.prisma.customer.findUnique({
      where: { id: createPetDto.tutorId },
    });

    if (!tutor) {
      throw new NotFoundException(`Customer with ID ${createPetDto.tutorId} not found`);
    }

    const pet = await this.prisma.pet.create({
      data: {
        tutorId: createPetDto.tutorId,
        name: createPetDto.name,
        species: createPetDto.species,
        breed: createPetDto.breed,
        weight: createPetDto.weight,
        birthDate: createPetDto.birthDate,
        observations: createPetDto.observations,
        active: createPetDto.active ?? true,
      },
    });

    // Generate outbox event for synchronization
    await this.generatePetEvent(pet, 'pet.upserted.v1');

    return pet;
  }

  async findAll() {
    return this.prisma.pet.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
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
  }

  async findByTutor(tutorId: string) {
    return this.prisma.pet.findMany({
      where: { 
        tutorId,
        active: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id },
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
      throw new NotFoundException(`Pet with ID ${id} not found`);
    }

    return pet;
  }

  async update(id: string, updatePetDto: UpdatePetDto) {
    const existingPet = await this.prisma.pet.findUnique({
      where: { id },
    });

    if (!existingPet) {
      throw new NotFoundException(`Pet with ID ${id} not found`);
    }

    // If tutorId is being updated, verify the new tutor exists
    if (updatePetDto.tutorId && updatePetDto.tutorId !== existingPet.tutorId) {
      const tutor = await this.prisma.customer.findUnique({
        where: { id: updatePetDto.tutorId },
      });

      if (!tutor) {
        throw new NotFoundException(`Customer with ID ${updatePetDto.tutorId} not found`);
      }
    }

    const pet = await this.prisma.pet.update({
      where: { id },
      data: {
        tutorId: updatePetDto.tutorId,
        name: updatePetDto.name,
        species: updatePetDto.species,
        breed: updatePetDto.breed,
        weight: updatePetDto.weight,
        birthDate: updatePetDto.birthDate,
        observations: updatePetDto.observations,
        active: updatePetDto.active,
      },
    });

    // Generate outbox event for synchronization
    await this.generatePetEvent(pet, 'pet.upserted.v1');

    return pet;
  }

  async remove(id: string): Promise<void> {
    const existingPet = await this.prisma.pet.findUnique({
      where: { id },
    });

    if (!existingPet) {
      throw new NotFoundException(`Pet with ID ${id} not found`);
    }

    // Soft delete by setting active to false
    const pet = await this.prisma.pet.update({
      where: { id },
      data: { active: false },
    });

    // Generate outbox event for synchronization
    await this.generatePetEvent(pet, 'pet.deleted.v1');
  }

  private async generatePetEvent(pet: any, eventType: string): Promise<void> {
    const eventPayload = {
      id: pet.id,
      tutorId: pet.tutorId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      weight: pet.weight,
      birthDate: pet.birthDate,
      observations: pet.observations,
      active: pet.active,
      createdAt: pet.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: pet.updatedAt?.toISOString(),
    };

    // Store event in OutboxEvent table for synchronization
    await this.prisma.outboxEvent.create({
      data: {
        eventType,
        payload: JSON.stringify(eventPayload),
        processed: false,
      },
    });
  }
}
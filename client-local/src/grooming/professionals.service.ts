import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

@Injectable()
export class ProfessionalsService {
  constructor(
    private prisma: PrismaService,
    private eventValidator: EventValidatorService,
  ) {}

  async create(createProfessionalDto: CreateProfessionalDto) {
    const professional = await this.prisma.professional.create({
      data: {
        name: createProfessionalDto.name,
        role: createProfessionalDto.role,
      },
    });

    // Generate event for synchronization
    await this.generateProfessionalEvent('professional.created.v1', professional);

    return professional;
  }

  async findAll() {
    return this.prisma.professional.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
    });

    if (!professional) {
      throw new NotFoundException(`Professional with ID ${id} not found`);
    }

    return professional;
  }

  async update(id: string, updateProfessionalDto: UpdateProfessionalDto) {
    const existingProfessional = await this.findOne(id);

    const professional = await this.prisma.professional.update({
      where: { id },
      data: {
        name: updateProfessionalDto.name,
        role: updateProfessionalDto.role,
      },
    });

    // Generate event for synchronization
    await this.generateProfessionalEvent('professional.updated.v1', professional);

    return professional;
  }

  async remove(id: string) {
    const existingProfessional = await this.findOne(id);

    // Since Professional model doesn't have active field, actually delete the professional
    const professional = await this.prisma.professional.delete({
      where: { id },
    });

    // Generate event for synchronization
    await this.generateProfessionalEvent('professional.deleted.v1', professional);

    return professional;
  }

  private async generateProfessionalEvent(eventType: string, professional: any) {
    const payload = {
      id: professional.id,
      name: professional.name,
      role: professional.role,
      createdAt: professional.createdAt,
      updatedAt: professional.updatedAt,
    };

    // Validate event structure
    const isValid = await this.eventValidator.validateEvent(eventType, payload);
    if (!isValid) {
      console.warn(`Invalid event structure for ${eventType}:`, payload);
      return;
    }

    // Store in outbox for synchronization
    await this.prisma.outboxEvent.create({
      data: {
        eventType,
        payload: JSON.stringify(payload),
      },
    });
  }
}
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { ProfessionalResponseDto } from './dto/professional-response.dto';

@Injectable()
export class ProfessionalsService {
  private readonly logger = new Logger(ProfessionalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventValidator: EventValidatorService,
  ) {}

  async create(createProfessionalDto: CreateProfessionalDto): Promise<ProfessionalResponseDto> {
    const professional = await this.prisma.professional.create({
      data: {
        name: createProfessionalDto.name,
        role: createProfessionalDto.role || 'Professional',
        active: createProfessionalDto.active ?? true,
      },
    });

    // Generate outbox event for synchronization
    await this.generateProfessionalEvent(professional, 'professional.upserted.v1');

    return this.mapToResponseDto(professional);
  }

  async findAll(): Promise<ProfessionalResponseDto[]> {
    const professionals = await this.prisma.professional.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    return professionals.map(professional => this.mapToResponseDto(professional));
  }

  async findOne(id: string): Promise<ProfessionalResponseDto> {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
    });

    if (!professional) {
      throw new NotFoundException(`Professional with ID ${id} not found`);
    }

    return this.mapToResponseDto(professional);
  }

  async update(id: string, updateProfessionalDto: UpdateProfessionalDto): Promise<ProfessionalResponseDto> {
    const existingProfessional = await this.prisma.professional.findUnique({
      where: { id },
    });

    if (!existingProfessional) {
      throw new NotFoundException(`Professional with ID ${id} not found`);
    }

    const professional = await this.prisma.professional.update({
      where: { id },
      data: {
        ...(updateProfessionalDto.name && { name: updateProfessionalDto.name }),
        ...(updateProfessionalDto.role !== undefined && { role: updateProfessionalDto.role }),
        ...(updateProfessionalDto.active !== undefined && { active: updateProfessionalDto.active }),
      },
    });

    // Generate outbox event for synchronization
    await this.generateProfessionalEvent(professional, 'professional.upserted.v1');

    return this.mapToResponseDto(professional);
  }

  async remove(id: string): Promise<void> {
    const existingProfessional = await this.prisma.professional.findUnique({
      where: { id },
    });

    if (!existingProfessional) {
      throw new NotFoundException(`Professional with ID ${id} not found`);
    }

    // Soft delete by setting active to false
    const professional = await this.prisma.professional.update({
      where: { id },
      data: { active: false },
    });

    // Generate outbox event for synchronization
    await this.generateProfessionalEvent(professional, 'professional.deleted.v1');
  }

  private async generateProfessionalEvent(professional: any, eventType: string): Promise<void> {
    const eventData = {
      id: professional.id,
      name: professional.name,
      role: professional.role,
      active: professional.active,
      createdAt: professional.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: professional.updatedAt?.toISOString(),
    };

    // Store event in OutboxEvent table for synchronization
    await this.prisma.outboxEvent.create({
      data: {
        eventType,
        payload: JSON.stringify(eventData),
        processed: false,
      },
    });
  }

  private mapToResponseDto(professional: any): ProfessionalResponseDto {
    return {
      id: professional.id,
      name: professional.name,
      role: professional.role,
      active: professional.active ?? true,
      createdAt: professional.createdAt,
      updatedAt: professional.updatedAt,
    };
  }
}
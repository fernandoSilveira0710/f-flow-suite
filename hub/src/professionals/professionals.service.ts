import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../common/events.service';
import { CreateProfessionalDto, UpdateProfessionalDto, ProfessionalResponseDto } from './dto';

@Injectable()
export class ProfessionalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async findAllByTenant(tenantId: string): Promise<ProfessionalResponseDto[]> {
    const professionals = await this.prisma.professional.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return professionals.map(this.mapToResponseDto);
  }

  async findOneByTenant(tenantId: string, professionalId: string): Promise<ProfessionalResponseDto> {
    const professional = await this.prisma.professional.findFirst({
      where: { 
        id: professionalId,
        tenantId 
      },
    });

    if (!professional) {
      throw new NotFoundException(`Professional with ID ${professionalId} not found`);
    }

    return this.mapToResponseDto(professional);
  }

  async upsertFromEvent(tenantId: string, eventPayload: any): Promise<ProfessionalResponseDto> {
    const professional = await this.prisma.professional.upsert({
      where: { 
        id: eventPayload.id,
      },
      create: {
        id: eventPayload.id,
        tenantId,
        name: eventPayload.name,
        email: eventPayload.email,
        phone: eventPayload.phone,
        document: eventPayload.document,
        specialty: eventPayload.specialty,
        services: eventPayload.services,
        active: eventPayload.active,
        createdAt: eventPayload.createdAt,
        updatedAt: eventPayload.updatedAt,
      },
      update: {
        name: eventPayload.name,
        email: eventPayload.email,
        phone: eventPayload.phone,
        document: eventPayload.document,
        specialty: eventPayload.specialty,
        services: eventPayload.services,
        active: eventPayload.active,
        updatedAt: eventPayload.updatedAt,
      },
    });

    return this.mapToResponseDto(professional);
  }

  async deleteFromEvent(tenantId: string, professionalId: string): Promise<void> {
    await this.prisma.professional.delete({
      where: { 
        id: professionalId,
        tenantId 
      },
    });
  }

  async create(tenantId: string, createProfessionalDto: CreateProfessionalDto): Promise<ProfessionalResponseDto> {
    // Check for duplicate professional email within the tenant
    const existingProfessional = await this.prisma.professional.findFirst({
      where: {
        tenantId,
        email: createProfessionalDto.email,
        active: true,
      },
    });

    if (existingProfessional) {
      throw new ConflictException(`Professional with email '${createProfessionalDto.email}' already exists`);
    }

    // Validate service IDs if provided
    if (createProfessionalDto.serviceIds && createProfessionalDto.serviceIds.length > 0) {
      const services = await this.prisma.service.findMany({
        where: {
          tenantId,
          id: { in: createProfessionalDto.serviceIds },
          active: true,
        },
      });

      if (services.length !== createProfessionalDto.serviceIds.length) {
        throw new NotFoundException('One or more service IDs are invalid');
      }
    }

    const professional = await this.prisma.professional.create({
      data: {
        tenantId,
        name: createProfessionalDto.name,
        email: createProfessionalDto.email,
        phone: createProfessionalDto.phone,
        specialty: createProfessionalDto.specialty,
        services: createProfessionalDto.serviceIds || [],
        active: createProfessionalDto.active ?? true,
      },
    });

    // Generate event for synchronization
    await this.generateProfessionalEvent(tenantId, 'professional.created.v1', professional);

    return this.mapToResponseDto(professional);
  }

  async update(tenantId: string, professionalId: string, updateProfessionalDto: UpdateProfessionalDto): Promise<ProfessionalResponseDto> {
    const existingProfessional = await this.findOneByTenant(tenantId, professionalId);

    // Check for duplicate professional email if email is being updated
    if (updateProfessionalDto.email && updateProfessionalDto.email !== existingProfessional.email) {
      const duplicateProfessional = await this.prisma.professional.findFirst({
        where: {
          tenantId,
          email: updateProfessionalDto.email,
          active: true,
          id: { not: professionalId },
        },
      });

      if (duplicateProfessional) {
        throw new ConflictException(`Professional with email '${updateProfessionalDto.email}' already exists`);
      }
    }

    // Validate service IDs if provided
    if (updateProfessionalDto.serviceIds && updateProfessionalDto.serviceIds.length > 0) {
      const services = await this.prisma.service.findMany({
        where: {
          tenantId,
          id: { in: updateProfessionalDto.serviceIds },
          active: true,
        },
      });

      if (services.length !== updateProfessionalDto.serviceIds.length) {
        throw new NotFoundException('One or more service IDs are invalid');
      }
    }

    const professional = await this.prisma.professional.update({
      where: { 
        id: professionalId,
        tenantId 
      },
      data: {
        ...updateProfessionalDto,
        services: updateProfessionalDto.serviceIds !== undefined ? updateProfessionalDto.serviceIds : undefined,
      },
    });

    // Generate event for synchronization
    await this.generateProfessionalEvent(tenantId, 'professional.updated.v1', professional);

    return this.mapToResponseDto(professional);
  }

  async remove(tenantId: string, professionalId: string): Promise<void> {
    const existingProfessional = await this.findOneByTenant(tenantId, professionalId);

    await this.prisma.professional.update({
      where: { 
        id: professionalId,
        tenantId 
      },
      data: {
        active: false,
      },
    });

    // Generate event for synchronization
    await this.generateProfessionalEvent(tenantId, 'professional.deleted.v1', { id: professionalId });
  }

  private async generateProfessionalEvent(tenantId: string, eventType: string, professional: any): Promise<void> {
    await this.eventsService.createEvent(tenantId, {
      eventType,
      entityType: 'professional',
      entityId: professional.id,
      data: professional,
    });
  }

  private mapToResponseDto(professional: any): ProfessionalResponseDto {
    return {
      id: professional.id,
      tenantId: professional.tenantId,
      name: professional.name,
      email: professional.email,
      phone: professional.phone,
      document: professional.document,
      specialty: professional.specialty,
      services: professional.services,
      active: professional.active,
      createdAt: professional.createdAt,
      updatedAt: professional.updatedAt,
    };
  }
}
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ProfessionalResponseDto } from './dto';

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

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
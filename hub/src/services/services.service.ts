import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ServiceResponseDto } from './dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByTenant(tenantId: string): Promise<ServiceResponseDto[]> {
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = '${tenantId}'`;

    const services = await this.prisma.service.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return services.map(this.mapToResponseDto);
  }

  async findOneByTenant(tenantId: string, serviceId: string): Promise<ServiceResponseDto> {
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = '${tenantId}'`;

    const service = await this.prisma.service.findFirst({
      where: { 
        id: serviceId,
        tenantId 
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    return this.mapToResponseDto(service);
  }

  async upsertFromEvent(tenantId: string, eventPayload: any): Promise<ServiceResponseDto> {
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = '${tenantId}'`;

    const service = await this.prisma.service.upsert({
      where: { 
        id: eventPayload.id,
      },
      create: {
        id: eventPayload.id,
        tenantId,
        name: eventPayload.name,
        description: eventPayload.description,
        price: eventPayload.price,
        duration: eventPayload.duration,
        category: eventPayload.category,
        active: eventPayload.active,
        createdAt: eventPayload.createdAt,
        updatedAt: eventPayload.updatedAt,
      },
      update: {
        name: eventPayload.name,
        description: eventPayload.description,
        price: eventPayload.price,
        duration: eventPayload.duration,
        category: eventPayload.category,
        active: eventPayload.active,
        updatedAt: eventPayload.updatedAt,
      },
    });

    return this.mapToResponseDto(service);
  }

  async deleteFromEvent(tenantId: string, serviceId: string): Promise<void> {
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = '${tenantId}'`;

    await this.prisma.service.delete({
      where: { 
        id: serviceId,
        tenantId 
      },
    });
  }

  private mapToResponseDto(service: any): ServiceResponseDto {
    return {
      id: service.id,
      tenantId: service.tenantId,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      active: service.active,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}
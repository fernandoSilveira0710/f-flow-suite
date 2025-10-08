import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../common/events.service';
import { CreateServiceDto, UpdateServiceDto, ServiceResponseDto } from './dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async findAllByTenant(tenantId: string): Promise<ServiceResponseDto[]> {
    const services = await this.prisma.service.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return services.map(this.mapToResponseDto);
  }

  async findOneByTenant(tenantId: string, serviceId: string): Promise<ServiceResponseDto> {
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
    await this.prisma.service.delete({
      where: { 
        id: serviceId,
        tenantId 
      },
    });
  }

  async create(tenantId: string, createServiceDto: CreateServiceDto): Promise<ServiceResponseDto> {
    // Check for duplicate service name within the tenant
    const existingService = await this.prisma.service.findFirst({
      where: {
        tenantId,
        name: createServiceDto.name,
        active: true,
      },
    });

    if (existingService) {
      throw new ConflictException(`Service with name '${createServiceDto.name}' already exists`);
    }

    const service = await this.prisma.service.create({
      data: {
        tenantId,
        ...createServiceDto,
      },
    });

    // Generate event for synchronization
    await this.generateServiceEvent(tenantId, 'service.created.v1', service);

    return this.mapToResponseDto(service);
  }

  async update(tenantId: string, serviceId: string, updateServiceDto: UpdateServiceDto): Promise<ServiceResponseDto> {
    const existingService = await this.findOneByTenant(tenantId, serviceId);

    // Check for duplicate service name if name is being updated
    if (updateServiceDto.name && updateServiceDto.name !== existingService.name) {
      const duplicateService = await this.prisma.service.findFirst({
        where: {
          tenantId,
          name: updateServiceDto.name,
          active: true,
          id: { not: serviceId },
        },
      });

      if (duplicateService) {
        throw new ConflictException(`Service with name '${updateServiceDto.name}' already exists`);
      }
    }

    const service = await this.prisma.service.update({
      where: { 
        id: serviceId,
        tenantId 
      },
      data: updateServiceDto,
    });

    // Generate event for synchronization
    await this.generateServiceEvent(tenantId, 'service.updated.v1', service);

    return this.mapToResponseDto(service);
  }

  async remove(tenantId: string, serviceId: string): Promise<void> {
    const existingService = await this.findOneByTenant(tenantId, serviceId);

    await this.prisma.service.update({
      where: { 
        id: serviceId,
        tenantId 
      },
      data: {
        active: false,
      },
    });

    // Generate event for synchronization
    await this.generateServiceEvent(tenantId, 'service.deleted.v1', { id: serviceId });
  }

  private async generateServiceEvent(tenantId: string, eventType: string, service: any): Promise<void> {
    await this.eventsService.createEvent(tenantId, {
      eventType,
      entityType: 'service',
      entityId: service.id,
      data: service,
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
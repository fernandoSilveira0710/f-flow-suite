import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../common/events.service';
import { CreateResourceDto, UpdateResourceDto, ResourceResponseDto } from './dto';

@Injectable()
export class ResourcesService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
  ) {}

  async create(tenantId: string, createResourceDto: CreateResourceDto): Promise<ResourceResponseDto> {
    // Check if resource name already exists for this tenant
    const existingResource = await this.prisma.resource.findFirst({
      where: {
        tenantId,
        name: createResourceDto.name,
      },
    });

    if (existingResource) {
      throw new ConflictException(`Resource with name '${createResourceDto.name}' already exists`);
    }

    const resource = await this.prisma.resource.create({
      data: {
        ...createResourceDto,
        tenantId,
      },
    });

    // Generate resource.created.v1 event
    await this.generateResourceEvent('resource.created.v1', resource);

    return resource;
  }

  async findAll(tenantId: string, type?: string, active?: boolean): Promise<ResourceResponseDto[]> {
    const where: any = { tenantId };
    
    if (type) {
      where.type = type;
    }
    
    if (active !== undefined) {
      where.active = active;
    }

    return this.prisma.resource.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<ResourceResponseDto> {
    const resource = await this.prisma.resource.findFirst({
      where: { id, tenantId },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    return resource;
  }

  async update(tenantId: string, id: string, updateResourceDto: UpdateResourceDto): Promise<ResourceResponseDto> {
    // Check if resource exists
    const existingResource = await this.findOne(tenantId, id);

    // Check if new name conflicts with another resource
    if (updateResourceDto.name && updateResourceDto.name !== existingResource.name) {
      const nameConflict = await this.prisma.resource.findFirst({
        where: {
          tenantId,
          name: updateResourceDto.name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new ConflictException(`Resource with name '${updateResourceDto.name}' already exists`);
      }
    }

    const resource = await this.prisma.resource.update({
      where: { id },
      data: updateResourceDto,
    });

    // Generate resource.updated.v1 event
    await this.generateResourceEvent('resource.updated.v1', resource);

    return resource;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const resource = await this.findOne(tenantId, id);

    // Check if resource is being used in any appointments
    const appointmentsCount = await this.prisma.appointment.count({
      where: {
        tenantId,
        resourceId: id,
        status: { in: ['scheduled', 'confirmed', 'in_progress'] },
      },
    });

    if (appointmentsCount > 0) {
      throw new ConflictException('Cannot delete resource that is assigned to active appointments');
    }

    await this.prisma.resource.delete({
      where: { id },
    });

    // Generate resource.deleted.v1 event
    await this.generateResourceEvent('resource.deleted.v1', resource);
  }

  private async generateResourceEvent(eventType: string, resource: ResourceResponseDto): Promise<void> {
    await this.eventsService.emit(eventType, {
      tenantId: resource.tenantId,
      eventType,
      entityType: 'resource',
      entityId: resource.id,
      data: resource,
    });
  }
}
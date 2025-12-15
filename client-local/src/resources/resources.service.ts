import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourceResponseDto } from './dto/resource-response.dto';

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventValidator: EventValidatorService,
  ) {}

  async create(createResourceDto: CreateResourceDto): Promise<ResourceResponseDto> {
    const resource = await this.prisma.resource.create({
      data: {
        name: createResourceDto.name,
        type: createResourceDto.type,
        description: createResourceDto.description,
        active: createResourceDto.active ?? true,
      },
    });

    // Generate outbox event for synchronization
    await this.generateResourceEvent(resource, 'resource.upserted.v1');

    return this.mapToResponseDto(resource);
  }

  async findAll(): Promise<ResourceResponseDto[]> {
    const resources = await this.prisma.resource.findMany({
      orderBy: { name: 'asc' },
    });

    return resources.map((resource: any) => this.mapToResponseDto(resource));
  }

  async findOne(id: string): Promise<ResourceResponseDto> {
    const resource = await this.prisma.resource.findFirst({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    return this.mapToResponseDto(resource);
  }

  async update(id: string, updateResourceDto: UpdateResourceDto): Promise<ResourceResponseDto> {
    const existingResource = await this.prisma.resource.findFirst({
      where: { id },
    });

    if (!existingResource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    const resource = await this.prisma.resource.update({
      where: { id },
      data: {
        ...(updateResourceDto.name && { name: updateResourceDto.name }),
        ...(updateResourceDto.type && { type: updateResourceDto.type }),
        ...(updateResourceDto.description !== undefined && { description: updateResourceDto.description }),
        ...(updateResourceDto.active !== undefined && { active: updateResourceDto.active }),
      },
    });

    // Generate outbox event for synchronization
    await this.generateResourceEvent(resource, 'resource.upserted.v1');

    return this.mapToResponseDto(resource);
  }

  async remove(id: string): Promise<void> {
    const existingResource = await this.prisma.resource.findFirst({
      where: { id },
    });

    if (!existingResource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    // Check if resource is being used in appointments
    const appointmentsUsingResource = await this.prisma.appointment.count({
      where: { 
        resourceId: id,
        status: { in: ['scheduled', 'confirmed', 'in_progress'] }
      },
    });

    if (appointmentsUsingResource > 0) {
      throw new Error(`Cannot delete resource. It is being used in ${appointmentsUsingResource} active appointments.`);
    }

    await this.prisma.resource.delete({
      where: { id },
    });

    // Generate outbox event for synchronization
    await this.generateResourceEvent(existingResource, 'resource.deleted.v1');
  }

  async checkResourceAvailability(
    resourceId: string, 
    date: Date, 
    startTime?: string, 
    endTime?: string, 
    excludeAppointmentId?: string
  ): Promise<boolean> {
    if (!startTime || !endTime) {
      return true; // If no time specified, consider available
    }

    const conflictingAppointments = await this.prisma.appointment.findMany({
      where: {
        resourceId,
        date: {
          equals: date,
        },
        status: { in: ['scheduled', 'confirmed', 'in_progress'] },
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      },
    });

    return conflictingAppointments.length === 0;
  }

  private async generateResourceEvent(resource: any, eventType: string): Promise<void> {
    const eventPayload = {
      id: resource.id,
      name: resource.name,
      type: resource.type,
      description: resource.description,
      active: resource.active,
      createdAt: resource.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: resource.updatedAt?.toISOString(),
    };

    // Validate event payload
    const isValid = await this.eventValidator.validateEvent(eventType, eventPayload);
    if (!isValid) {
      this.logger.error(`Invalid event payload for ${eventType}`, eventPayload);
      throw new Error(`Invalid event payload for ${eventType}`);
    }

    // Store event in OutboxEvent table for synchronization
    await this.prisma.outboxEvent.create({
      data: {
        eventType,
        payload: JSON.stringify(eventPayload),
        processed: false,
      },
    });

    this.logger.log(`Generated ${eventType} event for resource ${resource.id}`);
  }

  private mapToResponseDto(resource: any): ResourceResponseDto {
    return {
      id: resource.id,
      name: resource.name,
      type: resource.type,
      description: resource.description,
      active: resource.active,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private eventValidator: EventValidatorService,
  ) {}

  async create(createServiceDto: CreateServiceDto) {
    const service = await this.prisma.service.create({
      data: createServiceDto,
    });

    // Generate event for synchronization
    await this.generateServiceEvent('service.created.v1', service);

    return service;
  }

  async findAll(active?: boolean) {
    // Since Service model doesn't have active field, ignore the filter
    return this.prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    const existingService = await this.findOne(id);

    const service = await this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });

    // Generate event for synchronization
    await this.generateServiceEvent('service.updated.v1', service);

    return service;
  }

  async remove(id: string) {
    const existingService = await this.findOne(id);

    // Since Service model doesn't have active field, actually delete the service
    const service = await this.prisma.service.delete({
      where: { id },
    });

    // Generate event for synchronization
    await this.generateServiceEvent('service.deleted.v1', service);

    return service;
  }

  private async generateServiceEvent(eventType: string, service: any) {
    const payload = {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      active: service.active,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
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
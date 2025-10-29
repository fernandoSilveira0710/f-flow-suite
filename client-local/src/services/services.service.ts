import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventValidator: EventValidatorService,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<ServiceResponseDto> {
    const service = await this.prisma.service.create({
      data: {
        name: createServiceDto.name,
        description: createServiceDto.description,
        price: createServiceDto.price,
        duration: createServiceDto.duration || 0,
        categoryId: createServiceDto.categoryId,
        active: createServiceDto.active ?? true,
      },
    });

    // Generate outbox event for synchronization
    await this.generateServiceEvent(service, 'service.upserted.v1');

    return this.mapToResponseDto(service);
  }

  async findAll(): Promise<ServiceResponseDto[]> {
    const services = await this.prisma.service.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    return services.map((service: any) => this.mapToResponseDto(service));
  }

  async findOne(id: string): Promise<ServiceResponseDto> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return this.mapToResponseDto(service);
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<ServiceResponseDto> {
    const existingService = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const service = await this.prisma.service.update({
      where: { id },
      data: {
        ...(updateServiceDto.name && { name: updateServiceDto.name }),
        ...(updateServiceDto.description !== undefined && { description: updateServiceDto.description }),
        ...(updateServiceDto.price !== undefined && { price: updateServiceDto.price }),
        ...(updateServiceDto.duration !== undefined && { duration: updateServiceDto.duration }),
        ...(updateServiceDto.categoryId !== undefined && { categoryId: updateServiceDto.categoryId }),
        ...(updateServiceDto.active !== undefined && { active: updateServiceDto.active }),
      },
    });

    // Generate outbox event for synchronization
    await this.generateServiceEvent(service, 'service.upserted.v1');

    return this.mapToResponseDto(service);
  }

  async remove(id: string): Promise<void> {
    const existingService = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // Soft delete by setting active to false
    const service = await this.prisma.service.update({
      where: { id },
      data: { active: false },
    });

    // Generate outbox event for synchronization
    await this.generateServiceEvent(service, 'service.deleted.v1');
  }

  private async generateServiceEvent(service: any, eventType: string): Promise<void> {
    const eventPayload = {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      active: service.active,
      createdAt: service.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: service.updatedAt?.toISOString(),
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

  private mapToResponseDto(service: any): ServiceResponseDto {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      active: service.active ?? true,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}
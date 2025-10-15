import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../common/events.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerResponseDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async findAllByTenant(tenantId: string): Promise<CustomerResponseDto[]> {
    const customers = await this.prisma.customer.findMany({
      where: { 
        tenantId,
        active: true 
      },
      include: {
        pets: {
          where: { 
            active: true
          },
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            active: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return customers.map(this.mapToResponseDto);
  }

  async findOneByTenant(tenantId: string, customerId: string): Promise<CustomerResponseDto> {
    const customer = await this.prisma.customer.findFirst({
      where: { 
        id: customerId,
        tenantId,
        active: true 
      },
      include: {
        pets: {
          where: { 
            active: true
          },
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            active: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return this.mapToResponseDto(customer);
  }

  async upsertFromEvent(tenantId: string, eventPayload: any): Promise<CustomerResponseDto> {
    const customer = await this.prisma.customer.upsert({
      where: { 
        id: eventPayload.id,
      },
      create: {
        id: eventPayload.id,
        tenantId,
        name: eventPayload.name,
        documento: eventPayload.documento,
        email: eventPayload.email,
        phone: eventPayload.phone,
        dataNascISO: eventPayload.dataNascISO,
        tags: eventPayload.tags,
        notes: eventPayload.notes,
        address: eventPayload.address,
        active: eventPayload.active,
        createdAt: eventPayload.createdAt,
        updatedAt: eventPayload.updatedAt,
      },
      update: {
        name: eventPayload.name,
        documento: eventPayload.documento,
        email: eventPayload.email,
        phone: eventPayload.phone,
        dataNascISO: eventPayload.dataNascISO,
        tags: eventPayload.tags,
        notes: eventPayload.notes,
        address: eventPayload.address,
        active: eventPayload.active,
        updatedAt: eventPayload.updatedAt,
      },
      include: {
        pets: {
          where: { 
            active: true
          },
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            active: true,
          },
        },
      },
    });

    return this.mapToResponseDto(customer);
  }

  async deleteFromEvent(tenantId: string, customerId: string): Promise<void> {
    await this.prisma.customer.update({
      where: { 
        id: customerId,
        tenantId 
      },
      data: {
        active: false,
      },
    });
  }

  async create(tenantId: string, createCustomerDto: CreateCustomerDto): Promise<CustomerResponseDto> {
    // Check for duplicate email if provided
    if (createCustomerDto.email) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          tenantId,
          email: createCustomerDto.email,
          active: true,
        },
      });

      if (existingCustomer) {
        throw new ConflictException(`Customer with email ${createCustomerDto.email} already exists`);
      }
    }

    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        ...createCustomerDto,
        dataNascISO: createCustomerDto.dataNascISO ? new Date(createCustomerDto.dataNascISO) : null,
      },
      include: {
        pets: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            active: true,
          },
        },
      },
    });

    // Generate event for synchronization
    await this.generateCustomerEvent(tenantId, 'customer.created.v1', customer);

    return this.mapToResponseDto(customer);
  }

  async update(tenantId: string, customerId: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const existingCustomer = await this.findOneByTenant(tenantId, customerId);

    // Check for duplicate email if provided and different from current
    if (updateCustomerDto.email && updateCustomerDto.email !== existingCustomer.email) {
      const duplicateCustomer = await this.prisma.customer.findFirst({
        where: {
          tenantId,
          email: updateCustomerDto.email,
          active: true,
          id: { not: customerId },
        },
      });

      if (duplicateCustomer) {
        throw new ConflictException(`Customer with email ${updateCustomerDto.email} already exists`);
      }
    }

    const customer = await this.prisma.customer.update({
      where: { 
        id: customerId,
        tenantId 
      },
      data: {
        ...updateCustomerDto,
        dataNascISO: updateCustomerDto.dataNascISO ? new Date(updateCustomerDto.dataNascISO) : undefined,
      },
      include: {
        pets: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            active: true,
          },
        },
      },
    });

    // Generate event for synchronization
    await this.generateCustomerEvent(tenantId, 'customer.updated.v1', customer);

    return this.mapToResponseDto(customer);
  }

  async remove(tenantId: string, customerId: string): Promise<void> {
    const existingCustomer = await this.findOneByTenant(tenantId, customerId);

    await this.prisma.customer.update({
      where: { 
        id: customerId,
        tenantId 
      },
      data: {
        active: false,
      },
    });

    // Generate event for synchronization
    await this.generateCustomerEvent(tenantId, 'customer.deleted.v1', { id: customerId });
  }

  private async generateCustomerEvent(tenantId: string, eventType: string, customer: any): Promise<void> {
    await this.eventsService.createEvent(tenantId, {
      eventType,
      entityType: 'customer',
      entityId: customer.id,
      data: customer,
    });
  }

  private mapToResponseDto(customer: any): CustomerResponseDto {
    return {
      id: customer.id,
      tenantId: customer.tenantId,
      name: customer.name,
      documento: customer.documento,
      email: customer.email,
      phone: customer.phone,
      dataNascISO: customer.dataNascISO,
      tags: customer.tags,
      notes: customer.notes,
      address: customer.address,
      active: customer.active,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      pets: customer.pets?.map((pet: any) => ({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        active: pet.active,
      })),
    };
  }
}
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CustomerResponseDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByTenant(tenantId: string): Promise<CustomerResponseDto[]> {
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = '${tenantId}'`;

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
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = ${tenantId}`;

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
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = ${tenantId}`;

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
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = ${tenantId}`;

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
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventValidator: EventValidatorService,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: {
        name: createCustomerDto.name,
        documento: createCustomerDto.documento,
        email: createCustomerDto.email,
        phone: createCustomerDto.phone,
        dataNascISO: createCustomerDto.dataNascISO,
        tags: createCustomerDto.tags,
        notes: createCustomerDto.notes,
        address: createCustomerDto.address,
        active: createCustomerDto.active ?? true,
      },
    });

    // Generate outbox event for synchronization
    await this.generateCustomerEvent(customer, 'customer.upserted.v1');

    return customer;
  }

  async findAll() {
    return this.prisma.customer.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        pets: {
          where: { active: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        pets: {
          where: { active: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        name: updateCustomerDto.name,
        documento: updateCustomerDto.documento,
        email: updateCustomerDto.email,
        phone: updateCustomerDto.phone,
        dataNascISO: updateCustomerDto.dataNascISO,
        tags: updateCustomerDto.tags,
        notes: updateCustomerDto.notes,
        address: updateCustomerDto.address,
        active: updateCustomerDto.active,
      },
    });

    // Generate outbox event for synchronization
    await this.generateCustomerEvent(customer, 'customer.upserted.v1');

    return customer;
  }

  async remove(id: string): Promise<void> {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Soft delete by setting active to false
    const customer = await this.prisma.customer.update({
      where: { id },
      data: { active: false },
    });

    // Generate outbox event for synchronization
    await this.generateCustomerEvent(customer, 'customer.deleted.v1');
  }

  private async generateCustomerEvent(customer: any, eventType: string): Promise<void> {
    const eventPayload = {
      id: customer.id,
      name: customer.name,
      documento: customer.documento,
      email: customer.email,
      phone: customer.phone,
      dataNascISO: customer.dataNascISO,
      tags: customer.tags,
      notes: customer.notes,
      address: customer.address,
      active: customer.active,
      createdAt: customer.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: customer.updatedAt?.toISOString(),
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
}
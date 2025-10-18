import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../common/events.service';
import { SaleResponseDto, CreateSaleDto, UpdateSaleDto } from './dto';

export interface SaleCreatedEventPayload {
  id: string;
  code: string;
  operator: string;
  paymentMethod: string; // Unified field name
  status?: string;
  total: number;
  customerId?: string;
  createdAt: string;
  updatedAt?: string;
  items: Array<{
    id: string;
    productId: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
    createdAt?: string;
  }>;
}

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(private readonly prisma: PrismaService, private readonly eventsService: EventsService) {}

  async upsertFromEvent(tenantId: string, eventPayload: SaleCreatedEventPayload): Promise<void> {
    this.logger.log(`Upserting sale ${eventPayload.id} for tenant: ${tenantId}`);

    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantId }
    });
    
    if (!tenant) {
      this.logger.error(`Tenant not found: ${tenantId}`);
      throw new Error(`Tenant not found: ${tenantId}`);
    }
    
    this.logger.log(`Found tenant: ${tenant.id} (slug: ${tenant.slug})`);

    // Validate required fields
    if (!eventPayload.createdAt || !eventPayload.code || !eventPayload.operator || 
        eventPayload.total === undefined || !eventPayload.paymentMethod) {
      this.logger.error('Missing required fields in sale event payload', eventPayload);
      throw new Error('Missing required fields in sale event payload');
    }

    // Validate dates
    const createdAt = new Date(eventPayload.createdAt);
    const updatedAt = eventPayload.updatedAt ? new Date(eventPayload.updatedAt) : createdAt;
    
    if (isNaN(createdAt.getTime())) {
      this.logger.error('Invalid createdAt date in sale event payload', eventPayload);
      throw new Error('Invalid createdAt date in sale event payload');
    }
    
    if (eventPayload.updatedAt && isNaN(updatedAt.getTime())) {
      this.logger.error('Invalid updatedAt date in sale event payload', eventPayload);
      throw new Error('Invalid updatedAt date in sale event payload');
    }

    await this.prisma.$transaction(async (tx: any) => {
      // Upsert the sale
      const sale = await tx.sale.upsert({
        where: {
          id: eventPayload.id,
        },
        create: {
          id: eventPayload.id,
          tenantId: tenant.id,
          saleNumber: eventPayload.code,
          saleDate: createdAt,
          total: eventPayload.total,
          status: eventPayload.status || 'completed',
          createdAt: createdAt,
          updatedAt: updatedAt,
        },
        update: {
          saleNumber: eventPayload.code,
          total: eventPayload.total,
          status: eventPayload.status || 'completed',
          updatedAt: new Date(),
        },
      });

      // Delete existing items and recreate them
      await tx.saleItem.deleteMany({
        where: {
          saleId: sale.id,
        },
      });

      // Create sale items
      for (const item of eventPayload.items) {
        await tx.saleItem.create({
          data: {
            id: item.id,
            saleId: sale.id,
            productId: item.productId,
            quantity: item.qty,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          },
        });
      }
    });

    this.logger.log(`Successfully upserted sale ${eventPayload.id} with ${eventPayload.items.length} items`);
  }

  async create(tenantId: string, createSaleDto: CreateSaleDto): Promise<SaleResponseDto> {
    this.logger.log(`Creating new sale for tenant: ${tenantId}`);

    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantId }
    });
    
    if (!tenant) {
      this.logger.error(`Tenant not found: ${tenantId}`);
      throw new NotFoundException(`Tenant not found: ${tenantId}`);
    }

    // Check if sale code already exists for this tenant
    if (createSaleDto.code) {
      const existingSale = await this.prisma.sale.findFirst({
        where: {
          saleNumber: createSaleDto.code,
          tenantId: tenant.id,
        },
      });

      if (existingSale) {
        throw new ConflictException(`Sale with code ${createSaleDto.code} already exists for tenant ${tenantId}`);
      }
    }

    const { v4: uuidv4 } = await import('uuid');
    const saleId = uuidv4();
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx: any) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: {
          id: saleId,
          tenantId: tenant.id,
          saleNumber: createSaleDto.code || `SALE-${Date.now()}`,
          saleDate: now,
          total: createSaleDto.total,
          status: createSaleDto.status || 'completed',
          createdAt: now,
          updatedAt: now,
        },
      });

      // Create sale items
      for (const item of createSaleDto.items) {
        const { v4: uuidv4 } = await import('uuid');
        await tx.saleItem.create({
          data: {
            id: uuidv4(),
            saleId: sale.id,
            productId: item.productId,
            quantity: item.qty,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          },
        });
      }

      return sale;
    });

    this.logger.log(`Successfully created sale ${saleId}`);
    const createdSale = await this.findOneByTenant(tenantId, saleId);
    await this.eventsService.createEvent(tenantId, {
      eventType: 'sale.created.v1',
      entityType: 'sale',
      entityId: createdSale.id,
      data: createdSale,
    });
    return createdSale;
  }

  async update(tenantId: string, saleId: string, updateSaleDto: UpdateSaleDto): Promise<SaleResponseDto> {
    this.logger.log(`Updating sale ${saleId} for tenant: ${tenantId}`);

    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantId }
    });
    
    if (!tenant) {
      this.logger.error(`Tenant not found: ${tenantId}`);
      throw new NotFoundException(`Tenant not found: ${tenantId}`);
    }

    // Check if sale exists
    const existingSale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        tenantId: tenant.id,
      },
    });

    if (!existingSale) {
      throw new NotFoundException(`Sale with ID ${saleId} not found for tenant ${tenantId}`);
    }

    // Check if new code conflicts with existing sales (if code is being updated)
    if (updateSaleDto.code && updateSaleDto.code !== existingSale.saleNumber) {
      const codeConflict = await this.prisma.sale.findFirst({
        where: {
          saleNumber: updateSaleDto.code,
          tenantId: tenant.id,
          id: { not: saleId },
        },
      });

      if (codeConflict) {
        throw new ConflictException(`Sale with code ${updateSaleDto.code} already exists for tenant ${tenantId}`);
      }
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx: any) => {
      // Update the sale
      await tx.sale.update({
        where: { id: saleId },
        data: {
          ...(updateSaleDto.code && { saleNumber: updateSaleDto.code }),
          ...(updateSaleDto.total !== undefined && { total: updateSaleDto.total }),
          ...(updateSaleDto.status && { status: updateSaleDto.status }),
          updatedAt: now,
        },
      });

      // Update items if provided
      if (updateSaleDto.items) {
        // Delete existing items
        await tx.saleItem.deleteMany({
          where: {
            saleId: saleId,
          },
        });

        // Create new items
        for (const itemDto of updateSaleDto.items) {
          const { v4: uuidv4 } = await import('uuid');
          await tx.saleItem.create({
            data: {
              id: uuidv4(),
              saleId: saleId,
              productId: itemDto.productId,
              quantity: itemDto.qty,
              unitPrice: itemDto.unitPrice,
              subtotal: itemDto.subtotal,
            },
          });
        }
      }
    });

    this.logger.log(`Successfully updated sale ${saleId}`);
    const updatedSale = await this.findOneByTenant(tenantId, saleId);
    await this.eventsService.createEvent(tenantId, {
      eventType: 'sale.updated.v1',
      entityType: 'sale',
      entityId: saleId,
      data: updatedSale,
    });
    return updatedSale;
  }

  async remove(tenantId: string, saleId: string): Promise<void> {
    this.logger.log(`Deleting sale ${saleId} for tenant: ${tenantId}`);

    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantId }
    });
    
    if (!tenant) {
      this.logger.error(`Tenant not found: ${tenantId}`);
      throw new NotFoundException(`Tenant not found: ${tenantId}`);
    }

    // Check if sale exists
    const existingSale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        tenantId: tenant.id,
      },
    });

    if (!existingSale) {
      throw new NotFoundException(`Sale with ID ${saleId} not found for tenant ${tenantId}`);
    }

    await this.prisma.$transaction(async (tx: any) => {
      // Delete sale items first (due to foreign key constraints)
      await tx.saleItem.deleteMany({
        where: {
          saleId: saleId,
        },
      });

      // Delete the sale
      await tx.sale.delete({
        where: { id: saleId },
      });
    });

    this.logger.log(`Successfully deleted sale ${saleId}`);
  }

  async findAllByTenant(tenantId: string): Promise<SaleResponseDto[]> {
    this.logger.log(`Fetching all sales for tenant: ${tenantId}`);

    const sales = await this.prisma.sale.findMany({
      where: { tenantId },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sales.map((sale: any) => ({
      id: sale.id,
      code: sale.saleNumber,
      operator: '',
      paymentMethod: '',
      status: sale.status,
      total: Number(sale.total),
      customerId: sale.customerId ?? undefined,
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
      items: sale.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        qty: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        createdAt: sale.saleDate.toISOString(),
      })),
    }));
  }

  async findOneByTenant(tenantId: string, saleId: string): Promise<SaleResponseDto> {
    this.logger.log(`Fetching sale ${saleId} for tenant: ${tenantId}`);

    const sale = await this.prisma.sale.findFirst({
      where: { 
        id: saleId,
        tenantId 
      },
      include: {
        items: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${saleId} not found for tenant ${tenantId}`);
    }

    return {
      id: sale.id,
      code: sale.saleNumber,
      operator: '',
      paymentMethod: '',
      status: sale.status,
      total: Number(sale.total),
      customerId: sale.customerId ?? undefined,
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
      items: sale.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        qty: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        createdAt: sale.saleDate.toISOString(),
      })),
    };
  }
}
import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { SaleResponseDto, CreateSaleDto, UpdateSaleDto } from './dto';
import { v4 as uuidv4 } from 'uuid';

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

  constructor(private readonly prisma: PrismaService) {}

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
          code: eventPayload.code,
          date: createdAt,
          operator: eventPayload.operator,
          total: eventPayload.total,
          paymentMethod: eventPayload.paymentMethod,
          status: eventPayload.status || 'completed',
          createdAt: createdAt,
          updatedAt: updatedAt,
        },
        update: {
          code: eventPayload.code,
          operator: eventPayload.operator,
          total: eventPayload.total,
          paymentMethod: eventPayload.paymentMethod,
          status: eventPayload.status || 'completed',
          updatedAt: new Date(),
        },
      });

      // Delete existing items and recreate them
      await tx.saleItem.deleteMany({
        where: {
          saleId: sale.id,
          tenantId: tenant.id,
        },
      });

      // Create sale items
      for (const item of eventPayload.items) {
        await tx.saleItem.create({
          data: {
            id: item.id,
            tenantId: tenant.id,
            saleId: sale.id,
            productId: item.productId,
            qty: item.qty,
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
          code: createSaleDto.code,
          tenantId: tenant.id,
        },
      });

      if (existingSale) {
        throw new ConflictException(`Sale with code ${createSaleDto.code} already exists for tenant ${tenantId}`);
      }
    }

    const saleId = uuidv4();
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx: any) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: {
          id: saleId,
          tenantId: tenant.id,
          code: createSaleDto.code || `SALE-${Date.now()}`,
          date: now,
          operator: createSaleDto.operator,
          total: createSaleDto.total,
          paymentMethod: createSaleDto.paymentMethod,
          status: createSaleDto.status || 'completed',
          createdAt: now,
          updatedAt: now,
        },
      });

      // Create sale items
      for (const item of createSaleDto.items) {
        await tx.saleItem.create({
          data: {
            id: uuidv4(),
            tenantId: tenant.id,
            saleId: sale.id,
            productId: item.productId,
            qty: item.qty,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          },
        });
      }

      return sale;
    });

    this.logger.log(`Successfully created sale ${saleId}`);
    return this.findOneByTenant(tenantId, saleId);
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
    if (updateSaleDto.code && updateSaleDto.code !== existingSale.code) {
      const codeConflict = await this.prisma.sale.findFirst({
        where: {
          code: updateSaleDto.code,
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
          ...(updateSaleDto.code && { code: updateSaleDto.code }),
          ...(updateSaleDto.operator && { operator: updateSaleDto.operator }),
          ...(updateSaleDto.total !== undefined && { total: updateSaleDto.total }),
          ...(updateSaleDto.paymentMethod && { paymentMethod: updateSaleDto.paymentMethod }),
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
            tenantId: tenant.id,
          },
        });

        // Create new items
        for (const itemDto of updateSaleDto.items) {
          await tx.saleItem.create({
            data: {
              id: uuidv4(),
              tenantId: tenant.id,
              saleId: saleId,
              productId: itemDto.productId,
              qty: itemDto.qty,
              unitPrice: itemDto.unitPrice,
              subtotal: itemDto.subtotal,
              createdAt: now,
            },
          });
        }
      }
    });

    this.logger.log(`Successfully updated sale ${saleId}`);
    return this.findOneByTenant(tenantId, saleId);
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
          tenantId: tenant.id,
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
      code: sale.code,
      operator: sale.operator,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      total: Number(sale.total),
      customerId: undefined,
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
      items: sale.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        qty: item.qty,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        createdAt: item.createdAt.toISOString(),
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
      code: sale.code,
      operator: sale.operator,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      total: Number(sale.total),
      customerId: undefined,
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
      items: sale.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        qty: item.qty,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
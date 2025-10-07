import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { SaleResponseDto } from './dto';

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

    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = '${tenant.id}'`;

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
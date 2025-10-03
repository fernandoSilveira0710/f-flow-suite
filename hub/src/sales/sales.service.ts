import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
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

  constructor(private readonly prisma: PrismaClient) {}

  async upsertFromEvent(tenantId: string, eventPayload: SaleCreatedEventPayload): Promise<void> {
    this.logger.log(`Upserting sale ${eventPayload.id} for tenant: ${tenantId}`);

    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = ${tenantId}`;

    await this.prisma.$transaction(async (tx: any) => {
      // Upsert the sale
      const sale = await tx.sale.upsert({
        where: {
          id: eventPayload.id,
        },
        create: {
          id: eventPayload.id,
          tenantId,
          code: eventPayload.code,
          date: new Date(eventPayload.createdAt),
          operator: eventPayload.operator,
          total: eventPayload.total,
          paymentMethod: eventPayload.paymentMethod,
          status: eventPayload.status || 'completed',
          createdAt: new Date(eventPayload.createdAt),
          updatedAt: eventPayload.updatedAt ? new Date(eventPayload.updatedAt) : new Date(eventPayload.createdAt),
        },
        update: {
          code: eventPayload.code,
          operator: eventPayload.operator,
          total: eventPayload.total,
          paymentMethod: eventPayload.paymentMethod,
          status: eventPayload.status || 'completed',
          updatedAt: eventPayload.updatedAt ? new Date(eventPayload.updatedAt) : new Date(),
        },
      });

      // Delete existing items and recreate them
      await tx.saleItem.deleteMany({
        where: {
          saleId: sale.id,
          tenantId,
        },
      });

      // Create sale items
      for (const item of eventPayload.items) {
        await tx.saleItem.create({
          data: {
            id: item.id,
            tenantId,
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
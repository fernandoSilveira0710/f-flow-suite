import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SaleResponseDto } from './dto';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(private readonly prisma: PrismaClient) {}

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
import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { InventoryAdjustmentResponseDto, InventoryLevelResponseDto } from './dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processInventoryAdjustmentEvent(tenantId: string, payload: any): Promise<void> {
    this.logger.debug(`Processing inventory adjustment event for tenant ${tenantId}`);

    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = '${tenantId}'`;

    // Create inventory adjustment record
    await this.prisma.inventoryAdjustment.create({
      data: {
        id: payload.id,
        tenantId,
        productId: payload.productId,
        productName: payload.productName,
        productSku: payload.productSku,
        delta: payload.delta,
        reason: payload.reason,
        previousStock: payload.previousStock,
        newStock: payload.newStock,
        adjustedAt: new Date(payload.adjustedAt),
      },
    });

    this.logger.debug(`Created inventory adjustment record for product ${payload.productId}`);
  }

  async findAllByTenant(tenantId: string): Promise<InventoryAdjustmentResponseDto[]> {
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = '${tenantId}'`;

    const adjustments = await this.prisma.inventoryAdjustment.findMany({
      where: { tenantId },
      orderBy: { adjustedAt: 'desc' },
    });

    return adjustments.map(this.mapToResponseDto);
  }

  async findByProduct(tenantId: string, productId: string): Promise<InventoryAdjustmentResponseDto[]> {
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = '${tenantId}'`;

    const adjustments = await this.prisma.inventoryAdjustment.findMany({
      where: { 
        tenantId,
        productId 
      },
      orderBy: { adjustedAt: 'desc' },
    });

    return adjustments.map(this.mapToResponseDto);
  }

  async getInventoryLevels(tenantId: string): Promise<InventoryLevelResponseDto[]> {
    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET app.tenant_id = '${tenantId}'`;

    // Get latest stock levels from products table
    const products = await this.prisma.product.findMany({
      where: { 
        tenantId,
        active: true 
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQty: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return products.map((product: any) => ({
      productId: product.id,
      tenantId,
      productName: product.name,
      productSku: product.sku,
      currentStock: product.stockQty,
      lastUpdated: product.updatedAt,
    }));
  }

  private mapToResponseDto(adjustment: any): InventoryAdjustmentResponseDto {
    return {
      id: adjustment.id,
      tenantId: adjustment.tenantId,
      productId: adjustment.productId,
      productName: adjustment.productName,
      productSku: adjustment.productSku,
      delta: adjustment.delta,
      reason: adjustment.reason,
      previousStock: adjustment.previousStock,
      newStock: adjustment.newStock,
      adjustedAt: adjustment.adjustedAt,
      createdAt: adjustment.createdAt,
      updatedAt: adjustment.updatedAt,
    };
  }
}
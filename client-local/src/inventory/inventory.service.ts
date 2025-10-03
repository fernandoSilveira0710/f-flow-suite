import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  AdjustInventoryDto,
  InventoryLevelDto,
  AdjustInventoryResponseDto,
  InventoryAdjustmentResponseDto,
} from './dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaClient) {}

  async adjustInventory(adjustInventoryDto: AdjustInventoryDto): Promise<AdjustInventoryResponseDto> {
    const { adjustments } = adjustInventoryDto;
    const results: InventoryAdjustmentResponseDto[] = [];

    // Process each adjustment in a transaction
    await this.prisma.$transaction(async (tx) => {
      for (const adjustment of adjustments) {
        // Verify product exists
        const product = await tx.product.findUnique({
          where: { id: adjustment.productId },
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${adjustment.productId} not found`);
        }

        // Create inventory adjustment record
        const inventoryAdjustment = await tx.inventoryAdjustment.create({
          data: {
            productId: adjustment.productId,
            delta: adjustment.delta,
            reason: adjustment.reason,
          },
        });

        // Update product stock quantity
        await tx.product.update({
          where: { id: adjustment.productId },
          data: {
            stockQty: {
              increment: adjustment.delta,
            },
          },
        });

        results.push({
          id: inventoryAdjustment.id,
          productId: inventoryAdjustment.productId,
          delta: inventoryAdjustment.delta,
          reason: inventoryAdjustment.reason,
          createdAt: inventoryAdjustment.createdAt,
        });
      }
    });

    return {
      adjustments: results,
      message: `Successfully processed ${results.length} inventory adjustments`,
    };
  }

  async getInventoryLevel(productId: string): Promise<InventoryLevelDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        stockQty: true,
        updatedAt: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return {
      productId: product.id,
      productName: product.name,
      currentStock: product.stockQty,
      lastUpdated: product.updatedAt,
    };
  }

  async getAllInventoryLevels(): Promise<InventoryLevelDto[]> {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        stockQty: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => ({
      productId: product.id,
      productName: product.name,
      currentStock: product.stockQty,
      lastUpdated: product.updatedAt,
    }));
  }
}

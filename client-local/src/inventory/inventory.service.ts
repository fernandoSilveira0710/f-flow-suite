import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventValidatorService } from '../common/validation/event-validator.service';
import {
  AdjustInventoryDto,
  InventoryLevelDto,
  AdjustInventoryResponseDto,
  InventoryAdjustmentResponseDto,
} from './dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventValidator: EventValidatorService,
  ) {}

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

        // Generate inventory adjustment event
        await this.generateInventoryEvent(inventoryAdjustment, product);
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

  private async generateInventoryEvent(inventoryAdjustment: any, product: any): Promise<void> {
    const eventPayload = {
      id: inventoryAdjustment.id,
      productId: inventoryAdjustment.productId,
      productName: product.name,
      productSku: product.sku,
      delta: inventoryAdjustment.delta,
      reason: inventoryAdjustment.reason,
      previousStock: product.stockQty - inventoryAdjustment.delta,
      newStock: product.stockQty,
      adjustedAt: inventoryAdjustment.createdAt?.toISOString() || new Date().toISOString(),
    };

    // Validate event payload using Ajv
    const validationResult = this.eventValidator.validateEvent('inventory.adjusted.v1', eventPayload);
    if (!validationResult.valid) {
      this.logger.error(`Event validation failed for inventory.adjusted.v1:`, validationResult.errors);
      throw new Error(`Invalid event payload: ${validationResult.errors?.join(', ')}`);
    }

    // Persist event to OutboxEvent table
    await this.prisma.outboxEvent.create({
      data: {
        aggregate: 'inventory',
        aggregateId: inventoryAdjustment.id,
        type: 'inventory.adjusted.v1',
        payload: JSON.stringify(eventPayload),
        occurredAt: new Date(),
      },
    });

    this.logger.debug(`Generated inventory.adjusted.v1 event for adjustment ${inventoryAdjustment.id}`);
  }
}

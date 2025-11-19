import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
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

  private wrapPrismaError(err: unknown, context: string): never {
    const message = err instanceof Error ? err.message : String(err);
    const trace = err instanceof Error ? err.stack : undefined;
    this.logger.error(`Prisma error in ${context}: ${message}`, trace);
    throw new BadRequestException(`Falha ao processar inventário (${context}): ${message}`);
  }

  async adjustInventory(adjustInventoryDto: AdjustInventoryDto): Promise<AdjustInventoryResponseDto> {
    try {
      const { adjustments } = adjustInventoryDto;

      if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
        throw new BadRequestException('Payload inválido: "adjustments" deve ser um array com pelo menos um item.');
      }

      const results: InventoryAdjustmentResponseDto[] = [];
      const eventsToGenerate: { inventoryAdjustment: any; product: any }[] = [];

      // Process each adjustment in a transaction
      try {
        await this.prisma.$transaction(async (tx) => {
          for (const adjustment of adjustments) {
            try {
              // Verify product exists
              const product = await tx.product.findUnique({
                where: { id: adjustment.productId },
                select: { id: true, name: true, sku: true, stockQty: true },
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
                  notes: adjustment.notes ?? null,
                  document: adjustment.document ?? null,
                  unitCost: adjustment.unitCost !== undefined ? adjustment.unitCost : null,
                },
              });

              // Update product stock quantity
              await tx.product.update({
                where: { id: adjustment.productId },
                data: {
                  stockQty: {
                    increment: adjustment.delta,
                  },
                  ...(adjustment.unitCost !== undefined && adjustment.delta > 0
                    ? { costPrice: adjustment.unitCost }
                    : {}),
                },
                select: { id: true },
              });

              results.push({
                id: inventoryAdjustment.id,
                productId: inventoryAdjustment.productId,
                delta: inventoryAdjustment.delta,
                reason: inventoryAdjustment.reason,
                notes: inventoryAdjustment.notes ?? undefined,
                document: inventoryAdjustment.document ?? undefined,
                unitCost:
                  inventoryAdjustment.unitCost !== null && inventoryAdjustment.unitCost !== undefined
                    ? Number(inventoryAdjustment.unitCost)
                    : undefined,
                createdAt: inventoryAdjustment.createdAt,
              });

              // Queue inventory adjustment event to be generated after transaction commits
              eventsToGenerate.push({ inventoryAdjustment, product });
            } catch (err) {
              this.wrapPrismaError(err, 'transaction');
            }
          }
        });
      } catch (err) {
        this.wrapPrismaError(err, '$transaction');
      }

      // Generate inventory adjustment events after transaction commits
      for (const { inventoryAdjustment, product } of eventsToGenerate) {
        try {
          await this.generateInventoryEvent(inventoryAdjustment, product);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const trace = err instanceof Error ? err.stack : undefined;
          this.logger.error(`Falha ao gerar evento de inventário para ajuste ${inventoryAdjustment.id}: ${message}`, trace);
          // Não falhar a operação principal por falha de geração de evento
        }
      }

      return {
        adjustments: results,
        message: `Successfully processed ${results.length} inventory adjustments`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const trace = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Erro ao ajustar inventário: ${message}`, trace);
      throw error;
    }
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
      productSku: product.sku ?? null,
      delta: inventoryAdjustment.delta,
      reason: inventoryAdjustment.reason,
      previousStock: product.stockQty,
      newStock: product.stockQty + inventoryAdjustment.delta,
      adjustedAt: inventoryAdjustment.createdAt?.toISOString() || new Date().toISOString(),
    };

    // Validate event payload using Ajv
    const validationResult = this.eventValidator.validateEvent('inventory.adjusted.v1', eventPayload);
    if (!validationResult.valid) {
      this.logger.error(`Event validation failed for inventory.adjusted.v1:`, validationResult.errors);
      throw new BadRequestException(`Invalid event payload: ${validationResult.errors?.join(', ')}`);
    }

    // Persist event to OutboxEvent table
    await this.prisma.outboxEvent.create({
      data: {
        eventType: 'inventory.adjusted.v1',
        payload: JSON.stringify(eventPayload),
      },
    });

    this.logger.debug(`Generated inventory.adjusted.v1 event for adjustment ${inventoryAdjustment.id}`);
  }

  // Lista todos os ajustes de inventário
  async getAllAdjustments(): Promise<InventoryAdjustmentResponseDto[]> {
    try {
      const adjustments = await this.prisma.inventoryAdjustment.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
        },
      });

      return adjustments.map((adj) => ({
        id: adj.id,
        productId: adj.productId,
        delta: adj.delta,
        reason: adj.reason,
        notes: adj.notes ?? undefined,
        document: adj.document ?? undefined,
        unitCost: adj.unitCost !== null && adj.unitCost !== undefined ? Number(adj.unitCost) : undefined,
        createdAt: adj.createdAt,
        // Campos extras para enriquecer resposta
        productName: adj.product?.name ?? undefined,
        productSku: adj.product?.sku ?? undefined,
      } as any));
    } catch (err) {
      this.wrapPrismaError(err, 'getAllAdjustments');
    }
  }

  // Lista ajustes de inventário por produto
  async getAdjustmentsByProduct(productId: string): Promise<InventoryAdjustmentResponseDto[]> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      const adjustments = await this.prisma.inventoryAdjustment.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
        },
      });

      return adjustments.map((adj) => ({
        id: adj.id,
        productId: adj.productId,
        delta: adj.delta,
        reason: adj.reason,
        notes: adj.notes ?? undefined,
        document: adj.document ?? undefined,
        unitCost: adj.unitCost !== null && adj.unitCost !== undefined ? Number(adj.unitCost) : undefined,
        createdAt: adj.createdAt,
        // Campos extras para enriquecer resposta
        productName: adj.product?.name ?? undefined,
        productSku: adj.product?.sku ?? undefined,
      } as any));
    } catch (err) {
      this.wrapPrismaError(err, 'getAdjustmentsByProduct');
    }
  }
}

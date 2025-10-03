import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';

interface OutboxEvent {
  id: string;
  aggregate: string;
  type: string;
  payload: string;
  occurredAt: Date;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly inventoryService: InventoryService,
  ) {}

  async ingestEvents(tenantId: string, events: OutboxEvent[]): Promise<void> {
    this.logger.debug(`Ingesting ${events.length} events for tenant ${tenantId}`);

    for (const event of events) {
      await this.processEvent(tenantId, event);
    }
  }

  private async processEvent(tenantId: string, event: OutboxEvent): Promise<void> {
    const payload = JSON.parse(event.payload);

    switch (event.type) {
      case 'product.upserted.v1':
        await this.productsService.upsertFromEvent(tenantId, payload);
        break;
      case 'product.deleted.v1':
        await this.productsService.deleteFromEvent(tenantId, payload);
        break;
      case 'inventory.adjusted.v1':
        await this.inventoryService.processInventoryAdjustmentEvent(tenantId, payload);
        break;
      default:
        this.logger.warn(`Unknown event type: ${event.type}`);
    }
  }

  async fetchCommands(tenantId: string, limit = 100): Promise<Record<string, unknown>[]> {
    this.logger.debug(`Pulling commands for tenant ${tenantId}`);
    return [];
  }
}

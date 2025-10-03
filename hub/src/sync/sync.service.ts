import { Injectable, Logger } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { SalesService } from '../sales/sales.service';

export interface OutboxEvent {
  id: string;
  aggregate: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly salesService: SalesService,
  ) {}

  async ingestEvents(tenantId: string, events: OutboxEvent[]): Promise<void> {
    this.logger.debug(`Received ${events.length} events from tenant ${tenantId}`);
    
    for (const event of events) {
      try {
        await this.processEvent(tenantId, event);
        this.logger.debug(`Processed event ${event.id} of type ${event.type}`);
      } catch (error) {
        this.logger.error(`Failed to process event ${event.id}:`, error);
        // In production, you might want to add the event to a DLQ
      }
    }
  }

  private async processEvent(tenantId: string, event: OutboxEvent): Promise<void> {
    switch (event.type) {
      case 'product.upserted.v1':
        await this.productsService.upsertFromEvent(tenantId, event.payload);
        break;
      case 'product.deleted.v1':
        await this.productsService.deleteFromEvent(tenantId, (event.payload as any).id);
        break;
      case 'sale.created.v1':
        await this.processSaleCreatedEvent(tenantId, event.payload);
        break;
      default:
        this.logger.warn(`Unknown event type: ${event.type}`);
    }
  }

  private async processSaleCreatedEvent(tenantId: string, payload: Record<string, unknown>): Promise<void> {
    this.logger.debug(`Processing sale.created.v1 event for tenant ${tenantId}`);
    
    try {
      await this.salesService.upsertFromEvent(tenantId, payload as any);
      this.logger.log(`Successfully processed sale.created.v1 event for tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to process sale.created.v1 event for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async fetchCommands(tenantId: string, limit = 100): Promise<Record<string, unknown>[]> {
    this.logger.debug(`Pulling commands for tenant ${tenantId}`);
    return [];
  }
}

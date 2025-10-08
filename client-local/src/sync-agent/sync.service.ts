import { Injectable, Logger } from '@nestjs/common';
import { SyncHttpClient } from './http.client';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly http: SyncHttpClient,
    private readonly prisma: PrismaService
  ) {}

  private getAggregateFromEventType(eventType: string): string {
    // Extract aggregate from event type (e.g., 'sale.created.v1' -> 'sale')
    const parts = eventType.split('.');
    return parts[0] || 'unknown';
  }

  async pushOutbox(events?: Record<string, unknown>[]) {
    // Check if sync is enabled
    if (process.env.SYNC_ENABLED === 'false') {
      this.logger.debug('Sync is disabled (SYNC_ENABLED=false), skipping push');
      return { accepted: 0, message: 'Sync disabled' };
    }

    // If no events provided, fetch from database
    if (!events) {
      const outboxEvents = await this.prisma.outboxEvent.findMany({
        where: { processed: false },
        take: 100,
        orderBy: { createdAt: 'asc' }
      });

      if (outboxEvents.length === 0) {
        return { accepted: 0 };
      }

      // Transform database events to the format expected by hub
      events = outboxEvents.map(event => ({
        id: event.id,
        aggregate: this.getAggregateFromEventType(event.eventType),
        type: event.eventType,
        payload: JSON.parse(event.payload),
        occurredAt: event.createdAt.toISOString()
      }));
    }

    if (events.length === 0) {
      return { accepted: 0 };
    }

    const tenantId = process.env.TENANT_ID ?? 'unknown';
    this.logger.debug(`Sending ${events.length} events to hub for tenant ${tenantId}`);
    
    try {
      const result = await this.http.post(`/tenants/${tenantId}/sync/events`, { events });
      
      // Mark events as processed if they came from database
      if (!arguments[0]) { // If no events were provided as parameter
        const eventIds = events.map(e => e.id as string);
        await this.prisma.outboxEvent.updateMany({
          where: { id: { in: eventIds } },
          data: { 
            processed: true,
            processedAt: new Date()
          }
        });
      }
      
      return result;
    } catch (error) {
      this.logger.error('Failed to push events to hub', error);
      throw error;
    }
  }

  async pullCommands(limit = 100) {
    // Check if sync is enabled
    if (process.env.SYNC_ENABLED === 'false') {
      this.logger.debug('Sync is disabled (SYNC_ENABLED=false), skipping pull');
      return { commands: [], message: 'Sync disabled' };
    }

    const tenantId = process.env.TENANT_ID ?? 'unknown';
    this.logger.debug(`Pulling commands from hub for tenant ${tenantId}`);
    return this.http.get(`/tenants/${tenantId}/sync/commands`, { limit });
  }
}
